/* Somente chave pública aqui; sessão de login apenas em memória. */
(function(global){
'use strict';
let configuration,session=null;
async function timedFetch(url,options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}}
const categories=['Moda','Acessórios','Casa','Beleza'];
function safeImage(value){return !value||/^https:\/\//i.test(value)||/^assets\/[a-z0-9._/-]+$/i.test(value)||/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)}
function validate(p){if(!p||!String(p.id||'').trim()||typeof p.name!=='string'||!p.name.trim()||p.name.length>200)throw Error('Informe o nome da roupa.');if(p.price!==null&&(!Number.isFinite(p.price)||p.price<0||p.price>999999))throw Error('Informe um preço válido em reais.');if(!categories.includes(p.category))throw Error('Escolha uma categoria.');if(!safeImage(p.imageUrl)||String(p.imageUrl||'').length>3000000)throw Error('Escolha uma foto válida.');if(p.affiliateUrl){let u;try{u=new URL(p.affiliateUrl)}catch{throw Error('Confira o link da SHEIN.')}if(u.protocol!=='https:'||!(u.hostname==='shein.com'||u.hostname.endsWith('.shein.com'))||u.username||u.password)throw Error('Use um link HTTPS da SHEIN.')}return p}
async function config(){if(configuration)return configuration;const r=await timedFetch('site-config.json',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar a conexão.');const c=await r.json();if(c.supabaseUrl||c.publishableKey){const u=new URL(c.supabaseUrl);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/'||u.search||u.hash)throw Error('Conexão inválida. Peça ajuda para concluir a configuração.');if(!c.publishableKey||c.publishableKey.startsWith('sb_secret_'))throw Error('Use somente a chave pública do serviço.');try{if(c.publishableKey.split('.').length===3){const payload=JSON.parse(atob(c.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')throw Error('secret')} }catch{throw Error('A chave configurada não é pública.')}}configuration=c;return c}
async function request(path,{method='GET',body,rawBody,auth=false,headers={}}={}){
 const c=await config();if(!c.supabaseUrl||!c.publishableKey)throw Error('Falta conectar o serviço de publicação uma única vez.');
 if(auth&&(!session||session.expiresAt<=Date.now())){session=null;throw Error('Sua sessão terminou. Entre novamente.')}
 let r;try{r=await timedFetch(c.supabaseUrl.replace(/\/$/,'')+path,{method,headers:{apikey:c.publishableKey,...(session?{Authorization:'Bearer '+session.token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:rawBody!==undefined?rawBody:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}catch{throw Error('Sem conexão. Confira a internet e tente novamente; o resultado ainda não foi confirmado.')}
 const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{throw Error('O serviço respondeu de forma inesperada.')}
 if(!r.ok){if(r.status===401||r.status===403)throw Error('Acesso não autorizado. Entre com a conta da proprietária.');if(data?.error_code==='otp_expired'||data?.error_code==='invalid_credentials')throw Error('Código inválido ou vencido. Peça outro código e tente novamente.');if(r.status===429)throw Error('Muitas tentativas. Aguarde um pouco e tente novamente.');if(r.status===409||data?.code==='40001')throw Error('Este produto foi alterado em outra tela. Atualize a lista antes de tentar novamente.');throw Error('Não foi possível concluir a operação. Tente novamente.')}
 return data
}
async function localCatalog(){const r=await timedFetch('products.json',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar a vitrine.');const data=await r.json();if(!Array.isArray(data))throw Error('Catálogo inválido.');return data.map(validate)}
async function catalog(){const c=await config();if(!c.supabaseUrl)return {initialized:false,products:await localCatalog(),configured:false};const state=await request('/rest/v1/rpc/get_vitrine_catalog',{method:'POST',body:{}});if(!state||typeof state.initialized!=='boolean'||!Array.isArray(state.products))throw Error('O serviço de publicação precisa de uma verificação.');return {...state,configured:true,products:state.initialized?state.products.map(validate):await localCatalog()}}
async function sendCode(email){return request('/auth/v1/otp',{method:'POST',body:{email,create_user:false}})}
async function login(email,code){const data=await request('/auth/v1/verify',{method:'POST',body:{email,token:code,type:'email'}});session={token:data.access_token,expiresAt:Date.now()+data.expires_in*1000};try{const ok=await request('/rest/v1/rpc/is_vitrine_admin',{method:'POST',body:{},auth:true});if(ok!==true)throw Error('Esta conta não tem permissão para administrar a vitrine.')}catch(e){session=null;throw e}}
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
global.VitrineCatalog={config,catalog,sendCode,login,logout,initialize,uploadPhoto,save,remove,validate,safeImage,categories};
})(typeof window!=='undefined'?window:globalThis);

