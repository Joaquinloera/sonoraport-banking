"use strict";
const https = require("node:https");
const {getResearchIndex} = require("./public-research-index.cjs");
const MAX_BYTES = 128 * 1024;
const TIMEOUT_MS = 9000;
function inspectSource(record) {
  return new Promise(resolve => {
    let url;
    try { url = new URL(record.source); } catch { return resolve({name:record.name,status:"invalid_url"}); }
    if (url.protocol !== "https:") return resolve({name:record.name,status:"invalid_protocol"});
    const request = https.get(url, {timeout:TIMEOUT_MS,headers:{"user-agent":"SonoraPort-PublicDocs-Research/1.0"}}, response => {
      let bytes=0;
      response.on("data",chunk=>{bytes+=chunk.length;if(bytes>MAX_BYTES)response.destroy();});
      response.on("end",()=>resolve({name:record.name,source:record.source,status:"checked",httpStatus:response.statusCode,bytes}));
      response.on("error",()=>resolve({name:record.name,status:"response_error"}));
    });
    request.on("timeout",()=>request.destroy());
    request.on("error",()=>resolve({name:record.name,status:"request_error"}));
  });
}
async function runPublicResearch() {
  const records=getResearchIndex();
  const batches=[];
  for(let i=0;i<records.length;i+=4)batches.push(await Promise.all(records.slice(i,i+4).map(inspectSource)));
  return {kind:"public_documentation_probe",executors:"node_https_workers",results:batches.flat()};
}
if(require.main===module)runPublicResearch().then(result=>process.stdout.write(JSON.stringify(result,null,2)+"\n")).catch(error=>{console.error(error.message);process.exitCode=1});
module.exports={runPublicResearch,inspectSource};
