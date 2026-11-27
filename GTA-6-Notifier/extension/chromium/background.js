/* GTA 6 Notifier 2.2.0
 * GitHub Releases via public Atom feeds (no GitHub REST API).
 * PortWatch VI via public tracker JSON + news Atom feed.
 */
try { importScripts('locale.js'); } catch (e) { console.warn('Localization load:', e); }
const api = globalThis.browser || globalThis.chrome;
const t = globalThis.GTA6I18N?.t || ((key, vars={}) => key.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`));
const REPOS = [
  {owner:'xcl-dev',repo:'xcl',name:'XCL',developer:'xcl-dev'},
  {owner:'Marvisak',repo:'VIctory',name:'Project Victory',developer:'Marvisak'},
  {owner:'uiliannn',repo:'VItoriaBr',name:'VItoriaBr',developer:'uiliannn'},
  {owner:'fxceless',repo:'victory-fork',name:'VIctory Fork',developer:'fxceless'},
  {owner:'stellarr-studio',repo:'kelvaroq',name:'Kelvaroq',developer:'stellarr-studio'},
  {owner:'DexNom',repo:'VIctory',name:'VIctory',developer:'DexNom'},
  {owner:'avatarmanz',repo:'VIctory-7900XTX',name:'VIctory 7900XTX',developer:'avatarmanz'},
  {owner:'Belobug',repo:'VIctory-Belobug-AMD',name:'VIctory AMD',developer:'Belobug'}
];
const PORTWATCH = {
  tracker:'https://portwatch-vi.xyz/data/tracker.json',
  feed:'https://portwatch-vi.xyz/news/feed.xml',
  home:'https://portwatch-vi.xyz/'
};
const ALARM='gta6-notifier-monitor';
const DEFAULT_INTERVAL=1;
const K=(owner,repo)=>`${owner}/${repo}`;
const safeJson=async r=>{try{return await r.json()}catch{return null}};
function parseAtom(xml){
 const entries=[]; const blocks=xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi)||[];
 for(const b of blocks){
  const val=(tag)=>{const m=b.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim():''};
  const link=(b.match(/<link[^>]+href=["']([^"']+)["']/i)||[])[1]||val('link');
  const id=val('id')||link;
  entries.push({id,link,title:val('title')||'Novo Release',updated:val('updated')||val('published'),published:val('published')||val('updated'),summary:val('content')||val('summary')});
 }
 return entries;
}
async function getText(url){
 const h={'Accept':'application/atom+xml, application/xml, application/json, text/plain, */*'};
 // Public GET without cookies or conditional headers: avoids unnecessary CORS preflights.
 const r=await fetch(url,{method:'GET',headers:h,credentials:'omit',redirect:'follow',cache:'no-store'});
 if(!r.ok)throw new Error(`HTTP ${r.status} em ${url}`);
 return {text:await r.text(),etag:null};
}
async function getJson(url,etag){
 const x=await getText(url); 
 let data;try{data=JSON.parse(x.text)}catch{throw new Error(`Resposta JSON inválida: ${url}`)}
 return {...x,data};
}
async function saveHistory(item){
 const s=await api.storage.local.get(['eventHistory','progressHistory']);
 const history=Array.isArray(s.eventHistory)?s.eventHistory:[];
 history.unshift({...item,id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,timestamp:Date.now()});
 await api.storage.local.set({eventHistory:history.slice(0,300)});
}
async function notify(title,message,url,source='github',category='githubRelease'){
 const s=await api.storage.local.get(['webhookUrl','discordEnabled','systemNotificationsEnabled','alertPreferences','systemAlertPreferences','discordAlertPreferences']);
 const defaults={githubRelease:true,portRanking:true,portGeneral:true};
 const systemPrefs={...defaults,...(s.systemAlertPreferences||s.alertPreferences||{})};
 const discordPrefs={...defaults,...(s.discordAlertPreferences||s.alertPreferences||{})};
 const systemAllowed=systemPrefs[category]!==false;
 const discordAllowed=discordPrefs[category]!==false;
 await saveHistory({title,message:String(message),url:url||'',source,category});
 if(systemAllowed&&s.systemNotificationsEnabled!==false){
  try{await api.notifications.create('',{type:'basic',iconUrl:api.runtime.getURL('icon.png'),title,message:String(message).slice(0,240),priority:2});}catch(e){console.warn('System notification:',e);}
 }
 if(discordAllowed&&s.discordEnabled!==false&&s.webhookUrl&&/^https:\/\/discord\.com\/api\/webhooks\/\d+\//.test(s.webhookUrl)){
  const body=`**${title}**\n${message}\n${url||''}`;
  try{const r=await fetch(s.webhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:body.slice(0,1900),allowed_mentions:{parse:[]}})});if(!r.ok)console.warn('Discord HTTP',r.status);}catch(e){console.warn('Discord:',e);}
 }
}
async function recordProgress(value,name){
 if(!Number.isFinite(Number(value)))return;
 const s=await api.storage.local.get('progressHistory');
 const rows=Array.isArray(s.progressHistory)?s.progressHistory:[];
 const v=Number(value),last=rows[rows.length-1];
 if(!last||last.value!==v)rows.push({timestamp:Date.now(),value:v,name:name||''});
 await api.storage.local.set({progressHistory:rows.slice(-240)});
}
// GitHub Releases monitor: public Atom feeds only (no REST API quota).
// The first successful read establishes a silent baseline for each repository.
async function monitorGithub(storage){
 const out={events:0,errors:[],successes:0,repoHealth:{}};
 const state={...(storage.githubReleaseState||{})};
 await Promise.all(REPOS.map(async repo=>{
  const key=K(repo.owner,repo.repo);
  const url=`https://github.com/${repo.owner}/${repo.repo}/releases.atom`;
  try{
   const result=await getText(url);
   const entries=parseAtom(result.text);
   out.successes++;out.repoHealth[key]={ok:true,lastSuccess:Date.now(),entries:entries.length,lastRelease:entries[0]?{title:entries[0].title,published:entries[0].published,link:entries[0].link}:null,error:null};
   const known=new Set(state[key]?.ids||[]);
   if(!state[key]?.baseline){
    state[key]={baseline:true,etag:result.etag,ids:entries.map(e=>e.id).filter(Boolean).slice(0,30)};
    return;
   }
   const fresh=entries.filter(e=>e.id&&!known.has(e.id));
   // Process oldest first so Discord/system notifications preserve release order.
   for(const entry of fresh.reverse()){
    const title=t('newRelease',{name:repo.name});
    const detail=entry.title||t('newReleaseDetail',{title:'New Release',repo:`${repo.owner}/${repo.repo}`});
    await notify(title,t('newReleaseDetail',{title:detail,repo:`${repo.owner}/${repo.repo}`}),entry.link||url,'github','githubRelease');
    out.events++;
   }
   state[key]={baseline:true,etag:result.etag,ids:[...entries.map(e=>e.id).filter(Boolean),...(state[key]?.ids||[])].filter((v,i,a)=>a.indexOf(v)===i).slice(0,50)};
  }catch(e){out.errors.push(`${key}: ${e.message||String(e)}`);out.repoHealth[key]={ok:false,lastError:Date.now(),error:e.message||String(e)};}
 }));
 await api.storage.local.set({githubReleaseState:state});
 return out;
}

