-- SonoraPort research-only durable queue. Staged migration: NOT yet applied.
-- Supported scope: public or explicitly authorized documentation research.
-- Not for production transfers, credential retrieval, or account access.
-- Requires Supabase service_role for API access; anon and authenticated denied.

create table if not exists public.sonoraport_swarm_research_jobs (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique check (length(task_key) between 1 and 120),
  lane text not null check (length(lane) between 1 and 100),
  provider text not null check (length(provider) between 1 and 160),
  intent text not null default 'PUBLIC_RESEARCH'
    check (intent in ('PUBLIC_RESEARCH','AUTHORIZED_DOCUMENTATION_RESEARCH')),
  source_urls jsonb not null default '[]'::jsonb
    check (jsonb_typeof(source_urls) = 'array' and jsonb_array_length(source_urls) between 1 and 16),
  state text not null default 'QUEUED'
    check (state in ('QUEUED','LEASED','RESEARCH_REPLAY_PASSED','RESEARCH_PIPELINE_PASSED','BLOCKED')),
  lease_owner text,
  lease_token uuid,
  lease_expires_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  result_summary jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sonoraport_swarm_research_jobs_claim_idx
  on public.sonoraport_swarm_research_jobs(state,lease_expires_at,created_at)
  where state in ('QUEUED','LEASED');

create table if not exists public.sonoraport_swarm_research_receipts (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.sonoraport_swarm_research_jobs(id),
  agent_id text not null check(length(agent_id) between 1 and 100),
  stage text not null check(length(stage) between 1 and 64),
  status text not null check(length(status) between 1 and 64),
  evidence_digest text not null check(evidence_digest ~ '^[0-9a-f]{64}$'),
  source_urls jsonb not null default '[]'::jsonb check(jsonb_typeof(source_urls) = 'array'),
  created_at timestamptz not null default now()
);
create index if not exists sonoraport_swarm_research_receipts_job_idx
  on public.sonoraport_swarm_research_receipts(job_id,created_at);

-- No client role may directly access this research queue.
alter table public.sonoraport_swarm_research_jobs enable row level security;
alter table public.sonoraport_swarm_research_receipts enable row level security;
revoke all on public.sonoraport_swarm_research_jobs from anon,authenticated;
revoke all on public.sonoraport_swarm_research_receipts from anon,authenticated;
revoke all on public.sonoraport_swarm_research_receipts_id_seq from anon,authenticated;
grant select,insert,update on public.sonoraport_swarm_research_jobs to service_role;
grant select,insert on public.sonoraport_swarm_research_receipts to service_role;
grant usage,select on sequence public.sonoraport_swarm_research_receipts_id_seq to service_role;

-- Atomic, lease-based worker claim. All callable RPC privileges limited to service_role.
create or replace function public.sonoraport_claim_research_job(p_worker_name text,p_lease_seconds integer default 120)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare selected public.sonoraport_swarm_research_jobs%rowtype;
begin
  if p_worker_name is null or length(p_worker_name) not between 1 and 100
     or p_lease_seconds not between 30 and 900 then
    raise exception 'INVALID_CLAIM_INPUT';
  end if;
  select * into selected from public.sonoraport_swarm_research_jobs
    where ((state = 'QUEUED') or (state = 'LEASED' and lease_expires_at < now()))
      and attempts < max_attempts
    order by created_at asc, id asc
    for update skip locked limit 1;
  if not found then return null; end if;
  update public.sonoraport_swarm_research_jobs
    set state='LEASED',lease_owner=p_worker_name,lease_token=gen_random_uuid(),
        lease_expires_at=now()+make_interval(secs => p_lease_seconds),
        attempts=attempts+1,updated_at=now()
    where id=selected.id returning * into selected;
  return jsonb_build_object('id',selected.id,'task_key',selected.task_key,
    'lane',selected.lane,'provider',selected.provider,'source_urls',selected.source_urls,
    'intent',selected.intent,'lease_token',selected.lease_token,'lease_expires_at',selected.lease_expires_at);
end $$;

create or replace function public.sonoraport_finish_research_job(
  p_job_id uuid,p_lease_token uuid,p_status text,p_summary jsonb default '{}'::jsonb,
  p_error_code text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('RESEARCH_REPLAY_PASSED','RESEARCH_PIPELINE_PASSED','BLOCKED')
    or p_summary is null or jsonb_typeof(p_summary) <> 'object'
    or octet_length(p_summary::text) > 32768
    or (p_error_code is not null and length(p_error_code) > 100) then
      raise exception 'INVALID_RESEARCH_RESULT';
  end if;
  update public.sonoraport_swarm_research_jobs
    set state=p_status,result_summary=p_summary,error_code=p_error_code,
        lease_owner=null,lease_token=null,lease_expires_at=null,updated_at=now()
    where id=p_job_id and lease_token=p_lease_token and state='LEASED'
      and lease_expires_at > now();
  return found;
end $$;

revoke all on function public.sonoraport_claim_research_job(text,integer) from public,anon,authenticated;
revoke all on function public.sonoraport_finish_research_job(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.sonoraport_claim_research_job(text,integer) to service_role;
grant execute on function public.sonoraport_finish_research_job(uuid,uuid,text,jsonb,text) to service_role;