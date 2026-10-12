/**
 * SonoraPort KINO BUILD 04 — read-only HTTP gateway for verified research metadata.
 * This is NOT a banking/payment execution interface. Deliberately exposes no
 * balance, bank credential, partner enrollment or money-transfer operations.
 * Binds to loopback unless a deliberate, separately reviewed deployment changes it.
 */
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {GlobalBankingCatalog} from './provider-catalog.mjs';
import {ProviderCredentialIntelligence} from './provider-credential-intelligence.mjs';
const ROUTE_ID=/^[A-Za-z0-9._:-]{1,140}$/;
const HEADERS=Object.freeze({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});
function reply(res,code,obj,headers={}){
 res.writeHead(code,{...HEADERS,...headers});res.end(JSON.stringify(obj));
}
export function createReadOnlyBankingResearchHandler({catalog,intelligence}){
 if(!(catalog instanceof GlobalBankingCatalog)||!(intelligence instanceof ProviderCredentialIntelligence))throw Error('RESEARCH_CATALOG_AND_INTELLIGENCE_REQUIRED');
 if(intelligence.catalog!==catalog)throw Error('GATEWAY_SOURCE_MISMATCH');
 return (req,res)=>{
  try{
   const method=req.method??'GET';
   if(!['GET','HEAD'].includes(method))return reply(res,405,{error:'RESEARCH_READ_ONLY'},{Allow:'GET, HEAD'});
   if(typeof req.url!=='string'||req.url.length>2048)return reply(res,400,{error:'INVALID_REQUEST'});
   const url=new URL(req.url,'http://127.0.0.1');
   if(url.pathname==='/health')return reply(res,200,{service:'sonoraport-banking-research',status:'research_only',paymentsEnabled:false,bankingCredentialsConnected:false});
   if(url.pathname==='/v1/providers/stats')return reply(res,200,catalog.stats());
   if(url.pathname==='/v1/providers'){
    const params=new URLSearchParams(url.searchParams);
    const allowed=new Set(['query','region','country','kind','offset','limit']);
    if([...params.keys()].some(k=>!allowed.has(k)))return reply(res,400,{error:'UNSUPPORTED_QUERY'});
    const limit=params.has('limit')?Number(params.get('limit')):30;
    const offset=params.has('offset')?Number(params.get('offset')):0;
    if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(offset)||offset<0||offset>100000)
      return reply(res,400,{error:'INVALID_PAGINATION'});
    for(const key of ['query','region','country','kind'])if((params.get(key)??'').length>160)return reply(res,400,{error:'INVALID_FILTER'});
    return reply(res,200,catalog.search({query:params.get('query')??'',region:params.get('region')??'',country:params.get('country')??'',kind:params.get('kind')??'',offset,limit}));
   }
   if(url.pathname==='/v1/developer-research')return reply(res,200,intelligence.overview());
   const checklist=url.pathname.match(/^\/v1\/providers\/([^/]+)\/integration-checklist$/);
   const item=url.pathname.match(/^\/v1\/providers\/([^/]+)$/);
   if(checklist||item){
    const id=decodeURIComponent((checklist??item)[1]);
    if(!ROUTE_ID.test(id))return reply(res,400,{error:'INVALID_PROVIDER_ID'});
    const provider=catalog.getById(id);
    if(!provider)return reply(res,404,{error:'PROVIDER_RESEARCH_NOT_FOUND'});
    return reply(res,200,checklist?catalog.integrationChecklist(id):provider);
   }
   return reply(res,404,{error:'RESEARCH_ROUTE_NOT_FOUND'});
  }catch(_error){return reply(res,500,{error:'RESEARCH_GATEWAY_FAILED'});}
 };
}
export function createReadOnlyBankingResearchServer({catalog,intelligence}){
 return http.createServer(createReadOnlyBankingResearchHandler({catalog,intelligence}));
}
const isMain=process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url;
if(isMain){
 if(process.env.SONORAPORT_RESEARCH_API_ENABLE!=='true'){
  console.error('RESEARCH_API_DISABLED_BY_DEFAULT');process.exitCode=2;
 }else{
  const {readFileSync}=await import('node:fs');
  const reg=JSON.parse(readFileSync(new URL('../../data/global-banking-all-providers-registry.json',import.meta.url),'utf8'));
  const skim=JSON.parse(readFileSync(new URL('../../research/global-provider-api-auth-skim-2026-10-12.json',import.meta.url),'utf8'));
  const catalog=new GlobalBankingCatalog(reg);
  const intelligence=new ProviderCredentialIntelligence({catalog,skim});
  const server=http.createServer(createReadOnlyBankingResearchHandler({catalog,intelligence}));
  server.listen(3401,'127.0.0.1',()=>console.log('KINO_READ_ONLY_RESEARCH_API_BOUND_TO_LOOPBACK'));
 }
}
