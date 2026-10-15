'use strict';
const $=id=>document.getElementById(id),api=window.VitrineCatalog;
let products=[],editing=null,pendingId=null,photoData='',photoBusy=false,photoTask=0,busy=false,loggedIn=false,initialized=false;
function message(text,error=false){$('message').textContent=text;$('message').dataset.error=String(error)}
function lock(value){busy=value;document.querySelectorAll('button,input,select').forEach(b=>b.disabled=value);$('publish').disabled=value||photoBusy;updateEmailWait();updatePasswordWait()}
let emailWasWaiting=false,emailWaitFinished=false;
function updateEmailWait(){
 const state=api.emailWaitState(),button=$('send-link'),notice=$('email-wait');notice.hidden=!state;
 button.disabled=busy||!!state;
 if(!state){if(emailWasWaiting){emailWaitFinished=true;emailWasWaiting=false}button.textContent='RECEBER LINK DE ACESSO';notice.hidden=!emailWaitFinished;notice.textContent=emailWaitFinished?'A espera indicada terminou. Você pode pedir outro link; o Supabase ainda verificará se o limite já foi liberado.':'';return}
 emailWasWaiting=true;emailWaitFinished=false;
 const mins=Math.floor(state.seconds/60),secs=String(state.seconds%60).padStart(2,'0');
 button.textContent='AGUARDE '+mins+':'+secs;
 const until=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(state.until));
 const why=state.kind==='email'?'O limite de e-mails do serviço foi atingido. ':state.kind==='sent'?'Seu pedido foi enviado. Confira a caixa de entrada e o spam. ':state.kind==='network'?'A conexão caiu e não sabemos se o e-mail foi enviado. Confira a caixa de entrada antes de tentar de novo. ': 'Muitos pedidos em pouco tempo. ';
 notice.textContent=why+'Nova tentativa '+(state.estimated?'sugerida':'permitida pelo prazo informado')+' às '+until+' (horário deste celular). '+(state.estimated?'Estimativa: o serviço não informou a hora exata de liberação; uma nova tentativa ainda pode ser limitada.':'Prazo informado pelo serviço; a tentativa ainda passará pelas proteções normais.')+' Não é preciso atualizar a página. Use somente o e-mail mais recente e não reutilize um link já aberto.';
}
function tickEmailWait(){updateEmailWait();updatePasswordWait();const timer=setTimeout(tickEmailWait,1000);timer?.unref?.()}
window.addEventListener('storage',updateEmailWait);
let passwordWaitUntil=0;
function updatePasswordWait(){
 const seconds=Math.max(0,Math.ceil((passwordWaitUntil-Date.now())/1000));$('password-submit').disabled=busy||seconds>0;$('password-wait').hidden=seconds===0;
 $('password-submit').textContent=seconds?'AGUARDE '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'ENTRAR COM SENHA';
 $('password-wait').textContent=seconds?'O Supabase limitou as tentativas de senha. Aguarde a contagem. Se o servidor não informou um prazo, a espera é estimada e a próxima tentativa será reavaliada.':'';
}
$('github-login').onclick=async()=>{if(busy)return;lock(true);message('Verificando a conexão com o GitHub…');try{await api.githubLogin()}catch(e){message(e.message,true);lock(false)}};
$('password-login').onsubmit=async e=>{
 e.preventDefault();if(busy)return;if(passwordWaitUntil>Date.now()){updatePasswordWait();return}
 const password=$('access-password').value;$('access-password').value='';lock(true);message('Verificando seu acesso com segurança…');
 try{await api.passwordLogin($('email').value.trim(),password);loggedIn=true;await load();openEditor();message('Você entrou! Agora pode publicar suas roupas.')}catch(e){loggedIn=false;if(e.waitSeconds)passwordWaitUntil=Date.now()+e.waitSeconds*1000;$('login-box').hidden=false;render();message(e.message,true)}finally{lock(false)}
};
function money(value){return value===null?'Preço a confirmar':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value)}
function isActive(){return loggedIn&&initialized}
function render(){
 $('count').textContent='('+products.length+')';$('list').replaceChildren();
 products.forEach(p=>{const row=document.createElement('article');row.className='product';let image;
 if(p.imageUrl&&api.safeImage(p.imageUrl)){image=document.createElement('img');image.src=p.imageUrl;image.alt=p.name;image.loading='lazy';image.onerror=()=>{const x=document.createElement('span');x.className='placeholder';x.textContent='Foto indisponível';image.replaceWith(x)}}else{image=document.createElement('span');image.className='placeholder';image.textContent='Foto em breve'}
 const body=document.createElement('div'),name=document.createElement('h3'),price=document.createElement('p'),badge=document.createElement('span');name.textContent=p.name;price.textContent=money(p.price);badge.className='badge';badge.textContent=p.affiliateUrl?'Na vitrine':'Aguardando link';body.append(name,price,badge);
 if(isActive()){const actions=document.createElement('div');actions.className='actions';const edit=document.createElement('button');edit.textContent='Editar';edit.className='secondary';edit.onclick=()=>openEditor(p.id);const remove=document.createElement('button');remove.className='danger';remove.textContent='Excluir';remove.onclick=()=>removeProduct(p);actions.append(edit,remove);body.append(actions)}row.append(image,body);$('list').append(row)});
 if(!products.length)$('list').textContent='Sua vitrine está pronta para a primeira roupa.';
 $('editor-box').hidden=!isActive();$('new').hidden=!isActive();$('logout').hidden=!loggedIn;
 $('migration').hidden=!loggedIn||initialized;$('migration-description').textContent='Encontramos '+products.length+' roupas na sua vitrine. Toque abaixo para ativar a publicação direta.';
 $('list-help').textContent=isActive()?'Edite ou exclua uma roupa quando precisar.':'Entre com seu e-mail autorizado para administrar suas roupas. Seus produtos estão preservados.';
}
async function load(){const state=await api.catalog();products=state.products;initialized=state.initialized;$('connect').hidden=state.configured;$('login-box').hidden=!state.configured||loggedIn;render();return state}
function openEditor(id=null){photoTask++;photoBusy=false;editing=products.find(p=>p.id===id)||null;pendingId=editing?.id||crypto.randomUUID();photoData=editing?.imageUrl||'';$('name').value=editing?.name||'';$('price').value=editing?.price===null||editing?.price===undefined?'':String(editing.price).replace('.',',');$('affiliateUrl').value=editing?.affiliateUrl||'';$('category').value=editing?.category||'Moda';$('photo').value='';$('preview').hidden=!photoData;if(photoData)$('preview').src=photoData;$('form-title').textContent=editing?'Editar roupa':'Adicionar uma roupa';$('publish').textContent=editing?'SALVAR ALTERAÇÕES':'PUBLICAR PRODUTO';$('cancel').hidden=!editing;$('edit-note').textContent=editing?'A alteração aparece na vitrine após a confirmação.':'O produto aparece na vitrine após a confirmação da publicação.';if(isActive())$('editor-box').scrollIntoView({block:'start'})}
async function photo(file){if(!file)return;if(!file.type.startsWith('image/'))throw Error('Escolha uma foto da galeria.');if(file.size>25*1024*1024)throw Error('Esta foto é muito grande. Escolha uma imagem menor.');const blobUrl=URL.createObjectURL(file);try{const image=new Image();image.src=blobUrl;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error();const scale=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',0.82);if(data.length>2800000)throw Error('Foto muito grande. Escolha uma imagem menor.');return data}finally{URL.revokeObjectURL(blobUrl)}}
$('photo').onchange=async()=>{const task=++photoTask;photoBusy=true;$('publish').disabled=true;try{const next=await photo($('photo').files[0]);if(next&&task===photoTask){photoData=next;$('preview').src=photoData;$('preview').hidden=false;message('Foto pronta. Preencha os dados e publique.')}}catch(e){if(task===photoTask){$('photo').value='';message(e.message||'Não conseguimos abrir a foto. Tente uma imagem JPG ou PNG.',true)}}finally{if(task===photoTask){photoBusy=false;$('publish').disabled=busy}}};
$('login').onsubmit=async e=>{e.preventDefault();if(busy)return;if(!$('email').reportValidity())return;if(api.emailWaitState()){updateEmailWait();message('Aguarde a contagem abaixo antes de pedir outro e-mail.',true);return}lock(true);message('Enviando seu acesso por e-mail…');try{await api.sendCode($('email').value.trim());$('mail-help').hidden=false;message('Se o e-mail estiver autorizado, você receberá um link de acesso. Abra sua caixa de entrada e toque no link.')}catch(e){message(e.message,true)}finally{lock(false)}};
$('activate').onclick=async()=>{if(!confirm('Ativar sua seleção atual para publicar diretamente pelo painel?'))return;lock(true);message('Ativando suas roupas, fotos e links…');try{await api.initialize();await load();openEditor();message('Catálogo ativado! Suas roupas já estão na vitrine.')}catch(e){message(e.message,true)}finally{lock(false)}};
function sameProduct(a,b){return ['id','name','price','category','imageUrl','affiliateUrl'].every(key=>a[key]===b[key])}
$('product-form').onsubmit=async e=>{e.preventDefault();if(!isActive()||busy||photoBusy)return;let product;try{const value=$('price').value.trim().replace(/^R\$\s*/i,'');if(!/^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/.test(value))throw Error('Digite o preço assim: 108,68.');product={...(editing||{}),id:editing?.id||pendingId||crypto.randomUUID(),name:$('name').value.trim(),price:Number(value.replace(/\./g,'').replace(',','.')),imageUrl:photoData,affiliateUrl:$('affiliateUrl').value.trim(),category:$('category').value};delete product._version;pendingId=product.id;if(!editing&&(!product.imageUrl||!product.affiliateUrl))throw Error('Escolha a foto e cole o link de afiliada antes de publicar.');api.validate(product)}catch(e){message(e.message,true);return}
 lock(true);message(editing?'Salvando suas alterações…':'Publicando sua roupa…');
 try{if(product.imageUrl.startsWith('data:')&&product.imageUrl!==editing?.imageUrl){const uploaded=await api.uploadPhoto(product.imageUrl);product.imageUrl=uploaded;photoData=uploaded}const saved=await api.save(product,editing?._version);products=products.some(p=>p.id===saved.id)?products.map(p=>p.id===saved.id?saved:p):[...products,saved];render();openEditor();message('Publicado! A roupa já está na sua vitrine. Toque em “Ver vitrine” para conferir.')}
 catch(e){let confirmed=false;try{const state=await api.catalog();const found=state.products.find(p=>p.id===product.id);if(found&&sameProduct(found,product)){products=state.products;render();openEditor();message('Publicado! Confirmamos a roupa na sua vitrine.');confirmed=true}}catch{}if(!confirmed)message(e.message+' Seus campos foram mantidos para você tentar novamente.',true)}
 finally{lock(false)}};
async function removeProduct(p){if(busy||!confirm('Excluir “'+p.name+'” da vitrine?'))return;lock(true);message('Excluindo a roupa…');try{const result=await api.remove(p.id,p._version);if(!result?.archived)throw Error('Exclusão ainda não confirmada. Atualize a lista.');products=products.filter(x=>x.id!==p.id);if(editing?.id===p.id)openEditor();render();message('Roupa excluída da vitrine. Uma cópia de recuperação foi preservada no serviço.')}catch(e){message(e.message,true)}finally{lock(false)}}
$('new').onclick=()=>{openEditor();message('Escolha a foto da próxima roupa.')};$('cancel').onclick=()=>openEditor();
$('refresh').onclick=async()=>{lock(true);try{await load();message('Lista atualizada.')}catch(e){message(e.message,true)}finally{lock(false)}};
$('logout').onclick=async()=>{lock(true);try{await api.logout()}catch{}finally{loggedIn=false;editing=null;photoData='';$('product-form').reset();$('preview').removeAttribute('src');$('preview').hidden=true;$('login-box').hidden=false;render();lock(false);message('Você saiu do painel. Suas roupas continuam publicadas.')}};
$('check-connection').onclick=()=>location.reload();
(async()=>{try{loggedIn=await api.resumeLogin();const state=await load();if(loggedIn)openEditor();message(loggedIn?'Pronto! Você já pode publicar suas roupas.':state.configured?'Entre com sua conta do GitHub após concluir a conexão inicial.':'Suas roupas estão preservadas. Falta apenas conectar a publicação uma vez.')}catch(e){loggedIn=false;try{await load()}catch{}message(e.message,true)}})();


tickEmailWait();

window.addEventListener('pageshow',e=>{if(e.persisted)lock(false)});
