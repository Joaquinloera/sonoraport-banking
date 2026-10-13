import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('./build06-official-payment-systems-skim.json',import.meta.url),'utf8'));
test('six distinct regional official-source groups maintain scope and provenance',()=>{
 assert.equal(d.sourceGroups.length,6);
 assert.equal(new Set(d.sourceGroups.map(x=>x.lane)).size,6);
 assert.ok(d.sourceGroups.every(x=>x.sources.length===2));
 assert.equal(d.sourceGroups.filter(x=>x.verificationStatus==='TWO_OFFICIAL_DOCUMENTS_FETCHED').length,5);
 assert.equal(d.sourceGroups.filter(x=>x.verificationStatus==='PARTIAL_OFFICIAL_DOCUMENT_FETCH').length,1);
});
test('no bank or hosted-agent execution claims or credential values enter source evidence',()=>{
 assert.equal(d.researchOnly,true);
 assert.equal(d.hostedAgentsVerifiedByThisRun,0);
 assert.equal(d.providerCredentialsIssuedOrPossessed,false);
 assert.equal(d.liveBankingConnectionsVerified,0);
 assert.equal(d.bankingTransactionsInitiated,0);
 assert.ok(d.sourceGroups.every(x=>x.apiAccessStatus==='NOT_VERIFIED'));
});
test('official URLs and partial Iranian sources retain exact status, not fabricated verification',()=>{
 const all=d.sourceGroups.flatMap(x=>x.sources);
 assert.equal(new Set(all.map(x=>x.url)).size,12);
 assert.ok(all.every(x=>x.url.startsWith('https://')&&['FETCHED','TIMEOUT_NOT_VERIFIED'].includes(x.status)));
 const iran=d.sourceGroups.find(x=>x.lane==='IRAN_CBI');
 assert.equal(iran.sources.filter(x=>x.status==='FETCHED').length,1);
 assert.equal(iran.sources.filter(x=>x.status==='TIMEOUT_NOT_VERIFIED').length,1);
});