function flattenDiff(a,b,p='',out=[]){
 if(out.length>250)return out;
 if(a===b)return out;
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
  for(const k of new Set([...Object.keys(a),...Object.keys(b)]))flattenDiff(a[k],b[k],p?`${p}.${k}`:k,out);
 }else if(JSON.stringify(a)!==JSON.stringify(b))out.push(p||'root');
 return out;
}
// The public PortWatch tracker stores the race in efforts[]. Only entries
// explicitly marked tier="tracked" belong to the leaderboard.
function effortName(e){
 return e.name||e.title||e.owner||e.slug||e.repo||e.repository||'Projeto sem nome';
}
function clamp01(v){const n=Number(v);return Number.isFinite(n)?Math.min(1,Math.max(0,n)):0;}
function ladderValue(v){if(v===true)return 1;if(v===false||v==null)return 0;return clamp01(v);}
function scoreEffort(e){
 const gw=e.groundwork||{};
 const groundwork=0.2*clamp01(gw.loader)+0.28*clamp01(gw.shaders)+0.32*clamp01(gw.graphics)+0.2*clamp01(gw.proven);
 const gta=e.gta||{};
 const ticks={loads:10,boots:20,menu:30,world:40,playable:50};
 const ladder=['loads','boots','menu','world','playable'];
 let score=10*groundwork,previous=score,reached='groundwork';
 for(const key of ladder){
  const value=ladderValue(gta[key]);
  if(value>=1){score=ticks[key];previous=score;reached=key;continue;}
  if(value>0)score=Math.max(score,previous+value*(ticks[key]-previous));
  break;
 }
 if(reached==='playable'){
  const stabilityMap={unknown:0,constant:0,often:0.25,sometimes:0.55,rarely:0.8,stable:1};
  const stability=typeof gta.stability==='number'?clamp01(gta.stability):(stabilityMap[gta.stability]??0);
  const quality=0.35*clamp01(gta.story)+0.25*clamp01(gta.render)+0.2*clamp01((Number(gta.fps)||0)/30)+0.2*stability;
  score=50+quality*50;
 }
 if(Number.isFinite(e.manualScore))score=Math.min(100,Math.max(0,e.manualScore));
 return Math.round(score*10)/10;
}
function extractRace(data){
 const efforts=Array.isArray(data?.efforts)?data.efforts:[];
 return efforts.filter(e=>String(e?.tier||'').toLowerCase()==='tracked'&&!e.nuked)
  .map(e=>({name:effortName(e),score:scoreEffort(e),stars:Number(e.stats?.stars)||0,id:String(e.id||e.repo||e.slug||e.repository||effortName(e))}))
  .sort((a,b)=>b.score-a.score||b.stars-a.stars||a.name.localeCompare(b.name))
  .map(({name,score,id})=>({name,score,id}));
}
function sameRanking(a,b){
 return JSON.stringify(a.map(x=>[x.id,x.name,x.score]))===JSON.stringify(b.map(x=>[x.id,x.name,x.score]));
}
function fmtPct(n){return `${Number(n).toFixed(1).replace('.',',')}%`;}
async function monitorPortwatch(s){
 const out={events:0,errors:[],success:false};
 try{
  const x=await getJson(PORTWATCH.tracker,s.portEtag);
  if(!x.notModified){
   out.success=true;
   const current=extractRace(x.data);
   const previous=s.portRaceSnapshot||[];
   if(!s.portRaceBaseline){
    await api.storage.local.set({portRaceSnapshot:current,portRaceBaseline:true,portEtag:x.etag});
   }else{
    const oldById=new Map(previous.map(e=>[e.id,e]));
    const newById=new Map(current.map(e=>[e.id,e]));
    const changes=[];
    // Notify on any tracked effort percentage change, including decreases.
    for(const now of current){
     const old=oldById.get(now.id);
     if(old&&old.score!==now.score){
      changes.push(t('scoreChange',{name:now.name,old:fmtPct(old.score),now:fmtPct(now.score)}));
     }else if(!old){
      changes.push(t('entered',{name:now.name,score:fmtPct(now.score)}));
     }
    }
    for(const old of previous){if(!newById.has(old.id))changes.push(t('left',{name:old.name}));}
    const oldLeader=previous[0],newLeader=current[0];
    if(oldLeader&&newLeader&&oldLeader.id!==newLeader.id){
     changes.unshift(t('newLeader',{name:newLeader.name,old:oldLeader.name}));
    }
    // Reordering matters even if scores did not change.
    const oldPositions=new Map(previous.map((e,i)=>[e.id,i+1]));
    for(let i=0;i<current.length;i++){
     const now=current[i],oldPos=oldPositions.get(now.id);
     if(oldPos&&oldPos!==i+1&&now.id!==newLeader?.id){
      changes.push(t('position',{name:now.name,old:oldPos,now:i+1}));
     }
    }
    if(changes.length){
     await notify(t('portRaceTitle'),changes.slice(0,30).join('\n'),PORTWATCH.home,'portwatch','portRanking');
     out.events++;
    }
    // Headline progress is the score of the current race leader. A changed
    // top score is reported separately from per-project score changes.
    if(oldLeader&&newLeader&&oldLeader.score!==newLeader.score){
     await notify(t('portGeneralTitle'),t('overall',{old:fmtPct(oldLeader.score),now:fmtPct(newLeader.score),name:newLeader.name}),PORTWATCH.home,'portwatch','portGeneral');
     out.events++;
    }
    await api.storage.local.set({portRaceSnapshot:current,portEtag:x.etag});
    if(newLeader)await recordProgress(newLeader.score,newLeader.name);
   }
  }
 }catch(e){out.errors.push(`PortWatch ranking: ${e.message}`);}
 return out;
}
let running=false;
async function poll(){
 if(running)return;running=true;
 try{
  const s=await api.storage.local.get(null);if(s.enabled===false)return;
  let gh={events:0,errors:[],successes:0,repoHealth:{}},pw={events:0,errors:[],success:false};
  try{gh=await monitorGithub(s);}catch(e){gh.errors.push(`GitHub: ${e.message||String(e)}`);}
  try{const fresh=await api.storage.local.get(null);pw=await monitorPortwatch(fresh);}catch(e){pw.errors.push(`PortWatch: ${e.message||String(e)}`);}
  const errors=[...gh.errors,...pw.errors];
  const oldHealth=(await api.storage.local.get('sourceHealth')).sourceHealth||{};
  await api.storage.local.set({lastCheck:Date.now(),lastError:errors.length?errors.join(' | '):null,lastCheckedCount:REPOS.length,lastGithubEvents:gh.events,lastPortwatchEvents:pw.events,lastEventCount:gh.events+pw.events,repoHealth:{...(oldHealth.repos||{}),...gh.repoHealth},sourceHealth:{github:{ok:gh.successes>0,total:REPOS.length,successes:gh.successes,errors:gh.errors,lastCheck:Date.now()},portwatch:{ok:pw.success,errors:pw.errors,lastCheck:Date.now()},repos:{...(oldHealth.repos||{}),...gh.repoHealth}}});
 }finally{running=false;}
}
async function schedule(){
 const {interval=DEFAULT_INTERVAL}=await api.storage.local.get('interval');
 await api.alarms.clear(ALARM);
 // Chromium 120+ supports 0.5-minute alarms; use 1 minute for broad compatibility.
 api.alarms.create(ALARM,{periodInMinutes:Math.max(1,Math.min(60,Number(interval)||1)),delayInMinutes:0.1});
}
async function testDiscord(){
 const {webhookUrl}=await api.storage.local.get('webhookUrl');
 if(!/^https:\/\/discord\.com\/api\/webhooks\/\d+\//.test(webhookUrl||''))throw new Error(t('configureWebhook'));
 const r=await fetch(webhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:`**${t('discordTestTitle')}**\n${t('discordTestMessage')}`,allowed_mentions:{parse:[]}})});
 if(!r.ok)throw new Error(`Discord HTTP ${r.status}`);return {ok:true};
}
async function testSystemNotification(){
 if(!api.notifications?.create)throw new Error('Notifications API unavailable in this browser.');
 await api.notifications.create('gta6-test',{type:'basic',iconUrl:api.runtime.getURL('icon.png'),title:t('testNoticeTitle'),message:t('testNoticeMessage'),priority:2});
 return {ok:true};
}
api.runtime.onInstalled.addListener(async(details)=>{
 const existing=await api.storage.local.get(null);
 const defaults={enabled:true,interval:1,discordEnabled:true,systemNotificationsEnabled:true,alertPreferences:{githubRelease:true,portRanking:true,portGeneral:true},systemAlertPreferences:{githubRelease:true,portRanking:true,portGeneral:true},discordAlertPreferences:{githubRelease:true,portRanking:true,portGeneral:true},eventHistory:[],progressHistory:[]};
 if(details.reason==='install')await api.storage.local.set({...defaults,...existing});
 else {const missing={};for(const [k,v] of Object.entries(defaults))if(existing[k]===undefined)missing[k]=v;if(Object.keys(missing).length)await api.storage.local.set(missing);}
 await schedule();await poll();
});
api.runtime.onStartup.addListener(async()=>{await schedule();await poll();});
api.alarms.onAlarm.addListener(a=>{if(a.name===ALARM)poll();});
api.storage.onChanged.addListener((c,area)=>{if(area==='local'&&c.interval)schedule();});
api.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.type==='CHECK_NOW'){poll().then(()=>api.storage.local.get(['lastCheck','lastError','lastEventCount','lastCheckedCount','lastGithubEvents','lastPortwatchEvents'])).then(reply).catch(e=>reply({lastError:String(e)}));return true;}
 if(m?.type==='TEST_DISCORD'){testDiscord().then(reply).catch(e=>reply({ok:false,error:e.message||String(e)}));return true;}
 if(m?.type==='TEST_NOTIFICATION'||m?.type==='TEST_WINDOWS'){testSystemNotification().then(reply).catch(e=>reply({ok:false,error:e.message||String(e)}));return true;}
 if(m?.type==='GET_DASHBOARD'){api.storage.local.get(null).then(reply).catch(e=>reply({error:String(e)}));return true;}
 if(m?.type==='SAVE_DASHBOARD_SETTINGS'){api.storage.local.set(m.settings||{}).then(()=>schedule()).then(()=>reply({ok:true})).catch(e=>reply({ok:false,error:String(e)}));return true;}
 if(m?.type==='CLEAR_HISTORY'){api.storage.local.set({eventHistory:[]}).then(()=>reply({ok:true})).catch(e=>reply({ok:false,error:String(e)}));return true;}
 if(m?.type==='OPEN_DASHBOARD'){reply({url:api.runtime.getURL('dashboard.html')});return false;}
});
