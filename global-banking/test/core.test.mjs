import test from 'node:test';import assert from 'node:assert/strict';import {planRoute,postBalancedEntry,authorizePayment,validateProvider} from '../src/core.mjs';
test('routes are simulation only',()=>{const r=planRoute({origin:'US',destination:'MX',currency:'MXN',providers:[{id:'sample',origin:'US',destination:'MX',currencies:['MXN'],network:'SPEI',status:'simulation'}]});assert.equal(r.mode,'simulation');assert.equal(r.routes[0].eligibleForExecution,false)});
test('balanced minor-unit ledger entries',()=>assert.equal(postBalancedEntry([{currency:'USD',amountMinor:'100'},{currency:'USD',amountMinor:'-100'}]).balanced,true));
test('reject unbalanced entries',()=>assert.throws(()=>postBalancedEntry([{currency:'USD',amountMinor:'100'},{currency:'USD',amountMinor:'-99'}])));
test('block unapproved live payments',()=>assert.throws(()=>authorizePayment()));
test('validate provider status',()=>assert.throws(()=>validateProvider({id:'x',country:'US',network:'SWIFT',status:'verified-live'})));
