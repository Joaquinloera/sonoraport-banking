import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentPlan,ASSETS} from './deploy-live-banking.mjs';
const bytes=Buffer.from('approved public catalog entry');
const good=()=>({files:[{path:'/index.html',sha:'a'.repeat(40)},{path:'/banking/index.html',sha:'b'.repeat(40)}],functions:[{n:'jpmorgan-balances',d:'c'.repeat(64)},{n:'blackrock-status',d:'d'.repeat(64)}],assets:ASSETS.map(path=>({path,bytes}))});
test('adds banking pages while preserving the live homepage, other static routes and banking functions',()=>{
 const p=deploymentPlan(good());
 assert.equal(p.files['/index.html'],'a'.repeat(40));
 assert.equal(p.files['/banking/index.html'],'b'.repeat(40));
 assert.equal(p.functions['jpmorgan-balances'],'c'.repeat(64));
 assert.equal(p.previousFunctionCount,2);
 assert.equal(p.previousFileCount,2);
 assert.equal(Object.keys(p.payloads).length,ASSETS.length);
});
test('fails closed if the prior site files or financial functions cannot be verified',()=>{
 for(const change of [{files:[]},{functions:[{n:'jpmorgan-balances'}]},{files:[{path:'/other',sha:'a'.repeat(40)}]}])
  assert.throws(()=>deploymentPlan({...good(),...change}));
});
test('rejects a root-homepage overwrite, duplicate or partial banking asset list',()=>{
 assert.ok(!ASSETS.includes('index.html'));
 assert.throws(()=>deploymentPlan({...good(),assets:[{path:'index.html',bytes}]}));
 assert.throws(()=>deploymentPlan({...good(),assets:good().assets.slice(0,2)}));
 assert.throws(()=>deploymentPlan({...good(),assets:[...good().assets.slice(1),good().assets[1]]}));
});
