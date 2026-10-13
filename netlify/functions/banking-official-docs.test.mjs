import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{config} from './banking-official-docs.mjs';
test('Netlify public source evidence route is read-only and uses actual banking catalog',async()=>{
 assert.ok(config.path.includes('/api/banking-official-docs'));
 const r=await handler(new Request('https://example.com/api/banking-official-docs'));
 assert.equal(r.status,200);const data=await r.json();
 assert.equal(data.officialPagesFetched,8);assert.equal(data.originalRegistryEntries,178);
 assert.equal(data.hostedAgentsVerified,0);assert.equal(data.bankConnectionsVerified,0);
});
test('Netlify official evidence route rejects payments and hides banking credentials',async()=>{
 const r=await handler(new Request('https://example.com/api/banking-official-docs/providers?lane=BRAZIL'));
 assert.equal(r.status,200);const data=await r.json();assert.equal(data.total,1);
 assert.equal(data.providers[0].credentialsPossessed,false);
 const forbidden=await handler(new Request('https://example.com/api/banking-official-docs/providers',{method:'POST'}));assert.equal(forbidden.status,405);
});
