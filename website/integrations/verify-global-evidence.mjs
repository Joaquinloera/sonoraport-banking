import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('./',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const bank=JSON.parse(read('global-banking-evidence.json'));
const tech=JSON.parse(read('global-technology-evidence.json'));
const bankPage=read('global-banking-evidence.html');
const techPage=read('global-technology-evidence.html');
const homepage=read('../home/index.html');
assert.equal(bank.liveConnectionsVerified,0,'bank research is not a live connection');
assert.equal(tech.liveProviderConnectionsVerified,0,'technology research is not a live connection');
assert.ok(bank.records.length>=12,'global banking research records missing');
assert.ok(tech.providers.length>=16,'technology sector research records missing');
for(const [group,items] of [['banking',bank.records],['technology',tech.providers]]){
 assert.equal(new Set(items.map(p=>p.name)).size,items.length,group+' names must be unique');
 for(const p of items){
  assert.ok(p.name&&p.region,group+' missing identity');
  const url=new URL(p.url||p.documentation);
  assert.equal(url.protocol,'https:',group+' official source must be HTTPS');
  assert.ok(!url.username&&!url.password,group+' source cannot contain credentials');
  if(group==='technology')assert.equal(p.connection,'not_connected');
 }
}
assert.match(bankPage,/fetch\('\.\/global-banking-evidence\.json'\)/);
assert.match(techPage,/fetch\('\.\/global-technology-evidence\.json'\)/);
assert.match(bankPage,/textContent=p\.name/);
assert.match(techPage,/textContent=x\.name/);
assert.match(homepage,/global-banking-evidence\.html/);
assert.match(homepage,/global-technology-evidence\.html/);
assert.match(homepage,/tmm-slideshow\.js/,'original homepage slideshow must remain');
console.log(JSON.stringify({status:'PASS',bankRecords:bank.records.length,technologyRecords:tech.providers.length,verifiedProductionConnections:0,checks:'schema, unique names, HTTPS, safe rendering, navigation, original slideshow'}));
