#!/usr/bin/env python3
"""One-time, server-side import of ALL public GitHub Releases for PortWatch projects.

This script is intended to run manually in GitHub Actions. It is deliberately
separate from monitor.py: clients never call the GitHub REST API, and normal
monitoring continues to use each repository's public releases.atom feed.
Imported records are marked historical and are never dispatched as notifications.
"""
from __future__ import annotations
import hashlib, json, os, re, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
TRACKER='https://portwatch-vi.xyz/data/tracker.json'
UA='GTA-6-Notifier-History-Importer/2.0 (+https://github.com/Nicknrss/GTA-6-Notifier)'
DEFAULT_REPOS=[
    'anrq0/SeriesX-Emulator',
    'avatarmanz/VIctory-7900XTX',
    'Belobug/VIctory-Belobug-AMD',
    'brcly/TuxBox',
    'californiaAlmonds/OpenScarlett',
    'Dark3581/AnyBox',
    'DexNom/VIctory',
    'edupode/anyxboxseries',
    'ethan00013/keylime',
    'Freminet/ScarlettX',
    'fxceless/victory-fork',
    'Hylanderry/DedSec',
    'ItsNotRexed/Leonida',
    'jadeowaowa/scarlett-layer',
    'JamesCicada/GTAVI-Recomp',
    'JPTuba9/xlaunch-vi',
    'Kajcsi/G6Recomp',
    'ljm-233/Xbgtasix',
    'LooperSalty/AnyXboxX',
    'luizwidmer/palmetto',
    'Marvisak/VIctory',
    'omonkeyz/xbox-emulator',
    'OnlyMoisties/GTA6-BootTest',
    'OpenCommunityEdition/OpenScarlett',
    'p-portela/SCARAB',
    'ProhorovIlja/NativeX-Runtime',
    'R0Y00/Xbox2Windows',
    'realdody/americas-recomp',
    'rpatty-dev/PercyScarlett',
    'sammwyy/xvalkyrie',
    'SSTGxf/ScarlettCompat',
    'Steinkoloss/port-of-the-americas',
    'stellarr-studio/kelvaroq',
    'ThatRecompDev/five-star-recomp',
    'trustno1-coder/VIctory-NVIDIA',
    'uiliannn/VItoriaBr',
    'xcl-dev/xcl',
    'Zettrox/ztrx',
    'zohaiblazuli/GrandTheftXbox',
]

def now(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def read_json(name, default):
 p=DATA/name
 return json.loads(p.read_text(encoding='utf-8')) if p.exists() else default
def write_json(name,obj):
 p=DATA/name; tmp=p.with_suffix(p.suffix+'.tmp'); tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); tmp.replace(p)
def request(url):
 headers={'User-Agent':UA,'Accept':'application/vnd.github+json, application/json'}
 token=os.environ.get('GH_HISTORY_TOKEN') or os.environ.get('GITHUB_TOKEN')
 if token: headers['Authorization']=f'Bearer {token}'
 req=urllib.request.Request(url,headers=headers)
 with urllib.request.urlopen(req,timeout=40) as r: return json.loads(r.read().decode('utf-8'))
def repo_from_value(v):
 if not isinstance(v,str): return None
 s=v.strip()
 m=re.search(r'(?:https?://)?(?:www\.)?github\.com/([^/\s]+)/([^/#?\s]+)',s,re.I)
 if m: return f'{m.group(1)}/{m.group(2).removesuffix('.git')}'
 m=re.fullmatch(r'([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)',s)
 return f'{m.group(1)}/{m.group(2)}' if m else None
def discover_repos(tracker,existing):
 repos=set(DEFAULT_REPOS)
 repos.update(x for x in existing if isinstance(x,str) and repo_from_value(x))
 for e in tracker.get('efforts',[]) if isinstance(tracker,dict) else []:
  for key in ('github','githubUrl','github_url','repositoryUrl','repository_url','repoUrl','repo_url','repository','repo'):
   candidate=repo_from_value(e.get(key))
   if candidate: repos.add(candidate)
  owner=e.get('githubOwner') or e.get('repoOwner') or e.get('owner')
  name=e.get('githubRepo') or e.get('repoName')
  if owner and name: repos.add(f'{owner}/{name}')
 return sorted(repos,key=str.casefold)
