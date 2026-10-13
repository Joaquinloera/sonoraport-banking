import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
/** Additive production deployment for existing sonoraportaiholdingllc.com.
 * Preserve published homepage, static assets and deployed financial functions.
 * Do NOT create a new site or replace the current site with repository root. */
export const SITE_ID='588bcdea-734c-4b3c-a225-1ef92c20ef53';
export const HOST='sonoraportaiholdingllc.com';
export const ASSETS=Object.freeze([
 'website/global-banking/index.html',
 'website/global-banking/portal.css',
 'website/global-banking/portal.js',
 'website/global-banking/portal-registry-fallback.mjs',
 'website/global-banking/public-registry-snapshot.json',
 'website/global-banking/research-seed.json',
 'website/home/index.html',
 'website/home/tmm-slideshow.css',
 'website/home/tmm-slideshow.js',
 'website/banking-matrix/index.html',
 'website/banking-matrix/matrix-data.js',
 'website/master-map/index.html',
 'website/master-map/master-data.js',
 'website/swarm-skim/index.html',
 'website/swarm-skim/evidence-data.js',
 'website/swarm-skim/command-center.html',
 'website/swarm-skim/corridor-workbench.html',
 'website/swarm-skim/global-corridor-swarm-20.json',
 'website/swarm-skim/global-corridor-swarm-20-b.json',
 'website/swarm-skim/global-corridor-swarm-20-c.json',
 'website/swarm-skim/cross-division-api-research-12.json',
 'website/swarm-skim/payments-evidence.json',
 'website/swarm-skim/cross-division-evidence.json',
 'website/global-banking/official-source-evidence.html',
 'website/global-banking/official-source-evidence.js',
 'website/global-banking/official-source-evidence.json'
]);
const h40=/^[0-9a-f]{40}$/i,h64=/^[0-9a-f]{64}$/i;
export function deploymentPlan({files,functions,assets}){
 if(!Array.isArray(files)||!files.length||!Array.isArray(functions))throw Error('PUBLISHED_MANIFEST_UNAVAILABLE');
 const retained={};
 for(const f of files){
  const path=f.path??f.id;
  if(typeof path!=='string'||!path.startsWith('/')||path.includes('..')||!h40.test(f.sha??''))throw Error('UNVERIFIED_PUBLISHED_FILE');
  if(Object.hasOwn(retained,path))throw Error('DUPLICATE_PUBLISHED_FILE');
  retained[path]=f.sha;
 }
 if(!Object.hasOwn(retained,'/index.html'))throw Error('EXISTING_HOMEPAGE_NOT_FOUND');
 const preservedFunctions={};
 for(const f of functions){
  const name=f.n??f.name,hash=f.d??f.sha;
  if(!name||!/^[a-z0-9][a-z0-9-]*$/i.test(name)||!h64.test(hash??'')||Object.hasOwn(preservedFunctions,name))throw Error('UNVERIFIED_PUBLISHED_FUNCTION');
  preservedFunctions[name]=hash;
 }
 const payloads={};
 for(const {path,bytes} of assets){
  if(!ASSETS.includes(path)||!Buffer.isBuffer(bytes))throw Error('UNAPPROVED_OVERLAY_ASSET');
  const key='/'+path;
  if(Object.hasOwn(payloads,key))throw Error('DUPLICATE_OVERLAY_FILE');
  payloads[key]=bytes;
  retained[key]=createHash('sha1').update(bytes).digest('hex');
 }
 if(Object.keys(payloads).length!==ASSETS.length)throw Error('INCOMPLETE_OVERLAY');
 return {files:retained,functions:preservedFunctions,payloads,previousFileCount:files.length,previousFunctionCount:functions.length};
}
async function main(){
 const token=process.env.NETLIFY_AUTH_TOKEN;
 if(!token||token.length<20)throw Error('NETLIFY_AUTH_TOKEN_MISSING_OR_UNUSABLE');
 if(process.env.NETLIFY_SITE_ID!==SITE_ID)throw Error('WRONG_PRODUCTION_SITE_ID');
 const base='https://api.netlify.com/api/v1',auth={Authorization:'Bearer '+token};
 async function api(path,{method='GET',body,contentType,raw=false}={}){
  const response=await fetch(base+path,{method,headers:{...auth,...(contentType?{'Content-Type':contentType}:{})},body,redirect:'error'});
  if(!response.ok)throw Error('NETLIFY_API_'+response.status+'_'+method+'_'+path.split('?')[0]);
  return raw?response:response.json();
 }
 const site=await api('/sites/'+SITE_ID);
 const liveHost=site.custom_domain??new URL(site.ssl_url??site.url).hostname;
 if(site.id!==SITE_ID||liveHost!==HOST)throw Error('SITE_DOMAIN_OR_ID_MISMATCH');
 const oldId=site.published_deploy?.id;
 if(!oldId)throw Error('NO_PUBLISHED_DEPLOY_TO_PRESERVE');
 const old=await api('/sites/'+SITE_ID+'/deploys/'+oldId);
 if(old.state!=='ready'||!Array.isArray(old.available_functions))throw Error('UNABLE_TO_PRESERVE_PUBLISHED_FUNCTIONS');
 // A manually uploaded published deploy may not expose the site-level file index.
 // Fall back to the published deploy's file manifest, never to a new/blank site.
 const inventories=[
  '/sites/'+SITE_ID+'/files?per_page=100',
  '/deploys/'+oldId+'/files?per_page=100',
  '/sites/'+SITE_ID+'/deploys/'+oldId+'/files?per_page=100'
 ];
 let files=null,inventoryUsed='';
 for(const first of inventories){
  const found=[];let next=first,missing=false;
  for(let p=0;next&&p<100;p++){
   let response;
   try{response=await api(next,{raw:true});}
   catch(error){
    if(String(error.message).includes('NETLIFY_API_404_GET_')){missing=true;break;}
    throw error;
   }
   const chunk=await response.json();
   if(!Array.isArray(chunk))throw Error('FILE_LIST_NOT_ARRAY:'+first);
   found.push(...chunk);
   const links=response.headers.get('link')||'',match=links.match(/<([^>]+)>;\s*rel="next"/);
   next=match?new URL(match[1]).pathname+new URL(match[1]).search:null;
   if(p===99&&next)throw Error('FILE_LIST_PAGINATION_TRUNCATED');
  }
  if(!missing&&found.length&&found.some(f=>(f.path??f.id)==='/index.html')){
   files=found;inventoryUsed=first.split('?')[0];break;
  }
 }
 if(!files)throw Error('PUBLISHED_SITE_FILE_MANIFEST_UNAVAILABLE_NO_DEPLOY');
 console.log('Verified existing production static file manifest:',files.length,'via',inventoryUsed);
 const root=resolve(process.env.GITHUB_WORKSPACE||'.');
 const assets=ASSETS.map(path=>({path,bytes:readFileSync(join(root,path))}));
 const plan=deploymentPlan({files,functions:old.available_functions,assets});
 const before=await api('/sites/'+SITE_ID);
 if(before.published_deploy?.id!==oldId)throw Error('SITE_CHANGED_DURING_PREPARATION');
 const deploy=await api('/sites/'+SITE_ID+'/deploys',{method:'POST',contentType:'application/json',body:JSON.stringify({files:plan.files,functions:plan.functions,title:'KINO additive global banking live website build'})});
 if((deploy.required_functions??[]).length)throw Error('EXISTING_FUNCTION_BUNDLE_REUPLOAD_REQUIRED_ABORTED');
 const digests=new Map(Object.entries(plan.payloads).map(([path,bytes])=>[createHash('sha1').update(bytes).digest('hex'),path]));
 const required=new Set((deploy.required??[]).map(x=>digests.get(x)??x)),allowed=new Set(Object.keys(plan.payloads));
 for(const path of required)if(!allowed.has(path))throw Error('EXISTING_STATIC_FILE_REUPLOAD_REQUIRED_ABORTED');
 for(const path of required){
  const encoded=path.slice(1).split('/').map(encodeURIComponent).join('/');
  await api('/deploys/'+deploy.id+'/files/'+encoded,{method:'PUT',body:plan.payloads[path],contentType:'application/octet-stream',raw:true});
 }
 let state;
 for(let p=0;p<35;p++){
  state=await api('/sites/'+SITE_ID+'/deploys/'+deploy.id);
  if(state.state==='ready')break;
  if(['error','rejected','cancelled'].includes(state.state))throw Error('NETLIFY_DEPLOY_FAILED_'+state.state);
  await new Promise(r=>setTimeout(r,3000));
 }
 if(state.state!=='ready')throw Error('PRODUCTION_DEPLOY_NOT_READY');
 const final=await api('/sites/'+SITE_ID);
 if(final.published_deploy?.id!==deploy.id)throw Error('PRODUCTION_DEPLOY_NOT_PUBLISHED');
 const finalDeploy=await api('/sites/'+SITE_ID+'/deploys/'+deploy.id);
 const names=new Set((finalDeploy.available_functions??[]).map(f=>f.n??f.name));
 for(const name of Object.keys(plan.functions))if(!names.has(name))throw Error('PREVIOUS_FUNCTION_MISSING_AFTER_DEPLOY_'+name);
 const smokePages=[
  ['/website/home/','SonoraPort AI Holding LLC'],
  ['/website/global-banking/','Research-only platform'],
  ['/website/global-banking/official-source-evidence.html','Official banking API evidence'],
  ['/website/banking-matrix/','SonoraPort Banking Matrix'],
  ['/website/master-map/','SWARM + SKIM Master Integration Map'],
  ['/website/swarm-skim/','SWARM + SKIM · Banking evidence'],
  ['/website/swarm-skim/command-center.html','SWARM'],
  ['/website/swarm-skim/corridor-workbench.html','corridor']
 ];
 for(const [route,marker] of smokePages){
  const check=await fetch('https://'+HOST+route,{redirect:'follow',cache:'no-store'});
  if(!check.ok||!(await check.text()).toLowerCase().includes(marker.toLowerCase()))throw Error('PRODUCTION_PAGE_SMOKE_TEST_FAILED:'+route);
 }
 const retainedHome=await api('/sites/'+SITE_ID+'/files/index.html');
 if(retainedHome.sha!==plan.files['/index.html'])throw Error('PRODUCTION_HOME_CONTENT_CHANGED');
 const receipt={status:'LIVE_PRODUCTION_PUBLISHED_AND_SMOKE_TESTED',url:'https://'+HOST,deployId:deploy.id,previousDeployId:oldId,preservedFunctions:plan.previousFunctionCount,preservedFiles:plan.previousFileCount,addedFiles:ASSETS.length,commit:process.env.GITHUB_SHA||null};
 console.log(JSON.stringify(receipt));
 if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,'## Live SonoraPort deployment\n'+Object.entries(receipt).map(([k,v])=>'- '+k+': '+v).join('\n')+'\n',{flag:'a'});
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 main().catch(err=>{console.error('SONORAPORT_PRODUCTION_NOT_VERIFIED:',err.message);process.exitCode=1});
}
