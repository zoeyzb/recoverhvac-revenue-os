begin;

-- Encrypted payloads are produced by the API with AES-GCM. The database never
-- receives a plaintext credential and authenticated clients cannot select this table.
create table if not exists public.integration_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  ciphertext text not null,
  iv text not null,
  key_version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now(),
  unique(tenant_id, provider)
);
alter table public.integration_secrets enable row level security;
revoke all on public.integration_secrets from anon, authenticated;

create table if not exists public.automation_settings (
  tenant_id uuid primary key references public.organizations(id) on delete cascade,
  master_enabled boolean not null default false,
  approval_mode text not null default 'first_touch' check (approval_mode in ('every_action','first_touch','policy_only')),
  daily_call_limit integer not null default 25 check (daily_call_limit between 0 and 10000),
  daily_sms_limit integer not null default 100 check (daily_sms_limit between 0 and 10000),
  daily_email_limit integer not null default 100 check (daily_email_limit between 0 and 10000),
  quiet_hours_start time not null default '20:00',
  quiet_hours_end time not null default '08:00',
  fallback_to_human boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  workflow_key text not null,
  trigger_event_id uuid references public.provider_events(id) on delete set null,
  recovery_order_id uuid references public.recovery_orders(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  state text not null default 'queued' check(state in ('queued','running','waiting','approval','completed','failed','cancelled','dead_letter')),
  current_step integer not null default 0,
  context jsonb not null default '{}'::jsonb,
  available_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,idempotency_key)
);

create table if not exists public.action_executions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  automation_job_id uuid references public.automation_jobs(id) on delete set null,
  action_type text not null, provider text, recipient_hash text, idempotency_key text not null,
  policy_decision jsonb not null default '{}'::jsonb, request_summary jsonb not null default '{}'::jsonb,
  status text not null check(status in ('blocked','approval','queued','accepted','delivered','failed','cancelled')),
  provider_reference text, error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id,idempotency_key)
);

create index if not exists automation_jobs_claim_idx on public.automation_jobs(state,available_at) where state in ('queued','waiting');
create index if not exists action_executions_tenant_created_idx on public.action_executions(tenant_id,created_at desc);

do $$ declare t text; begin foreach t in array array['automation_settings','automation_jobs','action_executions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(tenant_id))',t||'_member_select',t);
  execute format('create policy %I on public.%I for all to authenticated using (public.is_organization_operator(tenant_id)) with check (public.is_organization_operator(tenant_id))',t||'_operator_write',t);
end loop; exception when duplicate_object then null; end $$;

create or replace function public.claim_automation_jobs(p_limit integer default 10, p_lease_seconds integer default 120, p_tenant_id uuid default null)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
begin
 return query with chosen as (
   select id from automation_jobs where (p_tenant_id is null or tenant_id=p_tenant_id) and state in ('queued','waiting') and available_at<=now()
   and (lease_expires_at is null or lease_expires_at<now()) order by available_at for update skip locked limit greatest(1,least(p_limit,25))
 ) update automation_jobs j set state='running',attempt_count=attempt_count+1,
   lease_expires_at=now()+make_interval(secs=>greatest(30,least(p_lease_seconds,600))),updated_at=now()
 from chosen where j.id=chosen.id returning j.*;
