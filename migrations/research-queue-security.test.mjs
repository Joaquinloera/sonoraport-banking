import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('./20261012_sonoraport_swarm_research_queue.sql',import.meta.url),'utf8');
test('research queue migration creates isolated, research-only task and receipt tables',()=>{
 for(const n of ['sonoraport_swarm_research_jobs','sonoraport_swarm_research_receipts'])assert.ok(sql.includes(`create table if not exists public.${n}`));
 assert.match(sql,/PUBLIC_RESEARCH/);assert.match(sql,/AUTHORIZED_DOCUMENTATION_RESEARCH/);
 assert.doesNotMatch(sql,/\b(?:insert into|update|delete from)\s+public\.(?:bank_accounts|transactions|money_provider_events|transfer_requests)\b/i);
});
test('migration explicitly enables RLS and removes public client access',()=>{
 for(const n of ['sonoraport_swarm_research_jobs','sonoraport_swarm_research_receipts']){
  assert.ok(sql.includes(`alter table public.${n} enable row level security`));
  assert.ok(sql.includes(`revoke all on public.${n} from anon,authenticated`));
 }
 for(const f of ['sonoraport_claim_research_job','sonoraport_finish_research_job']){
  assert.match(sql,new RegExp(`revoke all on function public\\.${f}\\(`));
 }
});
test('lease claim is atomic and has bounded retries and identity tokens',()=>{
 assert.match(sql,/for update skip locked/i);
 assert.match(sql,/attempts < max_attempts/i);
 assert.match(sql,/p_lease_token uuid/i);
 assert.match(sql,/lease_expires_at > now\(\)/i);
});