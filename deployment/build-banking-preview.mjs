/**
 * KINO #281102 BUILD06: fail-closed static Netlify draft package.
 * The source repository and main SonoraPort homepage remain unchanged.
 * Only verified PUBLIC banking documentation is packaged; no functions,
 * GitHub research internals, account records, or financial APIs are shipped.
 */
import {mkdirSync,readFileSync,writeFileSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PUBLIC_FILES=Object.freeze([
  'website/global-banking/index.html',
  'website/global-banking/portal.css',
  'website/global-banking/portal.js',
  'website/global-banking/portal-registry-fallback.mjs',
  'website/global-banking/public-registry-snapshot.json',
  'website/global-banking/research-seed.json',
]);
const FORBIDDEN_FIELDS=new Set(['accountNumber','routingNumber','balanceUSD','clientSecret','privateKey','apiKey','accessToken']);
function readJSON(path){try{return JSON.parse(readFileSync(path,'utf8'));}catch{throw Error('PUBLIC_BUILD_INPUT_NOT_VALID_JSON')}}
function recordsSafe(snapshot,seed){
  if(snapshot?.mode!=='REPOSITORY_PUBLIC_RESEARCH_SNAPSHOT'||snapshot.status!=='OFFLINE_DOCUMENTATION_SNAPSHOT_NOT_LIVE_BANKING')throw Error('UNSAFE_PUBLIC_SNAPSHOT');
  if(snapshot.transfersEnabled!==false||snapshot.liveBankingConnectionsVerified!==0||snapshot.hostedAIAgentsVerified!==0)throw Error('UNSAFE_PUBLIC_SNAPSHOT');
  if(!Number.isInteger(snapshot.publicResearchEntries)||snapshot.publicResearchEntries<1||snapshot.publicResearchEntries>10000||
    !Array.isArray(snapshot.records)||snapshot.records.length!==snapshot.publicResearchEntries||
    snapshot.sourceEntries!==snapshot.publicResearchEntries+snapshot.historicalEntriesExcluded)throw Error('INVALID_PUBLIC_SNAPSHOT_COUNT');
  const ids=new Set();
  for(const r of snapshot.records){
    if(!r||typeof r.id!=='string'||typeof r.name!=='string'||ids.has(r.id)||
      r.kind==='historical_claims_unverified'||r.integrationStatus!=='NOT_VERIFIED_CONNECTED'||
      r.livePaymentCapable!==false||r.productionReady!==false)throw Error('UNSAFE_PUBLIC_RESEARCH_RECORD');
    ids.add(r.id);
    for(const key of FORBIDDEN_FIELDS)if(Object.hasOwn(r,key))throw Error('PRIVATE_BANKING_FIELD_REJECTED');
    if(r.publicReferenceUrl){let u;try{u=new URL(r.publicReferenceUrl)}catch{throw Error('UNSAFE_PUBLIC_SOURCE_URL')}
      if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port)throw Error('UNSAFE_PUBLIC_SOURCE_URL');}
  }
  if(!Array.isArray(seed?.providers)||seed.providers.length<1||!Array.isArray(seed.regions)||seed.regions.length!==19||
    seed.providers.some(x=>x.integrationStatus!=='DOCS_ONLY_NOT_CONNECTED'))throw Error('UNSAFE_PUBLIC_RESEARCH_SEED');
  const seedText=JSON.stringify(seed);
  if(/sk_live_[a-z0-9]{8,}|sk_test_[a-z0-9]{8,}|bearer\s+[a-z0-9._-]{20,}/i.test(seedText))throw Error('SENSITIVE_PUBLIC_RESEARCH_SEED');
  return {publicResearchEntries:snapshot.records.length,excludedHistoricalRecords:snapshot.historicalEntriesExcluded,
    developerResearchEntries:seed.providers.length,regions:seed.regions.length};
}
export function buildBankingPreview({sourceRoot,outputDir}){
  if(!sourceRoot||!outputDir)throw Error('SOURCE_AND_OUTPUT_REQUIRED');
  const src=resolve(sourceRoot),out=resolve(outputDir);
  if(src===out||out.startsWith(src+'/'))throw Error('OUTPUT_MUST_BE_OUTSIDE_SOURCE_REPOSITORY');
  if(existsSync(out)&&readdirSync(out).length)throw Error('OUTPUT_DIRECTORY_NOT_EMPTY');
  for(const file of PUBLIC_FILES)if(!existsSync(join(src,file)))throw Error('MISSING_PUBLIC_SOURCE_FILE: '+file);
  const snapshot=readJSON(join(src,'website/global-banking/public-registry-snapshot.json'));
  const seed=readJSON(join(src,'website/global-banking/research-seed.json'));
  const counts=recordsSafe(snapshot,seed);
  const js=readFileSync(join(src,'website/global-banking/portal.js'),'utf8');
  const html=readFileSync(join(src,'website/global-banking/index.html'),'utf8');
  if(!js.includes('public-registry-snapshot.json')||!js.includes('filterSnapshot')||!html.includes('Research-only platform'))throw Error('PUBLIC_PORTAL_NOT_FAIL_CLOSED');
  mkdirSync(out,{recursive:true});
  for(const file of PUBLIC_FILES){const p=join(out,file);mkdirSync(dirname(p),{recursive:true});copyFileSync(join(src,file),p);}
  const index=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SonoraPort · Global Banking Research Preview</title></head><body><main><h1>SonoraPort Global Banking Research</h1><p>BUILD06 preview · public documentation only · ${counts.publicResearchEntries} public research entries · ${counts.excludedHistoricalRecords} unverified historical entries excluded.</p><p>No bank account access, verified partnerships, live AI workers, or transfers are available through this preview.</p><p><a href="/website/global-banking/">Open searchable global banking research →</a></p><p><a href="https://sonoraportaiholdingllc.com/">Return to the existing SonoraPort main website</a></p></main></body></html>\n`;
  writeFileSync(join(out,'index.html'),index);
  writeFileSync(join(out,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'none'; object-src 'none'\n`);
  return Object.freeze({...counts,mode:'STATIC_DRAFT_DEPLOY_ONLY',mainWebsiteChanged:false,liveBankConnections:0,
    hostedAgentsVerified:0,financialTransactionsInitiated:0,outputDir:out,
    publicFiles:PUBLIC_FILES.length+2});
}
const thisFile=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===thisFile){
  const index=process.argv.indexOf('--output');
  if(index<0||!process.argv[index+1]){console.error('Usage: node deployment/build-banking-preview.mjs --output <EMPTY_DIR_OUTSIDE_REPO>');process.exitCode=2;}
  else try{const result=buildBankingPreview({sourceRoot:resolve(dirname(thisFile),'..'),outputDir:process.argv[index+1]});
    console.log(JSON.stringify({status:'STATIC_NETLIFY_PREVIEW_READY',...result}));
  }catch(e){console.error('PUBLIC_PREVIEW_BUILD_BLOCKED:',e.message);process.exitCode=1;}
}
