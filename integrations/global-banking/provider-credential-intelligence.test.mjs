import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GlobalBankingCatalog} from './provider-catalog.mjs';
import {ProviderCredentialIntelligence} from './provider-credential-intelligence.mjs';
const skim=JSON.parse(readFileSync(new URL('../../research/global-provider-api-auth-skim-2026-10-12.json',import.meta.url),'utf8'));
const makeEntry=(id,name,kind='commercial_bank_api')=>({id,name,kind,source:{repo:'Joaquinloera/sonoraport-banking',path:'data/banking-architecture-research.json',section:'providers',sourceIndex:0},integration:{productionExecution:false,credentialsStoredHere:false,connectionState:'NOT_VERIFIED_CONNECTED'},technicalResearch:{},evidenceStatus:kind==='historical_claims_unverified'?'SOURCE_STATED_NOT_INDEPENDENTLY_VERIFIED':'REPOSITORY_RESEARCH_NOT_LIVE_VERIFIED'});
const catalog=new GlobalBankingCatalog({records:[makeEntry('a','Citi'),makeEntry('b','ICBC Europe'),makeEntry('c','Visa Developer'),makeEntry('d','Stripe'),makeEntry('e','Citi','historical_claims_unverified'),makeEntry('f','China CIPS')]});
test('join known exact names and explicit aliases only',()=>{
 const r=new ProviderCredentialIntelligence({catalog,skim}).overview();
 assert.equal(r.originalSourceEntries,6);assert.equal(r.reviewedDeveloperProviders,skim.providers.length);
 assert.deepEqual(r.providerMappings.find(x=>x.provider==='Citi Developer APIs').sourceCatalogIds,['a']);
 assert.deepEqual(r.providerMappings.find(x=>x.provider==='ICBC European Open Banking').sourceCatalogIds,['b']);
 assert.deepEqual(r.providerMappings.find(x=>x.provider==='CIPS Direct Participant').sourceCatalogIds,['f']);
});
test('historical bank claims cannot become verified matches',()=>{
 const r=new ProviderCredentialIntelligence({catalog,skim}).overview();
 assert.ok(!r.providerMappings.some(x=>x.sourceCatalogIds.includes('e')));
 assert.equal(r.liveProviderConnectionsVerified,0);
 assert.ok(r.providerMappings.every(x=>x.liveProviderConnected===false && x.credentialsIssuedOrPossessed===false));
});
test('unmatched providers retained as research gaps, not deleted',()=>{
 const r=new ProviderCredentialIntelligence({catalog,skim}).overview();
 assert.ok(r.developerProvidersUnmatched.includes('Wise Platform'));
 assert.ok(r.providerMappings.find(x=>x.provider==='Wise Platform'));
});
test('rejects SKIM metadata that asserts production connection or stored keys',()=>{
 assert.throws(()=>new ProviderCredentialIntelligence({catalog,skim:{...skim,productionProviderConnectionsVerified:1}}),/UNSAFE_RESEARCH_CLAIMS/);
 assert.throws(()=>new ProviderCredentialIntelligence({catalog,skim:{...skim,privateKeysOrTokensStored:true}}),/UNSAFE_RESEARCH_CLAIMS/);
 assert.throws(()=>new ProviderCredentialIntelligence({catalog,skim:{...skim,providers:[{...skim.providers[0],integrationStatus:'LIVE'}]}}).overview(),/UNSAFE_PROVIDER_INTELLIGENCE/);
});