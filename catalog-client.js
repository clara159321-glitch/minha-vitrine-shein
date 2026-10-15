/* Somente chave pública aqui; sessão de login apenas em memória. */
(function(global){
'use strict';
let configuration,session=null;
const waitKey='vitrine-email-wait-v1';
let emailWait=null,emailSending=false;
function readEmailWait(){try{const saved=JSON.parse(global.localStorage.getItem(waitKey)||'null');if(saved&&Number.isFinite(saved.until)&&saved.until>Date.now()&&saved.until<=Date.now()+86400000&&['sent','email','requests','network'].includes(saved.kind))return saved}catch{}return null}
function emailWaitState(){const saved=readEmailWait();if(saved&&(!emailWait||saved.until>emailWait.until))emailWait=saved;return emailWait&&emailWait.until>Date.now()?{...emailWait,seconds:Math.ceil((emailWait.until-Date.now())/1000)}:null}
function rememberWait(seconds,kind,estimated){emailWait={until:Date.now()+seconds*1000,kind,estimated};try{global.localStorage.setItem(waitKey,JSON.stringify(emailWait))}catch{}return emailWaitState()}
function waitError(state){const e=Error(state.kind==='email'?'O limite de envio de e-mails foi atingido. Confira os e-mails já recebidos e aguarde o prazo indicado.':'Aguarde o prazo indicado antes de pedir outro link de acesso.');e.retryAt=state.until;e.waitKind=state.kind;e.estimated=state.estimated;return e}
function rateError(response,data){
 const code=data?.code||data?.error_code;const email=code==='over_email_send_rate_limit';let seconds=null;
 const header=response.headers?.get?.('Retry-After');
 if(header!==null&&header!==undefined&&header!==''){const numeric=Number(header);seconds=Number.isFinite(numeric)&&numeric>=0?Math.max(1,Math.ceil(numeric)):Math.ceil((Date.parse(header)-Date.now())/1000);if(!Number.isFinite(seconds)||seconds<=0)seconds=null}
 const e=Error(email?'O limite de envio de e-mails do Supabase foi atingido.':'Muitas solicitações em pouco tempo. Aguarde antes de tentar novamente.');
 e.waitSeconds=seconds??(email?3600:60);e.waitKind=email?'email':'requests';e.estimated=seconds===null;e.code=code||'rate_limited';return e;
}
async function timedFetch(url,options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}}
const categories=['Moda','Acessórios','Casa','Beleza'];
function safeImage(value){return !value||/^https:\/\//i.test(value)||/^assets\/[a-z0-9._/-]+$/i.test(value)||/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)}
function validate(p){if(!p||!String(p.id||'').trim()||typeof p.name!=='string'||!p.name.trim()||p.name.length>200)throw Error('Informe o nome da roupa.');if(p.price!==null&&(!Number.isFinite(p.price)||p.price<0||p.price>999999))throw Error('Informe um preço válido em reais.');if(!categories.includes(p.category))throw Error('Escolha uma categoria.');if(!safeImage(p.imageUrl)||String(p.imageUrl||'').length>3000000)throw Error('Escolha uma foto válida.');if(p.affiliateUrl){let u;try{u=new URL(p.affiliateUrl)}catch{throw Error('Confira o link da SHEIN.')}if(u.protocol!=='https:'||!(u.hostname==='shein.com'||u.hostname.endsWith('.shein.com'))||u.username||u.password)throw Error('Use um link HTTPS da SHEIN.')}return p}
async function config(){if(configuration)return configuration;const r=await timedFetch('site-config.json',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar a conexão.');const c=await r.json();if(c.supabaseUrl||c.publishableKey){const u=new URL(c.supabaseUrl);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/'||u.search||u.hash)throw Error('Conexão inválida. Peça ajuda para concluir a configuração.');if(!c.publishableKey||c.publishableKey.startsWith('sb_secret_'))throw Error('Use somente a chave pública do serviço.');try{if(c.publishableKey.split('.').length===3){const payload=JSON.parse(atob(c.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')throw Error('secret')} }catch{throw Error('A chave configurada não é pública.')}}configuration=c;return c}
async function request(path,{method='GET',body,rawBody,auth=false,headers={}}={}){
 const c=await config();if(!c.supabaseUrl||!c.publishableKey)throw Error('Falta conectar o serviço de publicação uma única vez.');
 if(auth&&(!session||session.expiresAt<=Date.now())){session=null;throw Error('Sua sessão terminou. Entre novamente.')}
 let r;try{r=await timedFetch(c.supabaseUrl.replace(/\/$/,'')+path,{method,headers:{apikey:c.publishableKey,...(session?{Authorization:'Bearer '+session.token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:rawBody!==undefined?rawBody:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}catch{throw Error('Sem conexão. Confira a internet e tente novamente; o resultado ainda não foi confirmado.')}
 const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{if(r.status!==429)throw Error('O serviço respondeu de forma inesperada.');data=null}
 if(!r.ok){if(r.status===429)throw rateError(r,data);if((data?.code||data?.error_code)==='invalid_credentials'&&path.startsWith('/auth/v1/token'))throw Error('E-mail ou senha não conferem. Use a senha do acesso à vitrine; ela pode ser diferente da senha da conta do Supabase.');if(r.status===401||r.status===403)throw Error('Acesso não autorizado. Entre com a conta da proprietária.');if(data?.error_code==='otp_expired'||data?.error_code==='invalid_credentials')throw Error('Código inválido ou vencido. Peça outro código e tente novamente.');if(r.status===409||data?.code==='40001')throw Error('Este produto foi alterado em outra tela. Atualize a lista antes de tentar novamente.');throw Error('Não foi possível concluir a operação. Tente novamente.')}
 return data
}
async function localCatalog(){const r=await timedFetch('products.json',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar a vitrine.');const data=await r.json();if(!Array.isArray(data))throw Error('Catálogo inválido.');return data.map(validate)}
async function catalog(){const c=await config();if(!c.supabaseUrl)return {initialized:false,products:await localCatalog(),configured:false};const state=await request('/rest/v1/rpc/get_vitrine_catalog',{method:'POST',body:{}});if(!state||typeof state.initialized!=='boolean'||!Array.isArray(state.products))throw Error('O serviço de publicação precisa de uma verificação.');return {...state,configured:true,products:state.initialized?state.products.map(validate):await localCatalog()}}
function authRedirect(){
 const redirect=new URL('admin.html',global.location.href);
 if(redirect.protocol!=='https:')throw Error('Abra o painel pelo endereço HTTPS publicado para entrar.');
 redirect.search='';redirect.hash='';return redirect.href;
}
async function sendCode(email){
 const waiting=emailWaitState();if(waiting)throw waitError(waiting);
 if(emailSending)throw Error('Seu pedido já está sendo enviado. Aguarde.');
 emailSending=true;
 try{const redirect=authRedirect();const result=await request('/auth/v1/otp?redirect_to='+encodeURIComponent(redirect),{method:'POST',body:{email,create_user:true}});rememberWait(60,'sent',true);return result}
 catch(e){if(e.waitSeconds)throw waitError(rememberWait(e.waitSeconds,e.waitKind,e.estimated));if(e.message.startsWith('Sem conexão.'))rememberWait(60,'network',true);throw e}
 finally{emailSending=false}
}

async function login(email,code){const data=await request('/auth/v1/verify',{method:'POST',body:{email,token:code,type:'email'}});session={token:data.access_token,expiresAt:Date.now()+data.expires_in*1000};try{const ok=await request('/rest/v1/rpc/is_vitrine_admin',{method:'POST',body:{},auth:true});if(ok!==true)throw Error('Esta conta não tem permissão para administrar a vitrine.')}catch(e){session=null;throw e}}
async function githubLogin(){
 const settings=await request('/auth/v1/settings');
 if(settings?.external?.github!==true)throw Error('Falta ativar a conexão com o GitHub no Supabase. Continue a configuração guiada nesta conversa; não é necessário pedir e-mails.');
 const c=await config();const target=new URL('/auth/v1/authorize',c.supabaseUrl);
 target.searchParams.set('provider','github');target.searchParams.set('redirect_to',authRedirect());target.searchParams.set('scopes','user:email');
 global.location.assign(target.href);
}
async function passwordLogin(email,password){
 session=null;
 const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
 if(typeof data?.access_token!=='string'||!Number.isFinite(data.expires_in)||data.expires_in<=0)throw Error('O serviço não confirmou seu acesso.');
 session={token:data.access_token,expiresAt:Date.now()+Math.min(data.expires_in,3600)*1000};
 try{const ok=await request('/rest/v1/rpc/is_vitrine_admin',{method:'POST',body:{},auth:true});if(ok!==true)throw Error('Esta conta não está autorizada a administrar a vitrine.')}catch(e){session=null;throw e}
}
async function resumeLogin(){
 const fragment=new URLSearchParams(global.location.hash.slice(1));
 if(!fragment.has('access_token')){if(fragment.has('error')){global.history.replaceState(null,'',global.location.pathname+global.location.search);throw Error('O link de acesso expirou. Solicite outro e-mail no painel.')}return false}
 const token=fragment.get('access_token');global.history.replaceState(null,'',global.location.pathname+global.location.search);
 if(!/^[A-Za-z0-9._-]{10,20000}$/.test(token))throw Error('Link de acesso inválido. Solicite outro e-mail.');
 const seconds=Number(fragment.get('expires_in'));session={token,expiresAt:Date.now()+(Number.isFinite(seconds)&&seconds>0?Math.min(seconds,3600):3600)*1000};
 try{await request('/auth/v1/user',{auth:true});const ok=await request('/rest/v1/rpc/is_vitrine_admin',{method:'POST',body:{},auth:true});if(ok!==true)throw Error('Este e-mail não está autorizado a administrar a vitrine.');return true}catch(e){session=null;throw e}
}
async function logout(){try{if(session)await request('/auth/v1/logout',{method:'POST',auth:true})}finally{session=null}}
async function initialize(){return request('/rest/v1/rpc/initialize_vitrine',{method:'POST',body:{initial_products:await localCatalog()},auth:true})}
async function uploadPhoto(data){
 if(!safeImage(data)||!data.startsWith('data:image/jpeg;base64,'))throw Error('Escolha uma foto JPG ou PNG da galeria.');
 const encoded=data.split(',')[1],decoded=atob(encoded);if(decoded.length>3000000)throw Error('Escolha uma foto menor.');
 const bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));const objectPath=crypto.randomUUID()+'.jpg';
 await request('/storage/v1/object/vitrine-photos/'+objectPath,{method:'POST',rawBody:bytes,auth:true,headers:{'Content-Type':'image/jpeg','Cache-Control':'3600','x-upsert':'false'}});
 const c=await config();return c.supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/public/vitrine-photos/'+objectPath;
}
async function save(product,version){validate(product);return request('/rest/v1/rpc/save_vitrine_product',{method:'POST',auth:true,body:{product,expected_version:version??null}})}
async function remove(id,version){return request('/rest/v1/rpc/archive_vitrine_product',{method:'POST',auth:true,body:{product_id:id,expected_version:version}})}
global.VitrineCatalog={config,catalog,emailWaitState,sendCode,login,githubLogin,passwordLogin,resumeLogin,logout,initialize,uploadPhoto,save,remove,validate,safeImage,categories};
})(typeof window!=='undefined'?window:globalThis);

