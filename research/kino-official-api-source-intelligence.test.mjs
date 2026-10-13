import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateOfficialSourceEvidence} from '../integrations/global-banking/official-source-evidence.mjs';
const evidence=JSON.parse(readFileSync(new URL('./kino-official-api-source-intelligence-2026-10-13.json',import.meta.url)));
const registry=JSON.parse(readFileSync(new URL('../data/global-banking-all-providers-registry.json',import.meta.url)));
test('source-verified SKIM adds eight public records while preserving all 178 original provider records',()=>{
 assert.equal(registry.records.length,178);
 assert.equal(registry.records.filter(x=>x.kind!=='historical_claims_unverified').length,160);
 const entries=validateOfficialSourceEvidence(evidence,registry);
 assert.equal(entries.length,8);assert.equal(entries.filter(x=>x.sourceRegistryId).length,7);
 assert.deepEqual(entries.filter(x=>x.catalogReconciliationRequired).map(x=>x.provider),['Federal Reserve FedNow DevRel APIs']);
 assert.equal(entries.filter(x=>x.canExecuteTransfers).length,0);
});
