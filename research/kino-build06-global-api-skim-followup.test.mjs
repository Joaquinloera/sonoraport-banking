import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('./kino-build06-global-api-skim-followup-2026-10-12.json',import.meta.url),'utf8'));
test('KINO official-source SWARM SKIM research retains all eight observed documentation leads',()=>{
  assert.equal(data.sourceCount,8);
  assert.equal(data.sources.length,8);
  assert.equal(data.officialPagesFetched,7);
  assert.equal(data.searchLeadsPendingVerification,1);
  assert.equal(data.sources.filter(s=>s.verification==='OFFICIAL_SEARCH_LEAD_FETCH_EMPTY').length,1);
});
test('public research neither possesses credentials nor asserts banking partnerships or transfers',()=>{
  assert.equal(data.credentialsIssuedOrPossessed,false);
  assert.equal(data.providerPartnershipsVerified,0);
  assert.equal(data.productionBankingConnections,0);
  assert.equal(data.financialTransfersExecuted,0);
  for(const s of data.sources){
    assert.ok(s.url.startsWith('https://'));
    assert.equal(s.connectionStatus,'DOCS_ONLY_NOT_CONNECTED');
    assert.equal(s.credentialsPossessed,false);
    assert.ok(s.publicFinding.length>30);
  }
  const raw=JSON.stringify(data);
  for(const key of ['accountNumber','routingNumber','balanceUSD','accessToken','clientSecret','privateKey','sk_live_']) assert.ok(!raw.includes(key),key);
});
test('direct official-source failures never count as verified content or authorized access',()=>{
  const wells=data.sources.find(x=>x.provider==='Wells Fargo Gateway');
  assert.equal(wells.verification,'OFFICIAL_SEARCH_LEAD_FETCH_EMPTY');
  assert.equal(wells.onboarding,'DIRECT_SOURCE_VERIFICATION_PENDING');
  const hsbc=data.sources.filter(x=>x.provider.includes('HSBC'));
  assert.equal(hsbc.length,2);
  assert.ok(hsbc.every(x=>x.verification==='OFFICIAL_PAGE_FETCHED'));
  assert.ok(data.sources.some(x=>x.lane==='CHINA'&&x.onboarding==='INSTITUTIONAL_PARTICIPATION_REQUIRED'));
});