def main():
 DATA.mkdir(exist_ok=True)
 stamp=now()
 tracker=request(TRACKER)
 old=read_json('github-releases.json',{'schemaVersion':1,'repositories':DEFAULT_REPOS,'releases':[]})
 repos=discover_repos(tracker,old.get('repositories',[]))
 by_id={str(x.get('id')):x for x in old.get('releases',[]) if isinstance(x,dict) and x.get('id')}
 added=0; failed=[]
 for idx,repo in enumerate(repos,1):
  page=1
  while True:
   url=f'https://api.github.com/repos/{repo}/releases?per_page=100&page={page}'
   try: batch=request(url)
   except urllib.error.HTTPError as e:
    if e.code==404: failed.append({'repository':repo,'error':'repository not found or not public'}); break
    if e.code==403: failed.append({'repository':repo,'error':'API rate limit or access denied'}); break
    failed.append({'repository':repo,'error':f'HTTP {e.code}'}); break
   except Exception as e:
    failed.append({'repository':repo,'error':str(e)}); break
   if not isinstance(batch,list) or not batch: break
   for raw in batch:
    rid=str(raw.get('node_id') or raw.get('id') or raw.get('html_url') or '')
    if not rid: continue
    key=f'github-release:{repo}:{rid}'
    record={'id':key,'githubId':rid,'repository':repo,'title':raw.get('name') or raw.get('tag_name') or 'Release','tag':raw.get('tag_name') or '', 'published':raw.get('published_at') or raw.get('created_at') or '', 'url':raw.get('html_url') or f'https://github.com/{repo}/releases','summary':raw.get('body') or '', 'draft':bool(raw.get('draft')),'prerelease':bool(raw.get('prerelease')),'historical':True,'notify':False,'importedAt':stamp}
    if key not in by_id: by_id[key]=record; added+=1
   if len(batch)<100: break
   page+=1
   time.sleep(0.08)
  print(f'[{idx}/{len(repos)}] {repo}: {sum(1 for x in by_id.values() if x.get("repository")==repo)} release(s)')
 releases=sorted(by_id.values(),key=lambda x:(x.get('published') or '',x.get('repository') or '',x.get('tag') or ''),reverse=True)
 gh={'schemaVersion':2,'lastUpdated':stamp,'repositories':repos,'releases':releases,'baselineComplete':True,'historicalImport':{'completedAt':stamp,'complete':not failed,'repositoriesAttempted':len(repos),'releaseCount':len(releases),'newlyImported':added,'errors':failed,'source':'GitHub REST API; server-side one-time import only'}}
 # Historical releases also appear as non-notifying rows in the central event log.
 history=read_json('history.json',{'schemaVersion':1,'events':[]})
 events={str(e.get('id')):e for e in history.get('events',[]) if isinstance(e,dict) and e.get('id')}
 for r in releases:
  eid=hashlib.sha256(r['id'].encode()).hexdigest()[:24]
  events.setdefault(eid,{'id':eid,'timestamp':r.get('published') or stamp,'source':'github','category':'githubRelease','title':r.get('title') or 'GitHub Release','message':f"{r['repository']} — {r.get('tag') or r.get('title','Release')}",'url':r.get('url'),'externalId':r['id'],'historical':True,'notify':False})
 history.update({'schemaVersion':2,'lastUpdated':stamp,'events':sorted(events.values(),key=lambda e:str(e.get('timestamp') or ''),reverse=True),'historicalImportComplete':not failed})
 write_json('github-releases.json',gh); write_json('history.json',history)
 print(json.dumps({'repositories':len(repos),'releases':len(releases),'newlyImported':added,'errors':len(failed),'complete':not failed},ensure_ascii=False))
 if failed: raise SystemExit(2)
if __name__=='__main__': main()
