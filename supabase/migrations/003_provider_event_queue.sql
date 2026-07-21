alter table public.provider_events
  add column if not exists processing_started_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists dead_lettered_at timestamptz;

create index if not exists provider_events_ready_idx
  on public.provider_events (next_attempt_at, received_at)
  where processed_at is null and dead_lettered_at is null;

create or replace function public.claim_provider_events(
  p_tenant_id uuid,
  p_limit integer default 10,
  p_lease_seconds integer default 120
)
returns setof public.provider_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit < 1 or p_limit > 50 then
    raise exception 'p_limit must be between 1 and 50';
  end if;

  return query
  with candidates as (
    select id
    from public.provider_events
    where tenant_id = p_tenant_id
      and processed_at is null
      and dead_lettered_at is null
      and next_attempt_at <= now()
      and (processing_started_at is null or processing_started_at < now() - make_interval(secs => p_lease_seconds))
    order by received_at
    for update skip locked
    limit p_limit
  )
  update public.provider_events event
  set processing_started_at = now(),
      attempt_count = event.attempt_count + 1,
      processing_error = null
  from candidates
  where event.id = candidates.id
  returning event.*;
end;
$$;

create or replace function public.finish_provider_event(
  p_event_id uuid,
  p_succeeded boolean,
  p_error text default null,
  p_retry_seconds integer default 60,
  p_max_attempts integer default 8
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.provider_events
  set processed_at = case when p_succeeded then now() else processed_at end,
      processing_started_at = null,
      processing_error = case when p_succeeded then null else left(coalesce(p_error, 'Unknown processing error'), 2000) end,
      next_attempt_at = case when p_succeeded then next_attempt_at else now() + make_interval(secs => greatest(1, p_retry_seconds)) end,
      dead_lettered_at = case when not p_succeeded and attempt_count >= p_max_attempts then now() else dead_lettered_at end
  where id = p_event_id;
end;
$$;

revoke all on function public.claim_provider_events(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.finish_provider_event(uuid, boolean, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_provider_events(uuid, integer, integer) to service_role;
grant execute on function public.finish_provider_event(uuid, boolean, text, integer, integer) to service_role;
