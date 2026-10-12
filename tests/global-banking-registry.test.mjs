import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const registry = JSON.parse(readFileSync(new URL('../data/global-banking-all-providers-registry.json',import.meta.url),'utf8'));
const records = registry.records;
test('all original catalog families are retained',()=>{
  const expected = {corridor_research:60,commercial_bank_api_research:18,central_bank_directory:63,international_financial_institution:9,institution_reference:5,payment_network_reference:5,historical_claims_unverified:18};
  for (const [kind,count] of Object.entries(expected)) assert.equal(records.filter(r=>r.kind===kind).length,count,kind);
  assert.equal(records.length,178);
});
test('source references and unique IDs are retained',()=>{
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  for(const r of records) {
    assert.ok(r.name);
    assert.ok(r.source.repo.startsWith('Joaquinloera/'));
    assert.ok(r.source.path.endsWith('.json'));
    assert.ok(Number.isInteger(r.source.sourceIndex));
  }
});
test('all integrations remain fail-closed without provider authorization',()=>{
  for(const r of records) {
    assert.equal(r.integration.productionExecution,false);
    assert.equal(r.integration.credentialsStoredHere,false);
    assert.equal(r.integration.connectionState,'NOT_VERIFIED_CONNECTED');
    assert.equal(r.technicalResearch.apiKeyIssuance,'NEEDS_OFFICIAL_VERIFICATION');
  }
});
test('archive records do not carry account amounts or credential claims',()=>{
  for(const r of records.filter(r=>r.kind==='historical_claims_unverified')){
    assert.equal(r.evidenceStatus,'SOURCE_STATED_NOT_INDEPENDENTLY_VERIFIED');
    assert.equal(r.publicReferenceUrl,null);
    assert.equal(r.technicalResearch.summary,null);
  }
  for(const r of records) {
    for(const forbidden of ['balanceUSD','accountNumber','routingNumber','apiKey','clientSecret','privateKey','accessToken']) assert.ok(!Object.hasOwn(r,forbidden));
  }
});
