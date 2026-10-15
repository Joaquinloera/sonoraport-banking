-- SWARM 41: claim queued jobs atomically; invoke only with service-role authentication.
create or replace function public.sonoraport_claim_swarm_tasks(p_limit integer default 2)
returns setof public.sonoraport_swarm_tasks
language plpgsql security definer set search_path = public
as $$
begin
 if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
 return query
 with claimed as (
  select id from public.sonoraport_swarm_tasks where status='queued'
  order by created_at,id for update skip locked
  limit least(greatest(p_limit,1),10)
 )
 update public.sonoraport_swarm_tasks t
 set status='processing',updated_at=now()
 from claimed where t.id=claimed.id returning t.*;
end $$;
revoke all on function public.sonoraport_claim_swarm_tasks(integer) from public,anon,authenticated;
grant execute on function public.sonoraport_claim_swarm_tasks(integer) to service_role;
