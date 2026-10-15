const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'products.json')));
const copy=x=>JSON.parse(JSON.stringify(x));
const script=name=>fs.readFileSync(path.join(root,name),'utf8');
function response(data,status=200){return {ok:status>=200&&status<300,status,json:async()=>copy(data),text:async()=>JSON.stringify(data)}}
class Element{
 constructor(){this.children=[];this.attrs={};this.value='';this.style={};this.dataset={};this.hidden=false;this.disabled=false;this.textContent='';this.listeners={}}
 append(...items){this.children.push(...items)}replaceChildren(...items){this.children=[...items]}replaceWith(el){this.replacement=el}
 setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]}removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,f){this.listeners[k]=f}focus(){}scrollIntoView(){}reset(){}
 querySelectorAll(cls){return this.children.flatMap(c=>[...(c.className===cls.slice(1)?[c]:[]),...c.querySelectorAll(cls)])}
}
function environment(configured=true){
 let state={initialized:false,products:[],offline:false,loseReply:false};const calls=[],storage={};
 const document={hidden:false,elements:{},getElementById(id){return this.elements[id]??=new Element()},querySelector(s){return s==='.tabs'?(this.tabs??=new Element()):this.getElementById(s.slice(1))},querySelectorAll(){return Object.values(this.elements)},createElement(){return new Element()},addEventListener(){}};
 const fetch=async(url,options={})=>{calls.push({url,options});if(url==='site-config.json')return response(configured?{supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test'}:{supabaseUrl:'',publishableKey:''});
 if(url==='products.json')return response(catalog);const route=new URL(url).pathname,body=typeof options.body==='string'?JSON.parse(options.body):{};
 if(route.startsWith('/storage/v1/object/vitrine-photos/'))return response({Key:'uploaded'});
 if(route==='/auth/v1/otp')return response({});
 if(route==='/auth/v1/verify')return response({access_token:'test-owner-token',expires_in:3600});
 if(route==='/auth/v1/user')return response({id:'test-owner-user',email_confirmed_at:'2026-10-15'});
 if(route==='/auth/v1/logout')return response(null);
 if(route.endsWith('/is_vitrine_admin'))return response(options.headers.Authorization==='Bearer test-owner-token');
 if(route.endsWith('/get_vitrine_catalog'))return response({initialized:state.initialized,products:state.products});
 if(options.headers.Authorization!=='Bearer test-owner-token')return response({},403);
 if(route.endsWith('/initialize_vitrine')){if(!state.initialized){state.products=body.initial_products.map(p=>({...p,_version:1}));state.initialized=true}return response({initialized:true,products:state.products})}
 if(route.endsWith('/save_vitrine_product')){
 if(state.offline)throw Error('offline');const found=state.products.find(p=>p.id===body.product.id);if(found&&found._version!==body.expected_version)return response({code:'40001'},409);
 if(!found&&body.expected_version!==null)return response({},409);
 const saved={...body.product,_version:(found?._version||0)+1};state.products=state.products.filter(p=>p.id!==saved.id).concat(saved);
 if(state.loseReply){state.loseReply=false;throw Error('reply lost')}return response(saved)}
 if(route.endsWith('/archive_vitrine_product')){const found=state.products.find(p=>p.id===body.product_id);if(!found||found._version!==body.expected_version)return response({},409);state.products=state.products.filter(p=>p.id!==body.product_id);return response({archived:true})}
 throw Error('Unexpected '+url)};
 const context={document,fetch,URL,Intl,Date,AbortController,setTimeout,clearTimeout,atob,console,crypto:require('node:crypto').webcrypto,confirm:()=>true,location:{hash:'',pathname:'/admin.html',search:'',reload(){}},history:{replaceState(){}},URLSearchParams,Image:class{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v}};
 context.window=context;context.addEventListener=()=>{};context.matchMedia=()=>({matches:true});vm.createContext(context);vm.runInContext(script('catalog-client.js'),context);
 return {context,document,state,calls,storage,api:context.VitrineCatalog,run:code=>vm.runInContext(code,context),el:id=>document.getElementById(id)};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('migração contém três roupas únicas e mantém fotos/links',()=>{assert.equal(catalog.length,3);assert.equal(new Set(catalog.map(p=>p.id)).size,3);assert(catalog.some(p=>p.name.includes('Top Bandeau')));assert.equal(catalog[1].price,83.9);assert.equal(catalog[2].price,193.99);assert(catalog[1].imageUrl.startsWith('data:image/jpeg;base64,'));assert(catalog[2].imageUrl.startsWith('data:image/jpeg;base64,'));assert.equal(catalog[0].imageUrl,'');assert.equal(catalog[0].affiliateUrl,'')});
test('sem configuração: catálogo existente aparece e publicar é bloqueado',async()=>{const e=environment(false);const state=await e.api.catalog();assert.equal(state.products.length,3);assert.equal(state.configured,false);await assert.rejects(e.api.save(catalog[1],null),/conectar/);assert(!e.calls.some(c=>String(c.url).includes('save_vitrine_product')))});
test('validação bloqueia link de outro domínio, script e preço inválido',()=>{const {api}=environment();for(const changes of [{affiliateUrl:'https://shein.com.evil.test/a'},{affiliateUrl:'javascript:alert(1)'},{imageUrl:'data:image/svg+xml,<svg/>'},{price:-1},{name:''},{category:'inexistente'}])assert.throws(()=>api.validate({...catalog[1],...changes}));assert.doesNotThrow(()=>api.validate(catalog[2]))});
test('autenticação, importação inicial, publicação e exclusão vazia sem ressuscitar dados',async()=>{const e=environment();await assert.rejects(e.api.save(catalog[1],null),/sessão/);await e.api.login('owner@example.test','test-only');await e.api.initialize();await e.api.initialize();assert.equal(e.state.products.length,3);const first=(await e.api.catalog()).products[0];const saved=await e.api.save({...first,name:'Nome alterado'},first._version);assert.equal(saved._version,2);await assert.rejects(e.api.save({...first,name:'Conflito'},first._version),/outra tela/);for(const p of [...e.state.products])await e.api.remove(p.id,p._version);const empty=await e.api.catalog();assert.equal(empty.products.length,0);assert.equal(empty.initialized,true);assert.equal(Object.keys(e.storage).length,0);await e.api.logout();await assert.rejects(e.api.remove('x',1),/sessão/)});
async function admin(){const e=environment();e.context.location.hash='#access_token=test-owner-token&expires_in=3600';vm.runInContext(script('admin.js'),e.context);await settle();await e.el('activate').onclick();return e}
test('painel publica, edita e exclui sem download ou alteração no GitHub',async()=>{const e=await admin();assert.equal(e.el('list').children.length,3);e.run('photoData=products[1].imageUrl');e.el('name').value='Roupa de teste';e.el('price').value='123,45';e.el('affiliateUrl').value='https://onelink.shein.com/test-only';e.el('category').value='Moda';await e.el('product-form').onsubmit({preventDefault(){}});assert.equal(e.state.products.length,4);assert.match(e.el('message').textContent,/Publicado/);const p=e.state.products.find(p=>p.name==='Roupa de teste');assert.equal(p.price,123.45);e.run('openEditor('+JSON.stringify(p.id)+')');e.el('name').value='Roupa editada';await e.el('product-form').onsubmit({preventDefault(){}});const edited=e.state.products.find(x=>x.id===p.id);assert.equal(edited.name,'Roupa editada');await e.run('removeProduct(products.find(p=>p.id==='+JSON.stringify(p.id)+'))');assert.equal(e.state.products.length,3);assert.match(e.el('message').textContent,/excluída/);assert(!script('admin.js').includes('download'));assert(!script('admin.html').includes('type="file" id="import"'))});
test('cancelar exclusão não grava; erro mantém formulário; resposta perdida é reconciliada',async()=>{const e=await admin();e.context.confirm=()=>false;await e.run('removeProduct(products[0])');assert.equal(e.state.products.length,3);e.context.confirm=()=>true;e.run('openEditor(products[1].id)');e.el('name').value='Edição preservada';e.state.offline=true;await e.el('product-form').onsubmit({preventDefault(){}});assert.equal(e.el('name').value,'Edição preservada');assert.equal(e.el('message').dataset.error,'true');assert(!e.el('message').textContent.includes('Publicado!'));e.state.offline=false;e.state.loseReply=true;await e.el('product-form').onsubmit({preventDefault(){}});assert.match(e.el('message').textContent,/Publicado!/);assert.equal(e.state.products.length,3)});
test('vitrine renderiza três produtos, busca conjunto, mantém links e bloqueia macacão pendente',async()=>{const e=environment(false);e.el('sort').value='featured';const html=script('index.html');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],e.context);await settle();const rows=e.el('products').children;assert.equal(rows.length,3);assert.equal(rows[0].children[3].children[1].disabled,true);assert.equal(rows[2].children[3].children[1].href,catalog[2].affiliateUrl);e.el('search').value='bandeau';e.run('render()');assert.equal(e.el('products').children.length,1);e.el('search').value='73513430';e.run('render()');assert.equal(e.el('products').children.length,1);assert.match(e.el('products').children[0].children[3].children[0].textContent,/108,68/)});

