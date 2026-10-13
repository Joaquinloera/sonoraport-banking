import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './global-banking-research.mjs';
const call=path=>handler(new Request('https://sonoraport-banking.netlify.app/api/global-banking'+path));
test('bundled JSON-backed Netlify handler reports actual public research counts without claiming live integrations',async()=>{
 const r=await call('/summary');assert.equal(r.status,200);const d=await r.json();
 assert.equal(d.sourceEntries,178);assert.equal(d.publicResearchEntries,160);assert.equal(d.historicalEntriesExcluded,18);
 assert.equal(d.researchedDeveloperPortals,19);assert.equal(d.regionalLanes,19);assert.equal(d.regionsWithTwoOfficialSources,18);
 assert.equal(d.hostedAIAgentsVerified,0);assert.equal(d.transfersEnabled,false);
});
test('Netlify handler exposes sanitized public provider results, not archival bank claims',async()=>{
 const r=await call('/providers?limit=100');assert.equal(r.status,200);const d=await r.json();
 assert.equal(d.total,160);assert.ok(d.records.every(x=>x.productionReady===false&&x.livePaymentCapable===false));
 assert.ok(d.records.every(x=>!Object.hasOwn(x,'accountNumber')&&!Object.hasOwn(x,'apiKey')));
});
test('Netlify handler denies payment initiation and unsupported write methods',async()=>{
 assert.equal((await call('/transfers/create')).status,404);
 const r=await handler(new Request('https://example.net/api/global-banking/providers',{method:'POST'}));assert.equal(r.status,405);
});