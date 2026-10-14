'use strict';
const assert=require('node:assert/strict');
const {SPECS,inspectIntegration}=require('./official-integration-specs.cjs');
assert.equal(Object.keys(SPECS).length,7);
assert.ok(SPECS.icbcEurope.requires.includes('softwareStatementAssertionValidated'));
assert.ok(SPECS.cips.requires.includes('participationPathConfirmed'));
assert.ok(SPECS.payshap.requires.includes('participatingBankRelationshipVerified'));
assert.ok(SPECS.bbvaApiMarket.requires.includes('providerEnrollmentVerified'));
assert.equal(SPECS.pix.release,'2.10.0');
assert.match(SPECS.jpmorganChase.authentication,/signed JWT/);
assert.match(SPECS.spei.source,/banxico\.org\.mx/);
for(const id of Object.keys(SPECS)){
 const missing=inspectIntegration(id);
 assert.equal(missing.recognized,true);
 assert.equal(missing.ready,false);
 assert.ok(missing.missing.length>0);
 const complete=inspectIntegration(id,Object.fromEntries(SPECS[id].requires.map(x=>[x,true])));
 assert.equal(complete.ready,false,'Research flags must never authorize live payments');
 assert.deepEqual(complete.missing,[]);
 assert.equal(complete.stage,'requires-independent-production-authorization');
}
assert.equal(inspectIntegration('unknown').recognized,false);
console.log('PASS: 7 official-source integration specifications and fail-closed readiness checks');
