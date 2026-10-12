"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {normalizeInstitution,buildMatrix}=require("./institution-matrix.cjs");
test("maps an institution to research-only status",()=>{const a=normalizeInstitution({company:"Bank A",official_url:"https://example.org"});assert.equal(a.integration_state,"researched");assert.equal(a.live_transfers_enabled,false)});
test("rejects insecure official URLs",()=>assert.throws(()=>normalizeInstitution({company:"Bank A",official_url:"http://example.org"})));
test("rejects invented integration states",()=>assert.throws(()=>normalizeInstitution({company:"Bank A",integration_state:"funds_available"})));
test("deduplicates case-insensitive institutions",()=>assert.equal(buildMatrix([{company:"Bank A"},{company:"bank a"}]).length,1));
test("requires institution names",()=>assert.throws(()=>normalizeInstitution({category:"banking"})));
test("requires an array",()=>assert.throws(()=>buildMatrix({})));
