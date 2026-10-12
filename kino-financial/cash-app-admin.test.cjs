'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {CashAppAdmin}=require('./cash-app-admin.cjs');
const admin={id:'operator-1',role:'admin'};
test('admin case creation is idempotent and audited',()=>{const logs=[],app=new CashAppAdmin({audit:x=>logs.push(x)});const a=app.createCase(admin,'request-key-0001');const b=app.createCase(admin,'request-key-0001');assert.equal(a.id,b.id);assert.equal(logs.length,1);assert.equal(a.amountMinor,8600000);assert.equal(a.transferSubmitted,false)});
test('access control prevents unauthenticated case creation',()=>assert.throws(()=>new CashAppAdmin().createCase({role:'viewer'},'request-key-0001'),/ADMIN_REQUIRED/));
test('real transfers always disabled',()=>assert.throws(()=>new CashAppAdmin().requestTransfer(),/LIVE_MONEY_MOVEMENT_DISABLED/));
test('unverified webhooks rejected',()=>assert.throws(()=>new CashAppAdmin().processWebhook(),/WEBHOOK_VERIFICATION_NOT_CONFIGURED/));
test('provider status does not claim authorization',()=>assert.equal(new CashAppAdmin().getProviderStatus(admin).partnerApproved,false));
