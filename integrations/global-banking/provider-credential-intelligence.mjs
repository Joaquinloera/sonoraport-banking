/**
 * Joins KINO public API/auth SKIM research to the existing 178-record catalog.
 * Lossless: no source record is rewritten, merged, deleted, or marked connected.
 * Joins only vetted exact normalized names or explicit provider aliases.
 */
import {readFileSync} from 'node:fs';
import {GlobalBankingCatalog} from './provider-catalog.mjs';

const ALIAS_NAMES = Object.freeze({
  'JPMorgan Chase Orbital Gateway': ['JPMorgan Chase','JPMorganChase'],
  'Citi Developer APIs': ['Citi'],
  'HSBC Developer Portal': ['HSBC'],
  'Deutsche Bank API Program': ['Deutsche Bank'],
  'Wells Fargo Gateway': ['Wells Fargo'],
  'Goldman Sachs Transaction Banking': ['Goldman Sachs TxB','Goldman Sachs'],
  'Stripe': ['Stripe'],
  'PayPal REST APIs': ['PayPal'],
  'Adyen': ['Adyen'],
  'Wise Platform': ['Wise Platform'],
  'ICBC European Open Banking': ['ICBC Europe'],
  'Bank of China Australia public API notice': ['Bank of China Australia CDR'],
  'Bank of America CashPro': ['Bank of America'],
  'Visa Developer': ['Visa Developer'],
  'Swift API Channel': ['SWIFT Developer'],
  'CIPS Direct Participant': ['China CIPS'],
  'Payments Canada Real-Time Rail': ['Payments Canada'],
  'Mexico SPEI': ['Banxico SPEI'],
  'Brazil Pix': ['Banco Central do Brasil Pix'],
});

const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const ARCHIVE='historical_claims_unverified';
export class ProviderCredentialIntelligence {
  constructor({catalog,skim}){
    if(!(catalog instanceof GlobalBankingCatalog)||!skim||!Array.isArray(skim.providers))throw Error('INVALID_RESEARCH_INPUTS');
    if(skim.productionProviderConnectionsVerified!==0||skim.privateKeysOrTokensStored!==false)throw Error('UNSAFE_RESEARCH_CLAIMS');
    this.catalog=catalog;
    this.skim=structuredClone(skim);
    this.index=new Map();
    for(const source of catalog.records.filter(x=>x.kind!==ARCHIVE)){
      const key=norm(source.name),items=this.index.get(key)||[];
      items.push(source.id);this.index.set(key,items);
    }
  }
  overview(){
    const bindings=this.skim.providers.map(provider=>{
      if(provider.integrationStatus!=='DOCS_ONLY_NOT_CONNECTED'||!/^https:\/\//.test(provider.sourceUrl))throw Error('UNSAFE_PROVIDER_INTELLIGENCE');
      const aliases=ALIAS_NAMES[provider.name]??[provider.name];
      const matched=[...new Set(aliases.flatMap(name=>this.index.get(norm(name))??[]))];
      return Object.freeze({
        provider:provider.name,
        officialSource:provider.sourceUrl,
        sourceStatus:provider.sourceStatus,
        sourceCatalogIds:matched,
        credentialsIssuedOrPossessed:false,
        liveProviderConnected:false,
        authenticatingAPIsAuthorized:false,
        documentedAuthenticationMethods:[...provider.authenticationEvidence],
        researchNextSteps:matched.length?'VERIFY_PROVIDER_ACCESS_AND_TEST_IN_SANDBOX':'RECONCILE_ALIAS_OR_ADD_PROVIDER_RESEARCH',
      });
    });
    return {
      originalSourceEntries:this.catalog.stats().sourceEntries,
      originalResearchEntries:this.catalog.stats().coreResearchEntries,
      reviewedDeveloperProviders:bindings.length,
      developerProvidersMappedToExistingSource:bindings.filter(x=>x.sourceCatalogIds.length).length,
      developerProvidersUnmatched:bindings.filter(x=>!x.sourceCatalogIds.length).map(x=>x.provider),
      liveProviderConnectionsVerified:0,
      providerMappings:bindings,
    };
  }
}
export function loadProviderCredentialIntelligence({catalogFile=new URL('../../data/global-banking-all-providers-registry.json',import.meta.url),
  skimFile=new URL('../../research/global-provider-api-auth-skim-2026-10-12.json',import.meta.url)}={}){
  const catalog=new GlobalBankingCatalog(JSON.parse(readFileSync(catalogFile,'utf8')));
  const skim=JSON.parse(readFileSync(skimFile,'utf8'));
  return new ProviderCredentialIntelligence({catalog,skim});
}