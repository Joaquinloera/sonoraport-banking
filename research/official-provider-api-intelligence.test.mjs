import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync(new URL('./official-provider-api-intelligence-2026-10-12.json',import.meta.url),'utf8'));
test('provider API intelligence includes source provenance and documented auth methods only',()=>{
 assert.ok(x.providers.length>=6);
 for(const p of x.providers){assert.ok(p.name&&p.region);assert.ok(p.apiKeyIssuance);assert.ok(p.accessClass);assert.ok(p.sourceUrls.length>=1);assert.ok(p.sourceUrls.every(u=>u.startsWith('https://')));}
});
test('API research never implies production key or live settlement',()=>{
 assert.equal(x.credentialsStored,false);assert.equal(x.verifiedProductionConnections,0);
 for(const p of x.providers){assert.equal(p.productionAccessVerified,false);assert.equal(p.sonoraPortCredentialVerified,false);assert.equal(p.specificIntegrationEndpointsVerified,false);}
 assert.doesNotMatch(JSON.stringify(x),/"(?:actualApiKey|secretValue|accessToken|privateKey|bankAccountNumber)"\s*:/i);
});
test('Visa and Swift have distinct access models',()=>{
 const visa=x.providers.find(p=>p.name==='Visa Developer');const swift=x.providers.find(p=>p.name==='Swift API Channel');
 assert.ok(visa.documentedAuthenticationMethods.includes('Two-Way SSL/mTLS'));
 assert.equal(visa.sandboxDocumentationAvailable,true);
 assert.equal(swift.documentedAuthenticationMethods.length,0);
});