import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const doc=JSON.parse(readFileSync(new URL('./official-19-lane-execution-manifest-2026-10-12.json',import.meta.url),'utf8'));
test('covers 19 regional lanes without fabricating work for pending regions',()=>{
 assert.equal(doc.coverage.length,19);
 assert.equal(new Set(doc.coverage.map(x=>x.lane)).size,19);
 assert.equal(doc.jobs.length,9);
 assert.equal(doc.coverage.filter(x=>x.sourceVerificationStatus==='OFFICIAL_DOCS_RESEARCH_PENDING').length,10);
 assert.ok(doc.coverage.every(x=>x.liveProviderConnected===false && x.officialApiKeyVerified===false && x.sandboxAuthorized===false));
});
test('nine jobs have two distinct HTTPS primary-source links',()=>{
 const trusted=new Set(doc.allowedHosts);
 for(const job of doc.jobs){
  assert.ok(doc.coverage.some(x=>x.lane===job.lane&&x.sourceVerificationStatus==='TWO_OFFICIAL_DOCS_FETCHED'));
  assert.equal(job.sourceUrls.length,2);
  assert.equal(new Set(job.sourceUrls).size,2);
  assert.ok(job.sourceUrls.every(url=>{const u=new URL(url);return u.protocol==='https:' && trusted.has(u.hostname) && !u.username && !u.password && !u.port;}));
 }
});
test('public research manifest cannot claim live banking operations',()=>{
 assert.equal(doc.liveAgentExecution,false);
 assert.equal(doc.bankingProductionConnected,false);
 const forbidden=/"(?:accountNumber|clientSecret|apiKey|privateKey|accessToken|balanceUSD)"\s*:/;
 assert.doesNotMatch(JSON.stringify(doc),forbidden);
});