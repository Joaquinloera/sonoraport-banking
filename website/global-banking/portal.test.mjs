import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const seed=JSON.parse(readFileSync(new URL('./research-seed.json',import.meta.url),'utf8'));
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('./portal.js',import.meta.url),'utf8');
test('fallback retains all nineteen verified documentation records and regional lanes',()=>{
 assert.equal(seed.providers.length,19);assert.equal(seed.regions.length,19);
 assert.equal(new Set(seed.providers.map(x=>x.name)).size,19);
 assert.equal(seed.regions.filter(x=>x.sourcesFetched===2).length,18);
});
test('public seed never includes bank accounts, tokens, balances, or live-connection assertions',()=>{
 const raw=JSON.stringify(seed);
 for(const forbidden of ['balanceUSD','accountNumber','routingNumber','clientSecret','privateKey','sk_live_','accessToken'])assert.ok(!raw.includes(forbidden),forbidden);
 assert.ok(seed.providers.every(x=>x.integrationStatus==='DOCS_ONLY_NOT_CONNECTED'));
 assert.ok(seed.providers.every(x=>x.sourceUrl.startsWith('https://')));
});
test('portal is research-only and offers accessible filter controls',()=>{
 assert.match(html,/Research-only platform/);assert.match(html,/type="search"/);assert.match(html,/aria-live="polite"/);
 assert.match(html,/src="\.\/portal.js"/);assert.match(html,/href="\.\/portal.css"/);
 assert.doesNotMatch(html,/<form[^>]*action=/i);
});
test('browser module uses DOM textContent and authenticated API claims are never inferred',()=>{
 assert.match(js,/\.textContent/);assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(js,/summary\.transfersEnabled!==false/);assert.match(js,/No invented banking entries|no invented banking entries/);
});