/* GTA 6 Notifier Desktop 3.1.1 — serviço de monitoramento independente da janela */
const {app,BrowserWindow,ipcMain,shell,Menu,Tray,nativeImage,Notification}=require('electron');
const path=require('path'),fs=require('fs');
const storeFile=()=>path.join(app.getPath('userData'),'gta6-notifier-data.json');
function readStore(){try{return JSON.parse(fs.readFileSync(storeFile(),'utf8'));}catch{return {};}}
function writeStore(data){const f=storeFile();fs.mkdirSync(path.dirname(f),{recursive:true});const t=f+'.tmp';fs.writeFileSync(t,JSON.stringify(data,null,2));fs.renameSync(t,f);}
const ALLOWED_HOSTS=new Set(['github.com','raw.githubusercontent.com','portwatch-vi.xyz','discord.com','discordapp.com']);
function allowed(host){return [...ALLOWED_HOSTS].some(x=>host===x||host.endsWith('.'+x));}
let dashboard=null,service=null,tray=null,quitting=false,alarmTimers=new Map(),backgroundPollTimer=null,serviceReady=false;
const pending=new Map();
function requestWorker(message,timeout=30000){
 if(!service||service.isDestroyed())return Promise.reject(new Error('Serviço de monitoramento ainda não iniciou.'));
 const id=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Tempo limite do serviço de monitoramento.'));},timeout);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});service.webContents.send('worker:request',{id,message});});
}
ipcMain.on('worker:response',(_,p)=>{const x=pending.get(p.id);if(!x)return;pending.delete(p.id);p.error?x.reject(new Error(p.error)):x.resolve(p.result);});
ipcMain.handle('runtime:message',(_,m)=>requestWorker(m,120000));
ipcMain.handle('store:get',(_,keys)=>{const s=readStore();if(keys==null)return s;if(typeof keys==='string')return {[keys]:s[keys]};if(Array.isArray(keys))return Object.fromEntries(keys.filter(k=>k in s).map(k=>[k,s[k]]));if(typeof keys==='object')return {...keys,...Object.fromEntries(Object.keys(keys).filter(k=>k in s).map(k=>[k,s[k]]))};return s;});
ipcMain.handle('store:set',(_,v)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Dados inválidos.');writeStore({...readStore(),...v});for(const w of [dashboard,service])if(w&&!w.isDestroyed())w.webContents.send('store:changed',{changes:Object.fromEntries(Object.keys(v).map(k=>[k,{newValue:v[k]}])),area:'local'});return true;});
ipcMain.handle('network:fetch',async(_,url,options={})=>{
 const u=new URL(url);if(u.protocol!=='https:'||!allowed(u.hostname))throw new Error('Destino HTTPS não permitido: '+u.hostname);
 const controller=new AbortController(),ms=Math.min(60000,Math.max(3000,Number(options.timeout)||20000)),timer=setTimeout(()=>controller.abort(),ms);
 try{let current=u;let r;for(let hop=0;hop<=5;hop++){r=await fetch(current.href,{method:options.method||'GET',headers:{'User-Agent':'GTA-6-Notifier-Desktop/3.1.3','Accept':'application/atom+xml,application/xml,application/json,text/plain,*/*',...(options.headers||{})},body:options.body,signal:controller.signal,redirect:'manual'});if(r.status<300||r.status>=400)break;const location=r.headers.get('location');if(!location)throw new Error('Redirecionamento sem destino informado.');const next=new URL(location,current);if(next.protocol!=='https:'||!allowed(next.hostname))throw new Error('Redirecionamento para destino não permitido: '+next.hostname);if(hop===5)throw new Error('Limite de redirecionamentos excedido.');current=next;}return {ok:r.ok,status:r.status,statusText:r.statusText,text:await r.text(),url:current.href};}
 catch(e){throw new Error(e.name==='AbortError'?'Tempo limite ao acessar '+u.hostname:e.message||String(e));}finally{clearTimeout(timer);}
});
ipcMain.handle('network:diagnostics',async()=>{
 const checks=[];
 async function probe(name,url,{accept404=false}={}){
  const started=Date.now();
  try{
   const parsed=new URL(url);
   if(parsed.protocol!=='https:')throw new Error('A URL de diagnóstico não usa HTTPS.');
   const response=await fetch(parsed.href,{headers:{'User-Agent':'GTA-6-Notifier-Desktop/3.1.3','Accept':'*/*'},signal:AbortSignal.timeout(15000),redirect:'follow'});
   const ok=response.ok||(accept404&&response.status===404);
   checks.push({name,url:parsed.href,ok,status:response.status,ms:Date.now()-started,detail:ok?(response.status===404?'Servidor acessível; arquivo não encontrado (404).':'Conexão estabelecida.'):`HTTP ${response.status} ${response.statusText}`});
  }catch(error){checks.push({name,url,ok:false,ms:Date.now()-started,error:error?.message||String(error),detail:'Não foi possível estabelecer conexão.'});}
 }
 await Promise.all([
  probe('Internet / GitHub','https://github.com/'),
  probe('GitHub Releases','https://github.com/xcl-dev/xcl/releases.atom'),
  probe('GitHub Raw','https://raw.githubusercontent.com/Nicknrss/GTA-6-Notifier/main/README.md',{accept404:true}),
  probe('PortWatch VI','https://portwatch-vi.xyz/data/tracker.json')
 ]);
 const saved=readStore();
 checks.push(
  {name:'Armazenamento local',ok:true,detail:'Arquivo local acessível.'},
  {name:'Monitoramento',ok:saved.enabled!==false,detail:saved.enabled===false?'Pausado nas configurações.':'Habilitado nas configurações; última execução: '+(saved.lastCheck?new Date(saved.lastCheck).toLocaleString():'ainda não executado')},
  {name:'Notificações do Windows',ok:Notification.isSupported(),detail:Notification.isSupported()?'API de notificações do Electron disponível; teste de exibição separado.':'API de notificações indisponível.'},
  {name:'Discord',ok:!!saved.webhookUrl,detail:saved.webhookUrl?'Webhook salvo; é necessário testar o envio.':'Webhook não configurado.'}
 );
 return {checks,checkedAt:Date.now()};
});
ipcMain.handle('notification:show',async(_,o={})=>{
 if(!Notification.isSupported())throw new Error('Notificações do Windows não estão disponíveis neste ambiente.');
 const n=new Notification({title:o.title||'GTA 6 Notifier',body:o.message||o.body||'',icon:path.join(__dirname,'icon-128.png'),silent:false});
 n.on('click',()=>showDashboard());n.show();return {ok:true};
});
ipcMain.handle('notification:test',async()=>{
 if(!Notification.isSupported())throw new Error('O Windows/Electron não disponibilizou a API de notificações.');
 try{
  const n=new Notification({title:'GTA 6 Notifier',body:'Teste de notificação do Windows. Se esta mensagem apareceu, o canal está funcionando.',silent:false});
  n.show();
  return {ok:true,device:require('os').hostname()};
 }catch(error){throw new Error('Falha ao criar notificação nativa: '+(error?.message||String(error)));}
});
ipcMain.on('notification:show',(_,o)=>{if(Notification.isSupported()){const n=new Notification({title:o.title||'GTA 6 Notifier',body:o.message||'',icon:path.join(__dirname,'icon-128.png')});n.on('click',()=>showDashboard());n.show();}});
ipcMain.on('alarm:create',(_,name,o={})=>{if(alarmTimers.has(name))clearInterval(alarmTimers.get(name));const mins=Math.max(1,Math.min(60,Number(o.periodInMinutes)||1));const timer=setInterval(()=>requestWorker({type:'__ALARM__',name}).catch(()=>{}),mins*60000);alarmTimers.set(name,timer);});
ipcMain.on('alarm:clear',(_,name)=>{if(alarmTimers.has(name)){clearInterval(alarmTimers.get(name));alarmTimers.delete(name);}});
function showDashboard(){if(!dashboard||dashboard.isDestroyed())createDashboard();else{dashboard.show();dashboard.focus();}}
function createDashboard(){dashboard=new BrowserWindow({width:1280,height:850,minWidth:900,minHeight:650,show:true,autoHideMenuBar:true,icon:path.join(__dirname,'icon-256.png'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});dashboard.loadFile(path.join(__dirname,'dashboard.html'));dashboard.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return {action:'deny'};});dashboard.webContents.on('before-input-event',(e,i)=>{if(i.type==='keyDown'&&i.key==='F11'){e.preventDefault();dashboard.setFullScreen(!dashboard.isFullScreen());}if(i.type==='keyDown'&&i.key==='Escape'&&dashboard.isFullScreen()){e.preventDefault();dashboard.setFullScreen(false);}});dashboard.on('close',e=>{if(!quitting&&process.platform==='win32'){e.preventDefault();dashboard.hide();}});dashboard.on('closed',()=>dashboard=null);}
function startService(){service=new BrowserWindow({show:false,width:400,height:300,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});service.loadFile(path.join(__dirname,'background-runner.html'));service.webContents.on('did-finish-load',async()=>{serviceReady=true;service.webContents.send('worker:init',{reason:'startup'});setTimeout(()=>requestWorker({type:'CHECK_NOW'},120000).catch(e=>console.warn('Initial background check:',e.message)),1500);if(backgroundPollTimer)clearInterval(backgroundPollTimer);backgroundPollTimer=setInterval(()=>{if(serviceReady&&!quitting)requestWorker({type:'CHECK_NOW'},120000).catch(e=>console.warn('Scheduled background check:',e.message));},60000);});}
app.whenReady().then(()=>{app.setAppUserModelId('com.gta6notifier.desktop');Menu.setApplicationMenu(null);startService();createDashboard();try{tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon-256.png')));tray.setToolTip('GTA 6 Notifier — monitoramento em segundo plano');tray.setContextMenu(Menu.buildFromTemplate([{label:'Abrir GTA 6 Notifier',click:showDashboard},{label:'Verificar agora',click:()=>requestWorker({type:'CHECK_NOW'}).catch(()=>{})},{type:'separator'},{label:'Encerrar',click:()=>{quitting=true;app.quit();}}]));tray.on('double-click',showDashboard);}catch(e){console.error('Tray:',e.message);}app.on('activate',showDashboard);});
app.on('before-quit',()=>{quitting=true;if(backgroundPollTimer)clearInterval(backgroundPollTimer);for(const t of alarmTimers.values())clearInterval(t);});
app.on('window-all-closed',()=>{});
