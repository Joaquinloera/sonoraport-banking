import test from 'node:test';
import assert from 'node:assert/strict';
import {GlobalBankingCatalog} from './provider-catalog.mjs';
const mk=(id,name,kind,extras={})=>({
  id,name,kind,region:'Global',country:null,category:'Research',
  publicReferenceUrl:'https://official.example.org/provider',
  evidenceStatus:kind==='historical_claims_unverified'?'SOURCE_STATED_NOT_INDEPENDENTLY_VERIFIED':'REPOSITORY_RESEARCH_NOT_LIVE_VERIFIED',
  source:{repo:'Joaquinloera/sonoraport-banking',path:'research/source.json',section:'records',sourceIndex:0},
  integration:{connectionState:'NOT_VERIFIED_CONNECTED',productionExecution:false,credentialsStoredHere:false},
  technicalResearch:{documentedAuthMethods:[],documentedApiCapabilities:[],documentedEndpoints:[],sdkLanguages:[],sandboxAccess:'NOT_VERIFIED'},...extras});
const registry={records:[mk('1','China CIPS','corridor_research',{region:'China'}),mk('2','New Development Bank','corridor_research'),mk('3','New Development Bank','international_financial_institution'),mk('4','Private Historical Treasury','historical_claims_unverified')]};
const cat=()=>new GlobalBankingCatalog(registry);
test('preserves separate source records and reports archive correctly',()=>{const c=cat();assert.equal(c.stats().sourceEntries,4);assert.equal(c.stats().coreResearchEntries,3);assert.equal(c.stats().historicalInstitutionNameEntries,1);assert.equal(c.search({query:'New Development Bank'}).total,2);});
test('historical records are excluded from normal search',()=>{const c=cat();assert.equal(c.search({query:'Treasury'}).total,0);assert.equal(c.search({query:'Treasury',includeArchive:true}).total,1);assert.equal(c.getById('4'),null);assert.equal(c.getById('4',{includeArchive:true}).name,'Private Historical Treasury');});
test('search supports region and bounds pagination',()=>{const c=cat();assert.equal(c.search({region:'China'}).total,1);assert.equal(c.search({query:'bank',limit:1,offset:1}).records.length,1);assert.throws(()=>c.search({limit:200}),/pagination/);});
test('catalog never returns transfer-ready without verified provider access',()=>{const c=cat();assert.equal(c.integrationChecklist('1').productionReady,false);assert.equal(c.integrationChecklist('1').needsProviderCredentialAuthorization,true);assert.equal(c.integrationChecklist('1').needsVerifiedEndpoint,true);assert.equal(c.integrationChecklist('4').historicalClaimsUnverified,true);});
test('rejects duplicate IDs, unverified production assertions and embedded account data',()=>{
 assert.throws(()=>new GlobalBankingCatalog({records:[registry.records[0],registry.records[0]]}),/Duplicate/);
 assert.throws(()=>new GlobalBankingCatalog({records:[mk('new','Unsafe','bank',{balanceUSD:1})]}),/private financial/);
 assert.throws(()=>new GlobalBankingCatalog({records:[mk('new','Unsafe','bank',{integration:{productionExecution:true,credentialsStoredHere:false}})]}),/fail-closed/);
});