import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for(const file of ['evidence.json','payments-evidence.json']){
 const data=JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8'));
 assert.equal(data.productionDeployed,false);
 assert.ok(data.records.length>=5);
 const names=new Set();
 for(const r of data.records){
  assert.ok(r.name&&r.region&&r.evidenceType);
  assert.match(r.url,/^https:\/\//);
  assert.equal(r.connected,false);
  assert.equal(r.credentialsVerified,false);
  assert.equal(r.researchTool,'TinyFish');
  assert.ok(!names.has(r.name.toLowerCase()));names.add(r.name.toLowerCase());
 }
 console.log(file+': '+data.records.length+' source records validated');
}
