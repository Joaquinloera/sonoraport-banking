"use strict";
const lanes=[
["US_BANKS","https://api.fdic.gov/banks/docs/"],
["BRICS_BANKS","https://www.ndb.int/"],
["MEXICO_LATAM","https://www.banxico.org.mx/services/interbanking-electronic-payme.html"],
["CARIBBEAN","https://www.eccb-centralbank.org/payment-and-settlement-operations"],
["AI_SOFTWARE","https://openai.github.io/openai-agents-python/handoffs/"],
["BLOCKCHAIN","https://solana.com/docs/rpc"],
["PAYMENT_STANDARDS","https://www.swift.com/products/swift-apis"]
];
async function worker([lane,source],{apiKey=process.env.OPENAI_API_KEY,fetcher=fetch}={}){
 if(!apiKey)return {lane,status:"BLOCKED_NO_MODEL_KEY",source};
 const r=await fetcher("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.SONORAPORT_RESEARCH_MODEL||"gpt-4.1-mini",store:false,instructions:"Research publicly available technical documentation only. Do not invent APIs, credentials, or production connections. Mark unknown facts.",input:"Investigate "+lane+" using official starting source "+source+". Extract public API endpoints, authentication, SDKs, permissions, access requirements, and citations. Report gaps."})});
 if(!r.ok)return {lane,status:"MODEL_REQUEST_FAILED",httpStatus:r.status,source};
 const data=await r.json();const text=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
 return {lane,status:text?"MODEL_COMPLETED":"EMPTY_RESULT",source,findings:text.slice(0,20000)};
}
async function run(options={}){const results=await Promise.all(lanes.map(l=>worker(l,options).catch(e=>({lane:l[0],status:"WORKER_ERROR",error:String(e.message).slice(0,100)}))));return {kind:"model_research_workers",results,completed:results.filter(x=>x.status==="MODEL_COMPLETED").length,productionConnectionsVerified:0};}
if(require.main===module)run().then(r=>{console.log(JSON.stringify(r,null,2));if(!r.completed)process.exitCode=2}).catch(e=>{console.error(e);process.exitCode=1});
module.exports={lanes,worker,run};
