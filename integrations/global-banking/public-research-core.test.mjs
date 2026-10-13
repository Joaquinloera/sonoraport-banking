import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicResearchHandler} from './public-research-core.mjs';
const row=(id,name,kind='commercial_bank_api_research')=>({id,name,kind,region:'US_CANADA',country:'US',
 publicReferenceUrl:'https://developer.citi.com/',source:{repo:'Joaquinloera/sonoraport-banking',path:'research/fake-source.json'},
 evidenceStatus:'REPOSITORY_RESEARCH_NOT_LIVE_VERIFIED',integration:{productionExecution:false,credentialsStoredHere:false},technicalResearch:{}});
const registry={records:[row('citi-01','Citi'),row('bank-02','Goldman Sachs'),row('claim-03','Historic Private Account','historical_claims_unverified')]};
const skim={productionProviderConnectionsVerified:0,privateKeysOrTokensStored:false,providers:[{name:'Citi',sourceUrl:'https://developer.citi.com/',region:'US_CANADA',category:'bank',sourceStatus:'OFFICIAL_PAGE_FETCHED',authenticationEvidence:['OAuth 2.0'],credentialIssuance:'Provider-approved developer onboarding',sandboxOrTest:'Test documentation'}]};
const manifest={bankingProductionConnected:false,coverage:[{lane:'US_CANADA',sourceVerificationStatus:'TWO_OFFICIAL_DOCS_FETCHED'},{lane:'IRAN',sourceVerificationStatus:'OFFICIAL_DOCS_RESEARCH_PENDING'}]};
const api=createPublicResearchHandler({registry,skim,manifest});
const ask=async(path,opts)=>api(new Request('https://bank.example/api/global-banking'+path,opts));
test('public summary accurately separates research entries, logical agents and real connections',async()=>{
 const r=await ask('/summary');assert.equal(r.status,200);const d=await r.json();
 assert.equal(d.sourceEntries,3);assert.equal(d.publicResearchEntries,2);assert.equal(d.historicalEntriesExcluded,1);
 assert.equal(d.logicalAgentsDefined,144);assert.equal(d.hostedAIAgentsVerified,0);assert.equal(d.transfersEnabled,false);
});
test('search filters and pages only approved public research, excluding archive',async()=>{
 const all=await (await ask('/providers?limit=50')).json();assert.equal(all.total,2);
 assert.ok(all.records.every(x=>x.integrationStatus==='NOT_VERIFIED_CONNECTED'));
 assert.ok(!all.records.some(x=>x.id==='claim-03'));
 const one=await(await ask('/providers?query=citi&limit=1')).json();assert.equal(one.total,1);assert.equal(one.records[0].name,'Citi');
 const detail=await ask('/providers/citi-01');assert.equal(detail.status,200);
 assert.equal((await ask('/providers/claim-03')).status,404);
});
test('verified documentation is visibly DOCS_ONLY with no credential possession',async()=>{
 const d=await (await ask('/developer-docs')).json();assert.equal(d.total,1);
 assert.equal(d.providers[0].productionConnected,false);assert.equal(d.providers[0].credentialsPossessed,false);
});
test('region endpoint preserves a pending region rather than pretending verification',async()=>{
 const d=await (await ask('/regions')).json();assert.equal(d.regions.length,2);
 assert.equal(d.regions[1].sourcesFetched,0);assert.equal(d.regions[1].bankingProviderConnected,false);
});
test('enforces read-only, bounded public queries and denies payment routes',async()=>{
 for(const [p,opts,status] of [['/providers',{method:'POST'},405],['/providers?limit=10000',{},400],['/providers?offset=-1',{},400],['/providers?apiKey=secret',{},400],['/transfers/initiate',{},404],['/providers/%252e%252e',{},400]]){
  const resp=await ask(p,opts);assert.equal(resp.status,status,p);
 }
});
test('HEAD sends headers without a body',async()=>{
 const r=await ask('/summary',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');
});
test('fails closed on any source asserting live money movement or embedded credentials',()=>{
 assert.throws(()=>createPublicResearchHandler({registry:{records:[{...row('unsafe','Bad'),integration:{productionExecution:true,credentialsStoredHere:false}}]},skim,manifest}),/PRODUCTION_RESEARCH_CLAIM_REJECTED/);
 assert.throws(()=>createPublicResearchHandler({registry:{records:[{...row('unsafe2','Bad'),apiKey:'test'}]},skim,manifest}),/PROHIBITED_RESEARCH_DATA/);
 assert.throws(()=>createPublicResearchHandler({registry,skim:{...skim,productionProviderConnectionsVerified:1},manifest}),/SOURCE_CONNECTION_NOT_VERIFIED/);
});
test('never echoes source secret values or historical account claims',async()=>{
 for(const path of ['/summary','/providers','/developer-docs','/providers/citi-01']){
  const data=await (await ask(path)).text();assert.ok(!/Historic Private Account|balanceUSD|clientSecret|sk_live_/i.test(data));
 }
});