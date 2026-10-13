import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('./build05-official-api-onboarding-evidence-2026-10-12.json',import.meta.url)));
test('six incremental banking SWARM/SKIM records keep source provenance',()=>{
 assert.equal(data.records.length,6);assert.equal(new Set(data.records.map(r=>r.provider)).size,6);
 for(const r of data.records){assert.ok(r.sourceUrl.startsWith('https://'));assert.ok(r.sourceStatus);assert.ok(r.lane)}
});
test('documentation research does not claim credential access or transfer authority',()=>{
 assert.equal(data.providerConnectionsVerified,0);assert.equal(data.apiCredentialsPossessed,false);assert.equal(data.paymentsInitiated,0);
 assert.ok(data.records.every(r=>r.sandboxAuthorization==='NOT_VERIFIED'));
});
test('failed fetches contain no asserted technical facts',()=>{
 for(const r of data.records.filter(r=>r.sourceStatus==='SEARCH_LEAD_FETCH_EMPTY'))assert.deepEqual(r.verifiedTechnicalFacts,[]);
});