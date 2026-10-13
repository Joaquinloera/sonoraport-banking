import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('./every-build-map.json',import.meta.url),'utf8'));
const page=readFileSync(new URL('./every-build.html',import.meta.url),'utf8');
const REQUIRED=['GLOBAL_BANKS','BRICS_ALL_11','MEXICO','SOUTH_AMERICA','CARIBBEAN','AFRICA','ASIA_MIDDLE_EAST','PAYMENT_NETWORKS','CROSS_BORDER_CORRIDORS','API_AUTH_SDK','AI_CODEX_AGENTS','BLOCKCHAIN_DIGITAL_ASSETS','CARDS_BANKING_CORE','SITE_NETLIFY_GITHUB_SUPABASE','TMM_LAW','SONORAPORT_TRADE_INDUSTRIAL','OTHER_USER_PROJECTS'];
test('every-build map retains every mandatory KINO workflow stage',()=>{
 assert.equal(data.schema,'sonoraport.every-build-master-map.v1');
 assert.equal(data.requiredEveryBuild,true);
 assert.deepEqual(data.workflow,['RECOVER','AI AGENTS','SWARM','SKIM','CROSS-CHECK','CODE','TEST','SAVE','VERIFY']);
 assert.equal(data.agentArchitecture.definedSpecialistRoles,144);
 assert.equal(data.agentArchitecture.hostedIndependentLLMAgentsVerified,0);
 assert.equal(data.publishedDeploymentVerified,false);
});
test('all global/regional research workstreams are included in EVERY build',()=>{
 assert.deepEqual(data.lanes.map(x=>x.id),REQUIRED);
 for(const lane of data.lanes){
  assert.equal(lane.recurrence,'EVERY_BUILD',lane.id);
  assert.equal(lane.minimumDeliverables.length,6,lane.id);
  assert.ok(lane.scope.length>=1,lane.id);
  assert.ok(['CYBERCOM','CENTCOM','SOUTHCOM'].includes(lane.agentWing),lane.id);
 }
});
test('all 11 BRICS member countries and regional corridors are tracked',()=>{
 assert.deepEqual(data.brics.map(b=>b.country),['Brazil','Russia','India','China','South Africa','Egypt','Ethiopia','Iran','United Arab Emirates','Indonesia','Saudi Arabia']);
 assert.ok(data.corridors.length>=25);
 for(const corridor of data.corridors){
  assert.equal(corridor.status,'architecture-research');
  assert.equal(corridor.noRealMoneyTransfer,true);
  assert.ok(corridor.requires.some(x=>x.includes('KYC')));
 }
 for(const region of ['MEXICO','CARIBBEAN','SOUTH_AMERICA','AFRICA','BRICS_ALL_11'])
  assert.ok(data.corridors.some(c=>c.lane===region),'missing corridor lane '+region);
});
test('continuous bank inventory details official source, SDK, onboarding, keys and status without secrets',()=>{
 assert.ok(data.providers.length>=50);
 for(const provider of data.providers){
  assert.ok(provider.name&&provider.country&&provider.capability&&provider.authentication);
  assert.ok(new URL(provider.sourceUrl).protocol==='https:');
  assert.equal(provider.credentialValue,'NOT_STORED');
  assert.equal(provider.liveConnected,false);
  assert.equal(provider.detailsToSkim.length,7);
  assert.ok(REQUIRED.includes(provider.lane),'unknown lane '+provider.lane);
 }
 for(const needle of ['Pix','Bre-B','SPEI','CoDi','CIPS','UPI','Swift','FedNow','Visa','Codex','Ethereum','PayShap'])
  assert.ok(data.providers.some(p=>p.name.includes(needle)||p.capability.includes(needle)),'missing '+needle);
});
test('map guards existing production finances, website and law firm',()=>{
 assert.equal(data.deployment.customerFundsTransferVerified,false);
 assert.equal(data.deployment.cardProviderIssuedVerified,false);
 assert.ok(data.deployment.knownBlocker.includes('PUBLISHED_SITE_FILE'));
 assert.ok(data.immutableRequirements.some(q=>q.includes('existing designs')));
 assert.ok(data.otherProjectConnections.some(p=>p.name==='TMM Law Firm'));
});
test('website map is searchable and has authentic official-source links with no credential input',()=>{
 for(const el of ['lane-search','provider-search','provider-filter','corridor-search','id="brics"','id="pipeline"'])
  assert.ok(page.includes(el),el);
 assert.ok(page.includes('every-build-map.json'));
 assert.ok(page.includes('textContent'));
 assert.ok(!/<input[^>]*type=['"]password/i.test(page));
 assert.ok(!page.includes('innerHTML'));
});
