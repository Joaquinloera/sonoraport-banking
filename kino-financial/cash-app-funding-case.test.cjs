'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createFundingCase,evaluateFundingCase,safePublicCase}=require('./cash-app-funding-case.cjs');
test('creates 86000 USD funding case without moving money',()=>{const c=createFundingCase();assert.equal(c.amountMinor,8600000);assert.equal(c.destination,'$sonoraport13');assert.equal(c.transferSubmitted,false);assert.equal(c.providerTransactionId,null)});
test('rejects changing destination',()=>assert.throws(()=>createFundingCase({destination:'$different'}),/must match/));
test('requires source before provider access',()=>assert.equal(evaluateFundingCase(createFundingCase(),{providerAccessVerified:true}).state,'AWAITING_FUNDING_SOURCE'));
test('requires provider access before review',()=>assert.equal(evaluateFundingCase(createFundingCase(),{fundingSourceVerified:true}).state,'AWAITING_PROVIDER_ACCESS'));
test('verified prerequisites lead to review not transfer',()=>{const c=evaluateFundingCase(createFundingCase(),{fundingSourceVerified:true,providerAccessVerified:true});assert.equal(c.state,'READY_FOR_MANUAL_REVIEW');assert.equal(c.transferSubmitted,false)});
test('public summary contains no credentials',()=>{const c=safePublicCase(createFundingCase());assert.equal(c.fundingSourceVerified,undefined);assert.equal(c.providerTransactionId,undefined)});
