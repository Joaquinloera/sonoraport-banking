/** KINO SWARM+SKIM read-only evidence API, not an authorization or funds gateway. */
const ID=/^[a-z0-9._:-]{1,140}$/i;
const BAD_FIELDS=['apiKey','clientSecret','accessToken','privateKey','accountNumber','balanceUSD','routingNumber'];
const SECRET_PATTERN=/(?:sk_(?:live|test)_[a-z0-9]{12,}|bearer\s+[a-z0-9._-]{20,}|\b\d{13,19}\b)/i;
function safeURL(url){let u;try{u=new URL(url)}catch{throw Error('UNVERIFIED_OFFICIAL_URL')};
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/i.test(u.hostname)||[...u.searchParams.keys()].some(x=>/token|secret|key|session|auth/i.test(x)))throw Error('UNVERIFIED_OFFICIAL_URL');return u.href;}
function scrubText(value,max=420){const str=String(value??'');if(SECRET_PATTERN.test(str))throw Error('SENSITIVE_DOCUMENT_RESEARCH_VALUE');return str.slice(0,max).trim();}
export function validateOfficialSourceEvidence(evidence,registry){
 if(evidence?.productionBankingConnectionsVerified!==0||evidence?.bankCredentialsPossessed!==false||evidence?.bankPaymentsInitiated!==0||evidence?.hostedLLMAgentsExecuted!==false||!Array.isArray(evidence?.entries)||!Array.isArray(registry?.records))throw Error('UNSAFE_RESEARCH_STATUS');
 if(evidence.entries.length<1||evidence.entries.length>150||evidence.officialDocumentPagesFetched!==evidence.entries.length)throw Error('RESEARCH_ENTRY_COUNT_MISMATCH');
 const index=new Map(registry.records.filter(x=>x.kind!=='historical_claims_unverified').map(x=>[x.id,x]));
 const seen=new Set();
 return evidence.entries.map(x=>{
  if(!x||seen.has(x.sourceUrl)||typeof x.provider!=='string'||!x.provider||!Array.isArray(x.documentedAuthentication)||!Array.isArray(x.documentedCapability)||!Number.isInteger(x.documentCharactersObserved)||x.documentCharactersObserved<160)throw Error('INVALID_OFFICIAL_EVIDENCE_ENTRY');
  seen.add(x.sourceUrl);const url=safeURL(x.sourceUrl);
  if(!x.sourceRegistryId&&x.catalogReconciliationRequired!==true)throw Error('MISSING_CATALOG_RECONCILIATION_FLAG');
  if(x.sourceRegistryId){if(!ID.test(x.sourceRegistryId)||!index.has(x.sourceRegistryId)||x.catalogReconciliationRequired!==false)throw Error('INVALID_CATALOG_CROSS_REFERENCE');}
  for(const f of BAD_FIELDS)if(Object.hasOwn(x,f))throw Error('PRIVATE_CREDENTIAL_FIELD_REJECTED');
  return Object.freeze({provider:scrubText(x.provider,150),lane:scrubText(x.lane,65),sourceUrl:url,
   sourceTitle:scrubText(x.sourceTitle,170),sourceRegistryId:x.sourceRegistryId??null,
   catalogReconciliationRequired:Boolean(x.catalogReconciliationRequired),documentCharactersObserved:x.documentCharactersObserved,
   documentedAuthentication:x.documentedAuthentication.slice(0,8).map(s=>scrubText(s,360)),
   documentedCapability:x.documentedCapability.slice(0,8).map(s=>scrubText(s,360)),
   providerOnboarding:scrubText(x.providerOnboarding,360),sandboxAccess:scrubText(x.sandboxAccess,70),
   sourceStatus:'OFFICIAL_DOCUMENT_FETCHED_PUBLIC_RESEARCH_ONLY',bankConnected:false,credentialsPossessed:false,canExecuteTransfers:false});
 });
}
function respond(data,status=200,head=false){return new Response(head?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
export function createOfficialSourceEvidenceHandler({evidence,registry}){
 const sources=validateOfficialSourceEvidence(evidence,registry);
 return async function handler(request){
  const method=request.method??'GET';if(!['GET','HEAD'].includes(method))return respond({error:'PUBLIC_RESEARCH_READ_ONLY'},405,method==='HEAD');
  let url;try{url=new URL(request.url)}catch{return respond({error:'INVALID_URL'},400,method==='HEAD')}
  const route=url.pathname;
  if(route!=='/api/banking-official-docs'&&route!=='/api/banking-official-docs/providers')return respond({error:'ROUTE_NOT_FOUND'},404,method==='HEAD');
  if([...url.searchParams.keys()].some(k=>k!=='lane'&&k!=='query'))return respond({error:'UNSUPPORTED_FILTER'},400,method==='HEAD');
  const lane=url.searchParams.get('lane')??'',query=url.searchParams.get('query')??'';
  if(lane.length>65||query.length>100)return respond({error:'INVALID_FILTER'},400,method==='HEAD');
  if(route==='/api/banking-official-docs')return respond({program:evidence.program,asOf:evidence.researchDate,officialPagesFetched:sources.length,originalRegistryEntries:registry.records.length,
   logicalAgentRoles:evidence.agentRolesDefined,bankConnectionsVerified:0,hostedAgentsVerified:0,paymentsInitiated:0},200,method==='HEAD');
  const matching=sources.filter(x=>(!lane||x.lane.toLowerCase()===lane.toLowerCase())&&(!query||x.provider.toLowerCase().includes(query.toLowerCase())));
  return respond({total:matching.length,providers:matching},200,method==='HEAD');
 };
}
