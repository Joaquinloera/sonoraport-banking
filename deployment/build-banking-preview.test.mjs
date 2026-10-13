import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBankingPreview,PUBLIC_FILES} from './build-banking-preview.mjs';

function fixture(){
  const root=mkdtempSync(join(tmpdir(),'kino-source-'));
  const publicRoot=join(root,'website/global-banking');mkdirSync(publicRoot,{recursive:true});
  const files={
    'index.html':'<!doctype html><title>KINO</title>Research-only platform',
    'portal.css':'body{background:#fff}',
    'portal.js':'// public-registry-snapshot.json + filterSnapshot',
    'portal-registry-fallback.mjs':'export const filterSnapshot=()=>{};',
    'research-seed.json':JSON.stringify({providers:[{name:'Official public docs',integrationStatus:'DOCS_ONLY_NOT_CONNECTED',sourceUrl:'https://example.org'}],regions:Array.from({length:19},(_,i)=>({lane:'REGION_'+i}))}),
    'public-registry-snapshot.json':JSON.stringify({mode:'REPOSITORY_PUBLIC_RESEARCH_SNAPSHOT',status:'OFFLINE_DOCUMENTATION_SNAPSHOT_NOT_LIVE_BANKING',transfersEnabled:false,liveBankingConnectionsVerified:0,hostedAIAgentsVerified:0,sourceEntries:2,publicResearchEntries:1,historicalEntriesExcluded:1,records:[{id:'public-1',name:'Bank Research',kind:'commercial_bank_api_research',integrationStatus:'NOT_VERIFIED_CONNECTED',livePaymentCapable:false,productionReady:false}]})
  };
  for(const [file,content] of Object.entries(files))writeFileSync(join(publicRoot,file),content);
  return {root,publicRoot};
}
function run(f){const outputDir=join(tmpdir(),'kino-preview-'+Date.now()+'-'+Math.random().toString(36).slice(2));return buildBankingPreview({sourceRoot:f.root,outputDir});}
test('draft build publishes only six vetted public source files and two generated files',()=>{
 const f=fixture(),r=run(f);assert.equal(r.publicFiles,8);assert.equal(r.mainWebsiteChanged,false);
 assert.equal(r.hostedAgentsVerified,0);assert.equal(r.liveBankConnections,0);assert.equal(r.financialTransactionsInitiated,0);
 for(const file of PUBLIC_FILES)assert.ok(readFileSync(join(r.outputDir,file)).length>0,file);
 assert.deepEqual(readdirSync(r.outputDir).sort(),['_headers','index.html','website']);
 assert.match(readFileSync(join(r.outputDir,'index.html'),'utf8'),/main website/);
 assert.match(readFileSync(join(r.outputDir,'_headers'),'utf8'),/noindex, nofollow/);
});
test('output location must never overwrite the main source repository',()=>{
 const f=fixture();assert.throws(()=>buildBankingPreview({sourceRoot:f.root,outputDir:join(f.root,'deploy')}),/OUTSIDE_SOURCE/);
});
test('existing deploy directory cannot be silently overwritten',()=>{
 const f=fixture(),out=mkdtempSync(join(tmpdir(),'kino-existing-'));
 writeFileSync(join(out,'unrelated.txt'),'preserve');assert.throws(()=>buildBankingPreview({sourceRoot:f.root,outputDir:out}),/NOT_EMPTY/);
});
test('blocks forged live banking connectivity and hosted-agent status',()=>{
 const f=fixture(),p=join(f.publicRoot,'public-registry-snapshot.json');
 const obj=JSON.parse(readFileSync(p,'utf8'));obj.hostedAIAgentsVerified=144;writeFileSync(p,JSON.stringify(obj));
 assert.throws(()=>run(f),/UNSAFE_PUBLIC_SNAPSHOT/);
});
test('blocks private bank fields and archive records from public preview',()=>{
 const f=fixture(),p=join(f.publicRoot,'public-registry-snapshot.json');
 const obj=JSON.parse(readFileSync(p,'utf8'));obj.records[0].accountNumber='PRIVATE';writeFileSync(p,JSON.stringify(obj));
 assert.throws(()=>run(f),/PRIVATE_BANKING_FIELD_REJECTED/);
 delete obj.records[0].accountNumber;obj.records[0].kind='historical_claims_unverified';writeFileSync(p,JSON.stringify(obj));
 assert.throws(()=>run(f),/UNSAFE_PUBLIC_RESEARCH_RECORD/);
});
test('blocks missing portal modules and invalid public research seed',()=>{
 const f=fixture();const p=join(f.publicRoot,'research-seed.json');writeFileSync(p,'{}');
 assert.throws(()=>run(f),/UNSAFE_PUBLIC_RESEARCH_SEED/);
});
