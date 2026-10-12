import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('./official-19-lane-execution-manifest-2026-10-12-v2.json',import.meta.url),'utf8'));
test('preserves all 19 lanes, expands official-document jobs to 18 without inventing Iran verification',()=>{
 assert.equal(registry.coverage.length,19);
 assert.equal(new Set(registry.coverage.map(x=>x.lane)).size,19);
 assert.equal(registry.jobs.length,18);
 const pending=registry.coverage.filter(x=>x.sourceVerificationStatus==='OFFICIAL_DOCS_RESEARCH_PENDING');
 assert.deepEqual(pending.map(x=>x.lane),['IRAN']);
 assert.equal(registry.liveAgentExecution,false);
 assert.equal(registry.bankingProductionConnected,false);
});
test('two-source public-doc jobs match lane coverage and exact allowed hosts',()=>{
 const hosts=new Set(registry.allowedHosts);
 const ids=new Set;
 for(const job of registry.jobs){
  assert.ok(!ids.has(job.id));ids.add(job.id);
  assert.equal(job.sourceUrls.length,2);
  assert.equal(new Set(job.sourceUrls).size,2);
  const coverage=registry.coverage.find(x=>x.lane===job.lane);
  assert.equal(coverage.sourceVerificationStatus,'TWO_OFFICIAL_DOCS_FETCHED');
  assert.deepEqual(coverage.sourceUrls,job.sourceUrls);
  for(const source of job.sourceUrls){const url=new URL(source);assert.equal(url.protocol,'https:');assert.ok(hosts.has(url.hostname));assert.equal(url.username,'');assert.equal(url.password,'');assert.equal(url.port,'');}
 }
});
test('source registry cannot assert API keys, sandbox access, live provider integration or bank balances',()=>{
 assert.ok(registry.coverage.every(x=>x.liveProviderConnected===false&&x.officialApiKeyVerified===false&&x.sandboxAuthorized===false));
 const leakKeys=/(?:"apiKey"|"accessToken"|"clientSecret"|"privateKey"|"accountNumber"|"balanceUSD")\s*:/i;
 assert.doesNotMatch(JSON.stringify(registry),leakKeys);
});