-- SWARM 35: model-worker execution audit tables.
create table if not exists public.sonoraport_swarm_runs (
 id uuid primary key default gen_random_uuid(),
 worker text not null,
 state text not null default 'started' check (state in ('started','completed','failed','configuration_missing')),
 jobs_seen integer not null default 0,
 jobs_saved integer not null default 0,
 error_code text,
 started_at timestamptz not null default now(),
 finished_at timestamptz
);
create table if not exists public.sonoraport_swarm_events (
 id bigint generated always as identity primary key,
 run_id uuid references public.sonoraport_swarm_runs(id) on delete cascade,
 task_id uuid references public.sonoraport_swarm_tasks(id) on delete set null,
 stage text not null,
 outcome text not null,
 detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists sonoraport_swarm_events_run_idx on public.sonoraport_swarm_events(run_id,created_at);
alter table public.sonoraport_swarm_runs enable row level security;
alter table public.sonoraport_swarm_events enable row level security;
revoke all on public.sonoraport_swarm_runs from anon, authenticated;
revoke all on public.sonoraport_swarm_events from anon, authenticated;
grant select, insert, update on public.sonoraport_swarm_runs to service_role;
grant select, insert on public.sonoraport_swarm_events to service_role;
grant usage, select on sequence public.sonoraport_swarm_events_id_seq to service_role;
