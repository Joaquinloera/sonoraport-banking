import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {ASSETS} from '../../deployment/deploy-live-banking.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const base=resolve(dir,'../..');
const data=JSON.parse(readFileSync(join(dir,'official-source-evidence.json'),'utf8'));
test('published official API source workbench contains eight safe public provider documents',()=>{
 assert.equal(data.mode,'PUBLIC_SOURCE_RESEARCH_NOT_PROVIDER_ACCESS');
 assert.equal(data.productionBankingConnectionsVerified,0);
 assert.equal(data.hostedAIAgentsVerified,0);
 assert.equal(data.entries.length,8);
 const unique=new Set();
 for(const x of data.entries){
  assert.ok(x.provider&&x.lane&&x.sourceTitle);
  const u=new URL(x.sourceUrl);assert.equal(u.protocol,'https:');
  assert.equal(u.username,'');assert.equal(u.password,'');assert.equal(u.search,'');
  assert.ok(!unique.has(x.provider));unique.add(x.provider);
  assert.ok(Array.isArray(x.documentedAuthentication));
  assert.ok(Array.isArray(x.documentedCapability));
  assert.ok(x.sandboxAccess.includes('NOT_')||x.sandboxAccess.includes('NOT_AUTHORIZED'));
 }
 assert.equal(unique.size,8);
});
test('live website routes and all 24 published assets exist and are accessible from navigation',()=>{
 assert.equal(ASSETS.length,24);
 for(const p of ASSETS){assert.ok(p.startsWith('website/'));assert.ok(!p.includes('..'));assert.ok(existsSync(join(base,p)),p);}
 const home=readFileSync(join(base,'website/home/index.html'),'utf8');
 const portal=readFileSync(join(base,'website/global-banking/index.html'),'utf8');
 const evidence=readFileSync(join(dir,'official-source-evidence.html'),'utf8');
 for(const text of [home,portal])assert.ok(text.includes('official-source-evidence.html'));
 assert.ok(evidence.includes('official-source-evidence.js'));
 assert.ok(evidence.includes('source-lane'));
 assert.ok(evidence.includes('source-query'));
});
test('public evidence client does not submit credentials or financial transactions',()=>{
 const code=readFileSync(join(dir,'official-source-evidence.js'),'utf8');
 assert.ok(code.includes('textContent'));
 assert.ok(code.includes('replaceChildren'));
 assert.ok(code.includes("https:"));
 assert.ok(!/fetch\s*\([^\)]*\bmethod:\s*['"]POST/i.test(code));
 assert.ok(!/sk_live_|BEGIN PRIVATE KEY|client_secret\s*[:=]/i.test(JSON.stringify(data)));
});
