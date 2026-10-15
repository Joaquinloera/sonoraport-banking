"use strict";
const {randomUUID,createHash}=require("node:crypto");
const ACTIONS=Object.freeze({accounts:{method:"GET"},balances:{method:"GET"},deposits:{method:"GET"},payments:{method:"POST"},paymentStatus:{method:"GET"}});
function configureProvider(config){
 if(!config||!/^https:\/\//.test(config.baseUrl||""))throw Error("HTTPS provider baseUrl required");
 const u=new URL(config.baseUrl);
 if(u.username||u.password||u.search||u.hash)throw Error("Invalid provider base URL");
 if(!config.token||typeof config.token!=="string")throw Error("Provider token required");
 if(!config.routes||typeof config.routes!=="object")throw Error("Provider route mapping required");
 for(const [name,path] of Object.entries(config.routes)){if(!ACTIONS[name])throw Error("Unsupported action");if(typeof path!=="string"||!/^\/[a-zA-Z0-9_./{}-]+$/.test(path)||path.includes("..")||path.includes("//"))throw Error("Invalid route path");}
 return Object.freeze({...config,origin:u.origin});
}
function buildRequest(config,action,{params={},body,approvalId,idempotencyKey}={}){
 if(!ACTIONS[action])throw Error("Unsupported action");
 const template=config.routes[action];if(!template)throw Error("Provider action not configured");
 const path=template.replace(/\{([a-zA-Z0-9_]+)\}/g,(_,key)=>{const v=params[key];if(typeof v!=="string"||!/^[a-zA-Z0-9_-]{1,120}$/.test(v))throw Error("Invalid path parameter "+key);return encodeURIComponent(v)});
 if(path.includes("{"))throw Error("Unresolved route parameter");
 const url=new URL(path,config.origin);if(url.origin!==config.origin)throw Error("Cross-origin route rejected");
 const headers={"Authorization":"Bearer "+config.token,"Accept":"application/json"};
 const options={method:ACTIONS[action].method,headers};
 if(options.method==="POST"){
  if(!approvalId||!idempotencyKey)throw Error("Approval and idempotency required");
  if(typeof body!=="object"||!body||Array.isArray(body))throw Error("JSON payment payload required");
  if(typeof body.amountMinor!=="number"||!Number.isSafeInteger(body.amountMinor)||body.amountMinor<=0)throw Error("Valid positive minor-unit amount required");
  if(!/^[A-Z]{3}$/.test(body.currency||""))throw Error("ISO currency required");
  headers["Content-Type"]="application/json";headers["Idempotency-Key"]=idempotencyKey;headers["X-SonoraPort-Approval-ID"]=approvalId;
  options.body=JSON.stringify(body);
 }
 return {url:url.href,options};
}
async function invoke(config,action,input={},fetcher=fetch){
 const {url,options}=buildRequest(config,action,input);
 const response=await fetcher(url,options);
 const contentType=response.headers?.get?.("content-type")||"";
 const data=contentType.includes("json")?await response.json():{message:"Non-JSON provider response"};
 return {action,ok:response.ok,httpStatus:response.status,providerResponse:data,requestId:randomUUID()};
}
function publicAudit(record){return {eventId:randomUUID(),at:new Date().toISOString(),action:record.action,requestHash:createHash("sha256").update(String(record.requestId)).digest("hex"),status:record.httpStatus,ok:record.ok};}
module.exports={ACTIONS,configureProvider,buildRequest,invoke,publicAudit};