end $$;
revoke all on function public.claim_automation_jobs(integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.claim_automation_jobs(integer,integer,uuid) to service_role;

create or replace function public.route_provider_event(p_event_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare e provider_events%rowtype; c_id uuid; conv_id uuid; workflow text; phone_value text; pay_id uuid; order_id uuid; amount_value bigint; currency_value text; object_data jsonb;
begin
  select * into e from provider_events where id=p_event_id for update;
  if not found then raise exception 'event_not_found'; end if;
  if e.processed_at is not null then return jsonb_build_object('duplicate',true); end if;

  if e.provider='twilio' and e.event_type in ('call.no-answer','call.busy','call.failed','call.canceled') then
    phone_value=coalesce(e.payload->>'From',e.payload->>'Caller');
    if phone_value is not null then
      insert into contacts(tenant_id,phone,provider_refs) values(e.tenant_id,phone_value,jsonb_build_object('twilio',phone_value))
      on conflict(tenant_id,phone) where phone is not null do update set updated_at=now() returning id into c_id;
      insert into conversations(tenant_id,contact_id,channel,status,last_message_at) values(e.tenant_id,c_id,'call','open',e.occurred_at) returning id into conv_id;
      insert into messages(tenant_id,conversation_id,direction,status,body,provider,provider_message_id,occurred_at)
      values(e.tenant_id,conv_id,'inbound','received','Missed inbound call','twilio',e.payload->>'CallSid',e.occurred_at)
      on conflict(tenant_id,provider,provider_message_id) where provider_message_id is not null do nothing;
      workflow='missed_call';
    end if;
  elsif e.provider='twilio' and e.event_type='message.inbound' then
    phone_value=e.payload->>'From';
    insert into contacts(tenant_id,phone,provider_refs) values(e.tenant_id,phone_value,jsonb_build_object('twilio',phone_value))
    on conflict(tenant_id,phone) where phone is not null do update set updated_at=now() returning id into c_id;
    select id into conv_id from conversations where tenant_id=e.tenant_id and contact_id=c_id and channel='sms' and status in ('open','waiting') order by updated_at desc limit 1;
    if conv_id is null then insert into conversations(tenant_id,contact_id,channel,status,last_message_at) values(e.tenant_id,c_id,'sms','open',e.occurred_at) returning id into conv_id; end if;
    insert into messages(tenant_id,conversation_id,direction,status,body,provider,provider_message_id,occurred_at)
    values(e.tenant_id,conv_id,'inbound','received',e.payload->>'Body','twilio',e.payload->>'MessageSid',e.occurred_at)
    on conflict(tenant_id,provider,provider_message_id) where provider_message_id is not null do nothing;
    update conversations set status='open',last_message_at=e.occurred_at,updated_at=now() where id=conv_id;
    update automation_jobs set state='completed',last_error='STOPPED_ON_REPLY',lease_expires_at=null,updated_at=now() where tenant_id=e.tenant_id and contact_id=c_id and state in ('queued','waiting','approval');
    if upper(trim(coalesce(e.payload->>'Body',''))) in ('STOP','UNSUBSCRIBE','CANCEL','END','QUIT') then
      insert into suppressions(tenant_id,contact_id,channel,reason,source,active) values(e.tenant_id,c_id,'sms','recipient_opt_out','twilio_inbound',true);
    end if;
  elsif e.event_type in ('estimate.sent','quote.sent') then workflow='estimate_followup';
  elsif e.event_type in ('job.completed','appointment.completed') then workflow='review_request';
  elsif e.provider='stripe' and e.event_type in ('checkout.session.completed','payment_intent.succeeded') then
    object_data=e.payload->'data'->'object';
    if coalesce(object_data->'metadata'->>'recovery_order_id','') ~* '^[0-9a-f-]{36}$' then order_id=(object_data->'metadata'->>'recovery_order_id')::uuid; end if;
    if coalesce(object_data->'metadata'->>'contact_id','') ~* '^[0-9a-f-]{36}$' then c_id=(object_data->'metadata'->>'contact_id')::uuid; end if;
    amount_value=coalesce((object_data->>'amount_total')::bigint,(object_data->>'amount_received')::bigint,(object_data->>'amount')::bigint,0);
    currency_value=upper(coalesce(object_data->>'currency','USD'));
    insert into payments(tenant_id,recovery_order_id,provider,provider_payment_id,status,amount_minor,currency,verified_at)
    values(e.tenant_id,order_id,'stripe',object_data->>'id','succeeded',amount_value,currency_value,e.occurred_at)
    on conflict(tenant_id,provider,provider_payment_id) do update set status='succeeded',verified_at=excluded.verified_at returning id into pay_id;
    insert into revenue_ledger(tenant_id,contact_id,recovery_order_id,payment_id,entry_type,category,amount_minor,currency,provider,external_id,occurred_at,evidence)
    values(e.tenant_id,c_id,order_id,pay_id,'revenue','customer_payment',amount_value,currency_value,'stripe',object_data->>'id',e.occurred_at,jsonb_build_object('provider_event_id',e.id)) on conflict do nothing;
  end if;

  if workflow is not null then
    insert into automation_jobs(tenant_id,workflow_key,trigger_event_id,contact_id,idempotency_key,context)
    values(e.tenant_id,workflow,e.id,c_id,e.provider||':'||e.external_event_id||':'||workflow,
      jsonb_build_object('provider',e.provider,'event_type',e.event_type,'payload',e.payload)) on conflict do nothing;
  end if;
  return jsonb_build_object('workflow',workflow,'contact_id',c_id,'conversation_id',conv_id);
end $$;
revoke all on function public.route_provider_event(uuid) from public,anon,authenticated;
grant execute on function public.route_provider_event(uuid) to service_role;

commit;
