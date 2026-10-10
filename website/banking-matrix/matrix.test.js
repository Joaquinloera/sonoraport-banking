"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"matrix-data.js"),"utf8");
const context={window:{}};
vm.runInNewContext(src,context,{timeout:1000});
const m=context.window.SONORAPORT_MATRIX;
assert.ok(Array.isArray(m.records));
assert.ok(m.records.length>=17);
assert.equal(m.productionDeployed,false);
const ids=new Set();
for(const x of m.records){
 assert.ok(x.name&&x.region&&x.status&&x.url);
 assert.ok(x.url.startsWith("https://"));
 assert.ok(!ids.has(x.name),"duplicate "+x.name);
 ids.add(x.name);
 assert.notEqual(x.connected,true,"unverified live bank connection");
 assert.notEqual(x.credentialsVerified,true,"unverified credential claim");
}
for(const name of ["Stripe","PayPal","Venmo via PayPal","Apple Pay","Cash App Pay","Zelle via U.S. Bank","BRICS Pay E-commerce","BRICS Pay DCMS"])assert.ok(ids.has(name),"missing "+name);
console.log("PASS: website matrix "+m.records.length+" entries, required providers, safe connection flags");
