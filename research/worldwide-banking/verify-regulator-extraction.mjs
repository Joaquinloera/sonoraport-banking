import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const db=JSON.parse(readFileSync(new URL("./regulator-extracted-banks.json",import.meta.url),"utf8"));
assert.equal(db.verifiedLiveConnections,0);
assert.equal(db.records.length,143);
assert.equal(db.records.filter(x=>x.country==="GH").length,23);
assert.equal(db.records.filter(x=>x.country==="AU").length,120);
const seen=new Set();
for(const r of db.records){
 assert.ok(r.name.length>2 && ["GH","AU"].includes(r.country));
 assert.ok(r.source.startsWith("https://"));
 assert.equal(r.bankApi,"UNVERIFIED");
 assert.ok(r.classification);
 const k=r.country+":"+r.name.toLowerCase();
 assert.ok(!seen.has(k),"duplicate: "+k);seen.add(k);
}
console.log("PASS: 143 regulator-listed institution records, source-backed and unconnected");
