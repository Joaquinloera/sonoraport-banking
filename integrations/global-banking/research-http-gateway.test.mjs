import test from 'node:test';
import assert from 'node:assert/strict';
import {GlobalBankingCatalog} from './provider-catalog.mjs';
import {ProviderCredentialIntelligence} from './provider-credential-intelligence.mjs';
import {createReadOnlyBankingResearchServer} from './research-http-gateway.mjs';
const source={repo:'Joaquinloera/sonoraport-banking',path:'data/global-banking-all-providers-registry.json',section:'records',sourceIndex:0};
function entry(id,name,kind='commercial_bank_api_research'){
 return {id,name,kind,region:'Global',country:'US',category:'Test research',publicReferenceUrl:'https://developer.paypal.com/api/rest',source,
 evidenceStatus:kind==='historical_claims_unverified'?'SOURCE_STATED_NOT_INDEPENDENTLY_VERIFIED':'REPOSITORY_RESEARCH_NOT_LIVE_VERIFIED',
 integration:{productionExecution:false,credentialsStoredHere:false,connectionState:'NOT_VERIFIED_CONNECTED'},
 technicalResearch:{documentedAuthMethods:[],documentedEndpoints:[],documentedApiCapabilities:[],sdkLanguages:[],sandboxAccess:'NOT_VERIFIED'}};
}
const catalog=new GlobalBankingCatalog({records:[entry('p1','PayPal'),entry('p2','CIPS'),entry('p3','Confidential Historic Account','historical_claims_unverified')]});
const skim={productionProviderConnectionsVerified:0,privateKeysOrTokensStored:false,providers:[{name:'PayPal REST APIs',sourceUrl:'https://developer.paypal.com/api/rest',sourceStatus:'PUBLIC_DOCUMENT_FETCHED',integrationStatus:'DOCS_ONLY_NOT_CONNECTED',authenticationEvidence:['OAuth 2.0 documentation only']}]};
const intelligence=new ProviderCredentialIntelligence({catalog,skim});
async function useServer(run){
 const server=createReadOnlyBankingResearchServer({catalog,intelligence});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 try{const base='http://127.0.0.1:'+server.address().port;await run(base);}finally{await new Promise(resolve=>server.close(resolve));}
}
test('health endpoint is read-only and never claims bank connections',()=>useServer(async base=>{
 const r=await fetch(base+'/health');assert.equal(r.status,200);const body=await r.json();assert.equal(body.paymentsEnabled,false);assert.equal(body.bankingCredentialsConnected,false);
 assert.equal(r.headers.get('access-control-allow-origin'),null);
}));
test('search returns only sourced research and excludes historical bank claims',()=>useServer(async base=>{
 const r=await fetch(base+'/v1/providers?limit=10');assert.equal(r.status,200);const d=await r.json();assert.equal(d.total,2);assert.ok(d.records.every(p=>p.productionExecution===false));
 const archive=await fetch(base+'/v1/providers/p3');assert.equal(archive.status,404);
}));
test('integration checklist explicitly blocks production and payment initiation',()=>useServer(async base=>{
 const resp=await fetch(base+'/v1/providers/p1/integration-checklist');assert.equal(resp.status,200);const d=await resp.json();
 assert.equal(d.productionReady,false);assert.equal(d.livePaymentCapable,false);assert.equal(d.needsProviderCredentialAuthorization,true);
}));
test('provider developer research remains documentation-only',()=>useServer(async base=>{
 const r=await fetch(base+'/v1/developer-research');const d=await r.json();assert.equal(d.liveProviderConnectionsVerified,0);
 assert.equal(d.providerMappings[0].credentialsIssuedOrPossessed,false);assert.deepEqual(d.providerMappings[0].sourceCatalogIds,['p1']);
}));
test('rejects unsafe methods, invalid pagination, unsupported fields and unknown endpoints',()=>useServer(async base=>{
 const cases=[['POST','/v1/providers',405],['GET','/v1/providers?limit=1000',400],['GET','/v1/providers?offset=-1',400],['GET','/v1/providers?apiKey=private',400],['GET','/v1/payments/send',404],['GET','/v1/providers/unknown',404]];
 for(const [method,path,code] of cases){const r=await fetch(base+path,{method});assert.equal(r.status,code,path);}
}));
test('read-only response never includes raw balances, account numbers or secret values',()=>useServer(async base=>{
 for(const path of ['/v1/providers','/v1/providers/p1','/v1/developer-research','/v1/providers/p1/integration-checklist']){
  const body=await (await fetch(base+path)).text();assert.ok(!/balanceUSD|accountNumber|clientSecret|secretKey|sk_live_/i.test(body),path);
 }
}));
test('rejects mismatched source registries rather than silently combining',()=>{
 const other=new GlobalBankingCatalog({records:[entry('q1','Unrelated')]});
 assert.throws(()=>createReadOnlyBankingResearchServer({catalog:other,intelligence}),/GATEWAY_SOURCE_MISMATCH/);
});
