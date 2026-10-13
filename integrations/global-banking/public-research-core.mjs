/**
 * KINO #281102 — public, read-only global banking research API core.
 * Strict output allowlist: no historical financial account claims, API secrets,
 * customer data, bank sign-in, settlement, or payment initiation.
 */
const ARCHIVE='historical_claims_unverified';
const ID=/^[a-z0-9._:-]{1,140}$/i;
const SECRETISH=/(?:api[_ -]?key\s*[:=]\s*\S+|bearer\s+\S+|sk_(?:live|test)_[a-z0-9]+|\b\d{13,19}\b)/i;
const FORBIDDEN=new Set(['accountNumber','routingNumber','balanceUSD','clientSecret','privateKey','apiKey','accessToken']);
const LIMITS={query:100,region:80,kind:100};
function text(value,max=180){return String(value??'').slice(0,max).replace(/[\u0000-\u001f\u007f]/g,' ').trim();}
function publicUrl(raw){
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||u.href.length>1700)return null;
 if([...u.searchParams.keys()].some(k=>/token|key|secret|session|auth|password|signature/i.test(k)))return null;
 return u.href;}catch{return null}
}
function safeSnippet(raw){const v=text(raw,260);return SECRETISH.test(v)?'CONTACT_OFFICIAL_PROVIDER_FOR_AUTHORIZATION':v;}
function validate(registry,skim,manifest){
 if(!Array.isArray(registry?.records)||!Array.isArray(skim?.providers)||!Array.isArray(manifest?.coverage))throw Error('PUBLIC_RESEARCH_SOURCES_MISSING');
 for(const r of registry.records){
  if(!r||!r.id||!r.name||!r.kind||!r.integration||!r.source||!r.technicalResearch)throw Error('INVALID_RESEARCH_SOURCE');
  if(r.integration.productionExecution!==false||r.integration.credentialsStoredHere!==false)throw Error('PRODUCTION_RESEARCH_CLAIM_REJECTED');
  for(const k of FORBIDDEN)if(Object.hasOwn(r,k))throw Error('PROHIBITED_RESEARCH_DATA');
 }
 if(skim.productionProviderConnectionsVerified!==0||skim.privateKeysOrTokensStored!==false||manifest.bankingProductionConnected!==false)throw Error('SOURCE_CONNECTION_NOT_VERIFIED');
 return true;
}
function sanitizeProvider(r){return Object.freeze({
 id:text(r.id,140),name:text(r.name,160),kind:text(r.kind,90),region:text(r.region,90)||null,country:text(r.country,90)||null,
 publicReferenceUrl:publicUrl(r.publicReferenceUrl),
 evidenceStatus:text(r.evidenceStatus,90),integrationStatus:'NOT_VERIFIED_CONNECTED',
 source:{repo:text(r.source.repo,100),path:text(r.source.path,220)},
 livePaymentCapable:false,productionReady:false,
});}
function sanitizeDoc(x){return {
 name:text(x.name,160),category:text(x.category,80),region:text(x.region,80),
 sourceUrl:publicUrl(x.sourceUrl),sourceStatus:text(x.sourceStatus,100),
 documentedAuthentication:(Array.isArray(x.authenticationEvidence)?x.authenticationEvidence:[]).slice(0,8).map(safeSnippet),
 sandboxResearch:safeSnippet(x.sandboxOrTest),credentialIssuanceResearch:safeSnippet(x.credentialIssuance),
 integrationStatus:'DOCS_ONLY_NOT_CONNECTED',credentialsPossessed:false,productionConnected:false
};}
function jsonResponse(status,data,method='GET',extra={}){
 return new Response(method==='HEAD'?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',...extra}})
}
export function createPublicResearchHandler({registry,skim,manifest}){
 validate(registry,skim,manifest);
 const records=registry.records.filter(x=>x.kind!==ARCHIVE).map(sanitizeProvider);
 const index=new Map(records.map(x=>[x.id,x]));
 if(index.size!==records.length)throw Error('DUPLICATE_PUBLIC_RESEARCH_ID');
 const docs=skim.providers.map(sanitizeDoc).filter(x=>x.sourceUrl);
 const regions=manifest.coverage.map(x=>({lane:text(x.lane,80),sourceVerificationStatus:text(x.sourceVerificationStatus,90),
  sourcesFetched:x.sourceVerificationStatus==='TWO_OFFICIAL_DOCS_FETCHED'?2:0,
  bankingProviderConnected:false}));
 return async function handle(request){
  try{
   const method=request.method||'GET';if(method!=='GET'&&method!=='HEAD')return jsonResponse(405,{error:'PUBLIC_RESEARCH_READ_ONLY'},method,{Allow:'GET, HEAD'});
   if(typeof request.url!=='string'||request.url.length>2600)return jsonResponse(400,{error:'INVALID_REQUEST'},method);
   const u=new URL(request.url);const route=u.pathname.replace(/^\/api\/global-banking/,'')||'/';
   if(route==='/health'||route==='/summary')return jsonResponse(200,{
     system:'SONORAPORT_PUBLIC_BANKING_RESEARCH',mode:'PUBLIC_RESEARCH_ONLY',
     sourceEntries:registry.records.length,publicResearchEntries:records.length,historicalEntriesExcluded:registry.records.length-records.length,
     researchedDeveloperPortals:docs.length,regionalLanes:regions.length,regionsWithTwoOfficialSources:regions.filter(x=>x.sourcesFetched===2).length,
     logicalAgentsDefined:144,hostedAIAgentsVerified:0,liveBankingConnectionsVerified:0,transfersEnabled:false
   },method);
   if(route==='/regions')return jsonResponse(200,{regions},method);
   if(route==='/developer-docs')return jsonResponse(200,{total:docs.length,providers:docs},method);
   if(route==='/providers'){
    const allowed=new Set(['query','region','kind','offset','limit']);if([...u.searchParams.keys()].some(k=>!allowed.has(k)))return jsonResponse(400,{error:'UNSUPPORTED_QUERY'},method);
    const query={};for(const k of ['query','region','kind']){query[k]=u.searchParams.get(k)||'';if(query[k].length>LIMITS[k])return jsonResponse(400,{error:'INVALID_FILTER'},method)}
    const limit=u.searchParams.has('limit')?Number(u.searchParams.get('limit')):30;
    const offset=u.searchParams.has('offset')?Number(u.searchParams.get('offset')):0;
    if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>100000)return jsonResponse(400,{error:'INVALID_PAGINATION'},method);
    const matches=records.filter(p=>(!query.query||[p.name,p.region,p.country,p.kind].some(s=>String(s??'').toLowerCase().includes(query.query.toLowerCase())))
      &&(!query.region||String(p.region??'').toLowerCase().includes(query.region.toLowerCase()))
      &&(!query.kind||p.kind.toLowerCase()===query.kind.toLowerCase()));
    return jsonResponse(200,{total:matches.length,limit,offset,records:matches.slice(offset,offset+limit)},method);
   }
   const match=route.match(/^\/providers\/([^/]+)$/);
   if(match){let id;try{id=decodeURIComponent(match[1])}catch{return jsonResponse(400,{error:'INVALID_PROVIDER_ID'},method)}
    if(!ID.test(id))return jsonResponse(400,{error:'INVALID_PROVIDER_ID'},method);
    const item=index.get(id);return jsonResponse(item?200:404,item??{error:'PUBLIC_RESEARCH_NOT_FOUND'},method)
   }
   return jsonResponse(404,{error:'PUBLIC_RESEARCH_ROUTE_NOT_FOUND'},method);
  }catch{return jsonResponse(500,{error:'PUBLIC_RESEARCH_GATEWAY_FAILED'},request?.method)}
 };
}