/**
 * SonoraPort all-source global banking provider catalog.
 * Read-only research layer: NOT a banking API, credential broker or payment rail.
 * Preserve duplicate source records and never promote bank-account claims to verification.
 */
import {readFileSync} from 'node:fs';

const ARCHIVE='historical_claims_unverified';
function safeText(s){return String(s??'').trim();}
function scrub(record){
  return {
    id:record.id,
    name:record.name,
    kind:record.kind,
    region:record.region??null,
    country:record.country??null,
    category:record.category??null,
    publicReferenceUrl:record.publicReferenceUrl??null,
    evidenceStatus:record.evidenceStatus,
    integrationStatus:record.integration.connectionState,
    productionExecution:false,
    source:{repo:record.source.repo,path:record.source.path,section:record.source.section,sourceIndex:record.source.sourceIndex},
    documentedAuthentication:record.technicalResearch.documentedAuthMethods??[],
    documentedCapabilities:record.technicalResearch.documentedApiCapabilities??[],
    sandboxAccess:record.technicalResearch.sandboxAccess??'NOT_VERIFIED',
  };
}
function validate(rows){
  const ids = new Set();
  for(const r of rows){
    if(!r?.id||!r.name||!r.kind||!r.source?.repo||!r.source?.path||!r.integration||!r.technicalResearch) throw Error('Invalid provider catalog entry');
    if(ids.has(r.id))throw Error('Duplicate provider source ID');
    ids.add(r.id);
    if(r.integration.productionExecution!==false||r.integration.credentialsStoredHere!==false)throw Error('Provider catalog is not fail-closed');
    if(r.kind===ARCHIVE && r.evidenceStatus!=='SOURCE_STATED_NOT_INDEPENDENTLY_VERIFIED')throw Error('Historical claims must stay unverified');
    for(const prohibited of ['accountNumber','routingNumber','balanceUSD','clientSecret','apiKey','accessToken','privateKey'])if(Object.hasOwn(r,prohibited))throw Error('Prohibited private financial field');
  }
}
export class GlobalBankingCatalog {
  constructor(registry){
    if(!registry||!Array.isArray(registry.records))throw Error('Invalid global banking registry');
    validate(registry.records);
    this.records=registry.records;
    this.index=new Map(registry.records.map(r=>[r.id,r]));
    this.sourceCount=registry.records.length;
  }
  stats(){
    const kinds={};for(const r of this.records)kinds[r.kind]=(kinds[r.kind]??0)+1;
    return {sourceEntries:this.sourceCount,coreResearchEntries:this.records.filter(r=>r.kind!==ARCHIVE).length,historicalInstitutionNameEntries:kinds[ARCHIVE]??0,kinds,productionProviderConnectionsVerified:0};
  }
  getById(id,{includeArchive=false}={}){
    const r=this.index.get(id);
    if(!r||(!includeArchive&&r.kind===ARCHIVE))return null;
    return scrub(r);
  }
  search({query='',region='',country='',kind='',includeArchive=false,limit=50,offset=0}={}){
    if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0)throw Error('Invalid pagination');
    const q=safeText(query).toLocaleLowerCase('en');
    const rg=safeText(region).toLocaleLowerCase('en');
    const ct=safeText(country).toLocaleLowerCase('en');
    const kd=safeText(kind).toLocaleLowerCase('en');
    let matches=this.records.filter(r=>(includeArchive||r.kind!==ARCHIVE)
      && (!kd||r.kind.toLocaleLowerCase('en')===kd)
      && (!rg||safeText(r.region).toLocaleLowerCase('en').includes(rg))
      && (!ct||safeText(r.country).toLocaleLowerCase('en').includes(ct))
      && (!q||[r.name,r.region,r.country,r.category,r.kind].some(x=>safeText(x).toLocaleLowerCase('en').includes(q))));
    return {total:matches.length,limit,offset,records:matches.slice(offset,offset+limit).map(scrub)};
  }
  integrationChecklist(id){
    const r=this.index.get(id);if(!r)return null;
    const t=r.technicalResearch;
    return {id:r.id,name:r.name,sourcePath:r.source.path,
      productionReady:false,livePaymentCapable:false,
      needsOfficialDeveloperPortalReview:!r.publicReferenceUrl,
      needsVerifiedEndpoint:!(t.documentedEndpoints?.length),
      needsVerifiedAuthentication:!(t.documentedAuthMethods?.length),
      needsVerifiedSdk:!(t.sdkLanguages?.length),
      needsSandboxAuthorization:t.sandboxAccess!=='VERIFIED_AUTHORIZED',
      needsProviderCredentialAuthorization:true,
      needsIntegrationTestReceipt:true,
      needsRegulatoryAndSecurityReview:true,
      historicalClaimsUnverified:r.kind===ARCHIVE};
  }
}
export function loadGlobalBankingCatalog(fileUrl=new URL('../../data/global-banking-all-providers-registry.json',import.meta.url)){
  return new GlobalBankingCatalog(JSON.parse(readFileSync(fileUrl,'utf8')));
}