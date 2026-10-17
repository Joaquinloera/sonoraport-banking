import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
const path = new URL("./bank-evidence-seed.json", import.meta.url);
const db = JSON.parse(readFileSync(path,"utf8"));
assert.equal(db.bankCount,db.records.length);
assert.ok(db.records.length>=25);
assert.ok(new Set(db.records.map(x=>x.country)).size>=15);
assert.equal(new Set(db.records.map(x=>x.id)).size,db.records.length);
for(const r of db.records){
  assert.ok(r.name && /^[A-Z]{2}$/.test(r.country));
  assert.ok(new URL(r.sourceUrl).protocol==="https:");
  assert.ok(r.evidenceType && r.sourceStatus);
  assert.equal(r.liveConnection,false);
  assert.equal(r.transfersEnabled,false);
  if(r.evidenceType==="REGULATORY_BANK_REFERENCE_ONLY") assert.equal(r.apiAccess,"BANK_SPECIFIC_API_NOT_VERIFIED");
}
assert.equal(db.liveConnectionsVerified,0);
console.log("PASS: "+db.records.length+" bank research seeds in "+db.countriesRepresented.length+" jurisdictions; no false API/production claims");
