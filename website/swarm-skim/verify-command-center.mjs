import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const files=['global-corridor-swarm-20.json','global-corridor-swarm-20-b.json','global-corridor-swarm-20-c.json','cross-division-api-research-12.json'];
const html=readFileSync(new URL('command-center.html',import.meta.url),'utf8');
let count=0;
for(const file of files){
 const d=JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8'));
 assert.ok(html.includes(file),'Command center must load '+file);
 assert.ok(Array.isArray(d.records)&&d.records.length>0,'Missing records: '+file);
 for(const r of d.records){
  assert.ok(typeof r.name==='string'&&r.name.trim(),'Missing name: '+file);
  assert.ok(typeof r.division==='string'&&r.division.trim(),'Missing division: '+file);
  assert.ok(typeof r.url==='string'&&/^https:\/\//.test(r.url),'Invalid source URL: '+r.name);
  assert.equal(r.connected,false,'Must not claim a production connection: '+r.name);
  assert.ok(typeof r.skim==='string'&&r.skim.trim(),'Missing technical findings: '+r.name);
  count++;
 }
 console.log(file+': '+d.records.length+' records validated');
}
assert.equal(count,72,'Unexpected combined record count');
assert.ok(html.includes('textContent=x.name'),'Provider names must be safely rendered');
assert.ok(html.includes('safeUrl'),'External URLs must be validated');
assert.ok(html.includes('Export filtered CSV'),'CSV export must be present');
console.log('SonoraPort command center: '+count+' records validated; 0 claimed live connections');
