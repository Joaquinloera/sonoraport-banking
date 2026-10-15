import test from 'node:test';import assert from 'node:assert/strict';import {buildRegistry,corridorEvidence,paymentRequest,normalizeProvider} from './gateway.mjs';
const a={name:'FedNow',region:'United States',kind:'instant-payments',official:'https://www.frbservices.org/financial-services/fednow'};
test('research-only registry',()=>assert.equal(buildRegistry([a])[0].status,'research_only'));
test('reject invalid URL and status',()=>{assert.throws(()=>normalizeProvider({...a,official:'http://example.com'}));assert.throws(()=>normalizeProvider({...a,status:'connected'}))});
test('reject duplicate providers',()=>assert.throws(()=>buildRegistry([a,a])));
test('corridor is never a verified payment route',()=>{const x=corridorEvidence(buildRegistry([a]),'United States','Mexico');assert.equal(x.routeVerified,false);assert.equal(x.paymentInitiationEnabled,false);assert.equal(x.providers.length,1)});
test('payment initiation fails closed',()=>assert.throws(()=>paymentRequest(),/PAYMENT_DISABLED/));
