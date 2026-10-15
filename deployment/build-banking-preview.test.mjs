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
    'official-source-evidence.html':'<!doctype html><html><a href="./official-source-evidence.json">Public bank API evidence</a></html>',
    'official-source-evidence.js':'// Read-only public documentation explorer',
    'official-source-evidence.json':JSON.stringify({mode:'PUBLIC_SOURCE_RESEARCH_NOT_PROVIDER_ACCESS',productionBankingConnectionsVerified:0,hostedAIAgentsVerified:0,entries:[{provider:'Example developer documentation',lane:'US_CANADA',sourceUrl:'https://example.org/developer',sourceTitle:'API development guide',documentedAuthentication:['OAuth2 approval required'],documentedCapability:['Documentation lookup'],providerOnboarding:'Provider approval required',sandboxAccess:'NOT_VERIFIED_AUTHORIZED'}]}),
    'research-seed.json':JSON.stringify({providers:[{name:'Official public docs',integrationStatus:'DOCS_ONLY_NOT_CONNECTED',sourceUrl:'https://example.org'}],regions:Array.from({length:19},(_,i)=>({lane:'REGION_'+i}))}),
    'public-registry-snapshot.json':JSON.stringify({mode:'REPOSITORY_PUBLIC_RESEARCH_SNAPSHOT',status:'OFFLINE_DOCUMENTATION_SNAPSHOT_NOT_LIVE_BANKING',transfersEnabled:false,liveBankingConnectionsVerified:0,hostedAIAgentsVerified:0,sourceEntries:2,publicResearchEntries:1,historicalEntriesExcluded:1,records:[{id:'public-1',name:'Bank Research',kind:'commercial_bank_api_research',integrationStatus:'NOT_VERIFIED_CONNECTED',livePaymentCapable:false,productionReady:false}]})
  };
  for(const [file,content] of Object.entries(files))writeFileSync(join(publicRoot,file),content);
  return {root,publicRoot};
}
function run(f){const outputDir=join(tmpdir(),'kino-preview-'+Date.now()+'-'+Math.random().toString(36).slice(2));return buildBankingPreview({sourceRoot:f.root,outputDir});}
test('draft build includes official source explorer and publishes only nine vetted source files',()=>{
 const f=fixture(),r=run(f);assert.equal(r.publicFiles,11);assert.equal(r.mainWebsiteChanged,false);
 assert.equal(r.hostedAgentsVerified,0);assert.equal(r.liveBankConnections,0);assert.equal(r.financialTransactionsInitiated,0);
 for(const file of PUBLIC_FILES)assert.ok(readFileSync(join(r.outputDir,file)).length>0,file);
 assert.deepEqual(readdirSync(r.outputDir).sort(),['_headers','index.html','website']);
 assert.match(readFileSync(join(r.outputDir,'index.html'),'utf8'),/main website/);
 assert.match(readFileSync(join(r.outputDir,'index.html'),'utf8'),/official-source-evidence.html/);
 assert.equal(r.officialDocumentPages,1);
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

test('rejects credential-bearing or forged official source evidence in a public Netlify draft',()=>{
 const f=fixture(),p=join(f.publicRoot,'official-source-evidence.json');
 const data=JSON.parse(readFileSync(p,'utf8'));
 data.entries[0].apiKey='must-not-ship';
 writeFileSync(p,JSON.stringify(data));
 assert.throws(()=>run(f),/PRIVATE_OFFICIAL_EVIDENCE_FIELD/);
 delete data.entries[0].apiKey;
 data.entries[0].sourceUrl='https://example.org/developer?access_token=unsafe';
 writeFileSync(p,JSON.stringify(data));
 assert.throws(()=>run(f),/UNSAFE_OFFICIAL_SOURCE_URL/);
});
test('rejects claims of hosted agents or connected banking in published evidence',()=>{
 const f=fixture(),p=join(f.publicRoot,'official-source-evidence.json');
 const data=JSON.parse(readFileSync(p,'utf8'));
 data.productionBankingConnectionsVerified=1;
 writeFileSync(p,JSON.stringify(data));
 assert.throws(()=>run(f),/UNSAFE_OFFICIAL_EVIDENCE/);
});
