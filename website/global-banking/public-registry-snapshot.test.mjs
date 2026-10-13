import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSnapshot,snapshotText} from './build-public-snapshot.mjs';
import {validatePublicSnapshot,filterSnapshot} from './portal-registry-fallback.mjs';
const saved=JSON.parse(readFileSync(new URL('./public-registry-snapshot.json',import.meta.url),'utf8'));
test('repository public snapshot stays synchronized with original banking registry via read-only API',async()=>{
 const expected=await createSnapshot();
 assert.equal(snapshotText(saved),snapshotText(expected),'Run node website/global-banking/build-public-snapshot.mjs --generate and commit the updated snapshot');
 assert.equal(saved.sourceEntries,178);
 assert.equal(saved.publicResearchEntries,160);
 assert.equal(saved.historicalEntriesExcluded,18);
});
test('all 160 public research entries remain available offline, unique and not live',()=>{
 const x=validatePublicSnapshot(saved);
 assert.equal(x.records.length,160);
 assert.equal(new Set(x.records.map(r=>r.id)).size,160);
 assert.ok(x.records.every(r=>r.integrationStatus==='NOT_VERIFIED_CONNECTED'&&!r.productionReady&&!r.livePaymentCapable));
 assert.equal(filterSnapshot(x).total,160);
});
test('offline research filtering and pagination do not invent results',()=>{
 const r=saved.records[0];
 const match=filterSnapshot(saved,{query:r.name,offset:0,limit:100});
 assert.ok(match.records.some(x=>x.id===r.id));
 assert.deepEqual(filterSnapshot(saved,{query:'A-NONEXISTENT-PROVIDER-STRING-325485'}).records,[]);
 const page=filterSnapshot(saved,{limit:18,offset:18});
 assert.equal(page.records.length,18);
 assert.equal(page.records[0].id,saved.records[18].id);
});
test('offline snapshot rejects forbidden financial fields and false agent execution claims',()=>{
 const b=structuredClone(saved);
 b.records[0].accountNumber='forbidden';
 assert.throws(()=>validatePublicSnapshot(b),/UNSAFE/);
 const c=structuredClone(saved);c.records[0].productionReady=true;
 assert.throws(()=>validatePublicSnapshot(c),/UNSAFE/);
 const d=structuredClone(saved);d.hostedAIAgentsVerified=144;
 assert.throws(()=>validatePublicSnapshot(d),/UNSAFE/);
 const e=structuredClone(saved);e.records[0].kind='historical_claims_unverified';
 assert.throws(()=>validatePublicSnapshot(e),/UNSAFE/);
});
test('portal does not require a live serverless API to show the full public registry',()=>{
 const js=readFileSync(new URL('./portal.js',import.meta.url),'utf8');
 assert.match(js,/public-registry-snapshot\.json/);
 assert.match(js,/filterSnapshot\(state\.registrySnapshot/);
 assert.match(js,/!isDoc&&!state\.apiAvailable/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
});