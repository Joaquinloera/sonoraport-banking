"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {providers,plan}=require("./provider-contracts.cjs");
test("three provider contracts present",()=>assert.deepEqual(Object.keys(providers).sort(),["paypal","pix","stripe"]));
test("all production connections are explicitly false",()=>assert.ok(Object.values(providers).every(p=>p.productionConnected===false)));
test("Stripe plan cannot execute",()=>assert.deepEqual([plan("stripe","payment-intents").execute,plan("stripe","payment-intents").mode],[false,"DOCUMENTATION_ONLY"]));
test("reject unknown provider",()=>assert.throws(()=>plan("fake","payment-intents"),/UNKNOWN_PROVIDER/));
test("reject unsupported operation",()=>assert.throws(()=>plan("pix","payment-intents"),/UNSUPPORTED_OPERATION/));
