"use strict";
const fs=require("node:fs"), path=require("node:path"), assert=require("node:assert/strict");
const INPUT=process.argv[2]||path.join(__dirname,"technical-evidence.json");
function validate(records){
 assert(Array.isArray(records),"evidence must be an array");
 const ids=new Set(), urls=new Set();
 for(const [i,r] of records.entries()){
  assert(r&&typeof r==="object","record "+i+" must be object");
  for(const key of ["id","organization","domain","country","sourceUrl","sourceType","technicalFinding","evidenceStatus"]) assert(typeof r[key]==="string"&&r[key].trim(),"record "+i+" missing "+key);
  assert(/^https:\/\//.test(r.sourceUrl),"HTTPS evidence required");
  assert(!ids.has(r.id),"duplicate id: "+r.id); ids.add(r.id);
  assert(!urls.has(r.sourceUrl),"duplicate source: "+r.sourceUrl); urls.add(r.sourceUrl);
  assert(["docs_verified","source_identified","cross_checked","unverified"].includes(r.evidenceStatus),"invalid evidence status");
  assert(!/(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|-----BEGIN PRIVATE KEY-----)/.test(JSON.stringify(r)),"credential pattern detected");
 }
 return {records:records.length,uniqueSources:urls.size,target:1000,remaining:Math.max(0,1000-urls.size),targetReached:urls.size>=1000};
}
if(require.main===module){const records=JSON.parse(fs.readFileSync(INPUT,"utf8"));console.log(JSON.stringify(validate(records),null,2))}
module.exports={validate};
