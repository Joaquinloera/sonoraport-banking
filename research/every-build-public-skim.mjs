#!/usr/bin/env node
/* KINO #281102: public documentation evidence skimmer, executed every GitHub build.
   Runs concurrent official-source HTTP GETs. This is NOT autonomous hosted AI agents,
   account access, a settlement gateway, or an API credential-discovery tool. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const catalog=JSON.parse(readFileSync(resolve(root,'website/master-map/every-build-map.json'),'utf8'));
const safe=/^https:\/\//;
const maxBytes=64*1024,timeoutMs=6500,parallel=8;
function validate(){
 if(catalog.schema!=='sonoraport.every-build-master-map.v1'||!catalog.requiredEveryBuild)throw Error('MAP_NOT_ENFORCED');
 if(catalog.lanes.length!==17||catalog.brics.length!==11||catalog.providers.length<50||catalog.corridors.length<25)throw Error('MAP_REQUIREMENTS_MISSING');
 for(const p of catalog.providers){
  const url=new URL(p.sourceUrl);
  if(!safe.test(p.sourceUrl)||url.username||url.password||url.port||url.hash||!url.hostname.includes('.')||['localhost','0.0.0.0','127.0.0.1'].includes(url.hostname))throw Error('INVALID_OFFICIAL_SOURCE:'+p.name);
 }
 return true;
}
validate();
if(process.argv.includes('--check')){console.log('KINO every-build 17 lanes, '+catalog.providers.length+' providers, '+catalog.corridors.length+' corridors validated');process.exit(0)}
async function skim(p){
 const started=Date.now();
 const result={name:p.name,lane:p.lane,country:p.country,sourceUrl:p.sourceUrl,method:'HTTPS_GET_PUBLIC_ONLY',credentialValue:'NOT_REQUESTED',status:'',httpStatus:null,bytesRead:0,sha256:null,mime:null,authSignals:[],elapsedMs:null};
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const r=await fetch(p.sourceUrl,{method:'GET',redirect:'manual',signal:controller.signal,headers:{Accept:'text/html,application/json,text/plain,application/xml;q=0.5','User-Agent':'SonoraPort-KINO-PublicDocResearch/1.0'}});
  result.httpStatus=r.status;
  result.mime=(r.headers.get('content-type')||'').slice(0,130);
  if(!r.ok){result.status='HTTP_'+r.status;await r.body?.cancel();return result}
  if(!/text\/|json|xml|javascript/.test(result.mime)){result.status='NON_TEXT_CONTENT';await r.body?.cancel();return result}
  const parts=[];let size=0;
  if(!r.body){result.status='EMPTY_BODY';return result}
  const reader=r.body.getReader();
  try{while(size<maxBytes){const c=await reader.read();if(c.done)break;const part=c.value.subarray(0,Math.min(c.value.length,maxBytes-size));parts.push(part);size+=part.length;if(!part.length)break}}
  finally{await reader.cancel().catch(()=>{})}
  const raw=Buffer.concat(parts);result.bytesRead=raw.length;result.sha256=createHash('sha256').update(raw).digest('hex');
  const text=raw.toString('utf8');
  for(const [name,rule] of Object.entries({OAuth:/\boauth\b/i,mTLS:/\bmutual\s+tls\b|\bmtls\b/i,SDK:/\bsdk\b/i,API_KEY:/\bapi[\s-]?key\b/i,SANDBOX:/\bsandbox\b/i,WEBHOOK:/\bwebhook\b/i,OpenAPI:/\bopenapi\b|\bswagger\b/i})){
   if(rule.test(text))result.authSignals.push(name)
  }
  result.status=raw.length<128?'INSUFFICIENT_CONTENT':'FETCHED_PUBLIC_DOCUMENT';
 }catch(error){result.status=error?.name==='AbortError'?'TIMEOUT':'SOURCE_UNAVAILABLE';result.failureCategory=String(error?.name||'UNKNOWN').slice(0,40)}
 finally{clearTimeout(timeout);result.elapsedMs=Date.now()-started}
 return result;
}
const jobs=catalog.providers.map((provider,i)=>({provider,index:i}));const records=new Array(jobs.length);let cursor=0;
async function worker(){while(cursor<jobs.length){const index=cursor++;records[index]=await skim(jobs[index].provider)}}
await Promise.all(Array.from({length:parallel},()=>worker()));
const laneResults=catalog.lanes.map(lane=>{
 const attempted=records.filter(x=>x.lane===lane.id);
 return {id:lane.id,agentWing:lane.agentWing,required:true,recordsAttempted:attempted.length,publicDocumentsFetched:attempted.filter(x=>x.status==='FETCHED_PUBLIC_DOCUMENT').length,
  action:attempted.length?'PUBLIC_OFFICIAL_SOURCE_SWARM_SKIM':'INTERNAL_PROJECT_RECOVERY_AND_CODE_AUDIT_REQUIRED',state:attempted.length?'ATTEMPTED':'NOT_YET_EXECUTED'};
});
const summary={schema:'sonoraport.public-swarm-receipt.v1',buildCommit:process.env.GITHUB_SHA||null,createdAt:new Date().toISOString(),
 execution:'EIGHT_CONCURRENT_PUBLIC_DOC_WORKERS_NOT_HOSTED_LLM_AGENTS',agentCountClaimed:0,
 numberOfLanes:laneResults.length,providerAttempts:records.length,fetchSuccesses:records.filter(x=>x.status==='FETCHED_PUBLIC_DOCUMENT').length,
 fetchFailures:records.filter(x=>x.status!=='FETCHED_PUBLIC_DOCUMENT').length,
 warning:'Research signals are text-pattern observations. No institutional credentials, API access or live bank payments verified',
 laneResults,receipts:records};
if(summary.providerAttempts!==catalog.providers.length||summary.numberOfLanes!==17)throw Error('RESEARCH_JOB_INCOMPLETE');
const output=resolve(root,'research/output/kino-every-build-public-skim-receipts.json');mkdirSync(resolve(root,'research/output'),{recursive:true});writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({schema:summary.schema,lanes:summary.numberOfLanes,providers:summary.providerAttempts,success:summary.fetchSuccesses,fail:summary.fetchFailures,artifact:output}));
if(process.env.GITHUB_STEP_SUMMARY){
 const table=laneResults.map(x=>'| '+x.id+' | '+x.recordsAttempted+' | '+x.publicDocumentsFetched+' | '+x.state+' |').join('\n');
 writeFileSync(process.env.GITHUB_STEP_SUMMARY,'## Every-build global BRICS bank SWARM+SKIM research\nAll 17 lanes mapped. HTTPS GET research executed on '+summary.providerAttempts+' records (not hosted autonomous AI agents).\n\n| Lane | Attempts | Fetched | State |\n|---|---:|---:|---|\n'+table+'\n\n',{flag:'a'});
}
