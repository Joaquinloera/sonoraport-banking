import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProviderCredentialIntelligence} from './provider-credential-intelligence.mjs';

test('new API research joins but does not rewrite the original 178 source entries',()=>{
 const r=loadProviderCredentialIntelligence().overview();
 assert.equal(r.originalSourceEntries,178);
 assert.equal(r.originalResearchEntries,160);
 assert.equal(r.reviewedDeveloperProviders,19);
 assert.ok(r.developerProvidersMappedToExistingSource>=8);
 assert.ok(r.providerMappings.every(x=>x.liveProviderConnected===false&&x.authenticatingAPIsAuthorized===false));
 assert.ok(r.providerMappings.every(x=>x.sourceCatalogIds.length===new Set(x.sourceCatalogIds).size));
});