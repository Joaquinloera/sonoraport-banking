import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('./global-provider-api-auth-skim-2026-10-12.json',import.meta.url),'utf8'));
test('global SKIM includes independent banking, payments and infrastructure categories',()=>{
 assert.ok(source.providers.length>=18);
 for(const category of ['commercial_bank_api','merchant_payments','global_payment_network','financial_market_infrastructure'])assert.ok(source.providers.some(x=>x.category===category));
});
test('every provider source is HTTPS and source state is explicit',()=>{
 for(const x of source.providers){assert.ok(x.name);assert.match(x.sourceUrl,/^https:\/\//);assert.ok(x.sourceStatus);assert.ok(x.region);assert.equal(x.integrationStatus,'DOCS_ONLY_NOT_CONNECTED');assert.ok(x.credentialIssuance);assert.ok(x.providerAuthorization);}
});
test('no secrets, accounts, live connections or unverified production capabilities',()=>{
 assert.equal(source.productionProviderConnectionsVerified,0);assert.equal(source.privateKeysOrTokensStored,false);assert.equal(source.paymentsInitiated,0);
 for(const x of source.providers)for(const key of ['apiKey','apiSecret','accountNumber','cardNumber','accessToken','privateKey','bankBalance'])assert.ok(!Object.hasOwn(x,key));
});
test('fetch failures cannot be labeled as confirmed credential issuance',()=>{
 for(const x of source.providers.filter(p=>/FETCH_EMPTY|INSUFFICIENT/.test(p.sourceStatus))){assert.deepEqual(x.authenticationEvidence,[]);assert.equal(x.integrationStatus,'DOCS_ONLY_NOT_CONNECTED');}
});
test('Citi, ICBC, Wise, Visa, PayPal, Stripe, Adyen provenance stays provider-specific',()=>{
 const names=['Citi Developer APIs','ICBC European Open Banking','Wise Platform','Visa Developer','PayPal REST APIs','Stripe','Adyen'];
 for(const name of names){const x=source.providers.find(p=>p.name===name);assert.ok(x);assert.ok(x.authenticationEvidence.length>0);}
});