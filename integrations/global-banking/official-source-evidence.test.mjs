import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateOfficialSourceEvidence,createOfficialSourceEvidenceHandler} from './official-source-evidence.mjs';
const intelligence=JSON.parse(readFileSync(new URL('../../research/kino-official-api-source-intelligence-2026-10-13.json',import.meta.url)));
function catalogFixture(){return {records:[...intelligence.entries.filter(x=>x.sourceRegistryId).map(x=>({id:x.sourceRegistryId,kind:'commercial_bank_api_research'})),{id:'archived-one',kind:'historical_claims_unverified'}]};}
const catalog=catalogFixture();
test('eight official public pages validated; seven existing source matches; one flagged for admission',()=>{
 const docs=validateOfficialSourceEvidence(intelligence,catalog);
 assert.equal(docs.length,8);assert.equal(docs.filter(d=>d.sourceRegistryId).length,7);
 assert.equal(docs.filter(d=>d.catalogReconciliationRequired).length,1);
 for(const d of docs){assert.equal(d.bankConnected,false);assert.equal(d.credentialsPossessed,false);assert.equal(d.canExecuteTransfers,false);assert.ok(d.sourceUrl.startsWith('https://'))}
});
test('read-only evidence endpoint summarizes without promoting bank access',async()=>{
 const handle=createOfficialSourceEvidenceHandler({evidence:intelligence,registry:catalog});
 const r=await handle(new Request('https://example.org/api/banking-official-docs'));
 assert.equal(r.status,200);const d=await r.json();assert.equal(d.officialPagesFetched,8);assert.equal(d.logicalAgentRoles,144);
 assert.equal(d.bankConnectionsVerified,0);assert.equal(d.paymentsInitiated,0);
});
test('provider query filters lane and provider name',async()=>{
 const handle=createOfficialSourceEvidenceHandler({evidence:intelligence,registry:catalog});
 const r=await handle(new Request('https://example.org/api/banking-official-docs/providers?lane=EUROPE&query=Wise'));
 const d=await r.json();assert.equal(d.total,1);assert.equal(d.providers[0].provider,'Wise Platform');
 assert.equal(d.providers[0].sourceRegistryId,'corridor_research-wise-platform-013');
});
test('rejects unsupported writes and hidden financial fields',async()=>{
 const handle=createOfficialSourceEvidenceHandler({evidence:intelligence,registry:catalog});
 const forbidden=await handle(new Request('https://example.org/api/banking-official-docs/providers',{method:'POST'}));assert.equal(forbidden.status,405);
 const bad=structuredClone(intelligence);bad.entries[0].accountNumber='fake';
 assert.throws(()=>validateOfficialSourceEvidence(bad,catalog),/PRIVATE_CREDENTIAL_FIELD_REJECTED/);
});
test('rejects fabricated live-banking claims and unapproved source IDs',()=>{
 let bad=structuredClone(intelligence);bad.productionBankingConnectionsVerified=1;
 assert.throws(()=>validateOfficialSourceEvidence(bad,catalog),/UNSAFE_RESEARCH_STATUS/);
 bad=structuredClone(intelligence);bad.entries[0].sourceRegistryId='NOT_REAL';bad.entries[0].catalogReconciliationRequired=false;
 assert.throws(()=>validateOfficialSourceEvidence(bad,catalog),/INVALID_CATALOG_CROSS_REFERENCE/);
});
test('blocks secret-bearing source URLs, tokens, unreviewed query filters and forged historical matches',async()=>{
 let bad=structuredClone(intelligence);bad.entries[0].sourceUrl+='?api_key=secret';
 assert.throws(()=>validateOfficialSourceEvidence(bad,catalog),/UNVERIFIED_OFFICIAL_URL/);
 bad=structuredClone(intelligence);bad.entries[0].providerOnboarding='sk_live_abcdefghijklmnop';
 assert.throws(()=>validateOfficialSourceEvidence(bad,catalog),/SENSITIVE_DOCUMENT_RESEARCH_VALUE/);
 bad=structuredClone(intelligence);bad.entries[0].sourceRegistryId='archived-one';bad.entries[0].catalogReconciliationRequired=false;
 assert.throws(()=>validateOfficialSourceEvidence(bad,catalog),/INVALID_CATALOG_CROSS_REFERENCE/);
 const h=createOfficialSourceEvidenceHandler({evidence:intelligence,registry:catalog});
 const r=await h(new Request('https://example.org/api/banking-official-docs/providers?auth=secret'));
 assert.equal(r.status,400);
});
