begin;

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  timezone text not null default 'America/Chicago',
  communication_mode text not null default 'test' check (communication_mode in ('off','test','live')),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  website text,
  lifecycle text not null default 'prospect' check (lifecycle in ('prospect','customer','inactive')),
  provider_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_tenant_website_unique
  on public.companies (tenant_id, lower(website)) where website is not null;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  email text,
  phone text,
  timezone text,
  provider_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create unique index if not exists contacts_tenant_email_unique
  on public.contacts (tenant_id, lower(email)) where email is not null;
create unique index if not exists contacts_tenant_phone_unique
  on public.contacts (tenant_id, phone) where phone is not null;

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null check (channel in ('call','sms','email')),
  status text not null check (status in ('granted','denied','revoked','unknown')),
  source text not null,
  evidence jsonb not null default '{}'::jsonb,
  effective_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.suppressions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  channel text check (channel in ('call','sms','email')),
  reason text not null,
  source text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

alter table public.recovery_orders
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists idempotency_key text,
  add column if not exists state_version integer not null default 1,
  add column if not exists source text not null default 'operator',
  add column if not exists last_verified_at timestamptz;

create unique index if not exists recovery_orders_tenant_idempotency_unique
  on public.recovery_orders (tenant_id, idempotency_key) where idempotency_key is not null;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  recovery_order_id uuid references public.recovery_orders(id) on delete set null,
  channel text not null check (channel in ('call','sms','email')),
  status text not null default 'open' check (status in ('open','waiting','resolved','blocked')),
  assigned_user_id uuid references auth.users(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound','internal')),
  status text not null check (status in ('draft','queued','sent','delivered','failed','received')),
  body text,
  provider text,
  provider_message_id text,
  error_code text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists messages_provider_id_unique
  on public.messages (tenant_id, provider, provider_message_id) where provider_message_id is not null;

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  recovery_order_id uuid references public.recovery_orders(id) on delete cascade,
  workflow_key text not null,
  idempotency_key text not null,
  status text not null check (status in ('queued','running','waiting','blocked','failed','completed','cancelled')),
  attempt integer not null default 0,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, workflow_key, idempotency_key)
);

create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  workflow_run_id uuid not null references public.workflow_runs(id) on delete cascade,
  task_key text not null,
  status text not null check (status in ('queued','running','waiting','blocked','failed','completed','skipped')),
  attempt integer not null default 0,
  available_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_run_id, task_key)
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  workflow_run_id uuid references public.workflow_runs(id) on delete cascade,
  recovery_order_id uuid references public.recovery_orders(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired','cancelled')),
  requested_by text not null,
  decided_by uuid references auth.users(id) on delete set null,
  decision_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  recovery_order_id uuid references public.recovery_orders(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  provider text not null,
  provider_appointment_id text not null,
  status text not null check (status in ('held','confirmed','cancelled','completed','no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, provider_appointment_id),
  check (ends_at > starts_at)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  recovery_order_id uuid references public.recovery_orders(id) on delete set null,
  provider text not null,
  provider_payment_id text not null,
  status text not null check (status in ('pending','succeeded','failed','refunded','partially_refunded')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, provider_payment_id)
);

create table if not exists public.provider_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  subject_type text,
  subject_id uuid,
  payload jsonb not null,
  signature_verified boolean not null default false,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (tenant_id, provider, external_event_id)
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  actor_type text not null check (actor_type in ('user','workflow','provider','system')),
  actor_id text,
  action text not null,
  subject_type text not null,
  subject_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  mode text not null default 'test' check (mode in ('test','live')),
  status text not null check (status in ('needs_credentials','connected','degraded','disconnected')),
  secret_reference text,
  capabilities jsonb not null default '[]'::jsonb,
  last_tested_at timestamptz,
  last_success_at timestamptz,
  last_webhook_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index if not exists workflow_runs_tenant_status_idx on public.workflow_runs (tenant_id, status, created_at desc);
create index if not exists approvals_tenant_status_idx on public.approvals (tenant_id, status, created_at desc);
create index if not exists conversations_tenant_last_message_idx on public.conversations (tenant_id, last_message_at desc);
create index if not exists provider_events_unprocessed_idx on public.provider_events (tenant_id, received_at) where processed_at is null;
create index if not exists audit_log_tenant_occurred_idx on public.audit_log (tenant_id, occurred_at desc);

create or replace function public.is_organization_member(target uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.organization_members m where m.organization_id = target and m.user_id = auth.uid()) $$;

create or replace function public.is_organization_operator(target uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.organization_members m where m.organization_id = target and m.user_id = auth.uid() and m.role in ('owner','admin','operator')) $$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_operator(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_operator(uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'organizations','organization_members','companies','contacts','consent_records','suppressions',
    'recovery_orders','conversations','messages','workflow_runs','workflow_tasks','approvals',
    'appointments','payments','provider_events','audit_log','integration_connections'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy organizations_member_select on public.organizations for select to authenticated
  using (public.is_organization_member(id));
create policy organization_members_member_select on public.organization_members for select to authenticated
  using (public.is_organization_member(organization_id));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'companies','contacts','consent_records','suppressions','recovery_orders','conversations','messages',
    'workflow_runs','workflow_tasks','approvals','appointments','payments','provider_events','audit_log','integration_connections'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(tenant_id))', table_name || '_member_select', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_organization_operator(tenant_id)) with check (public.is_organization_operator(tenant_id))', table_name || '_operator_write', table_name);
  end loop;
end $$;

revoke update, delete on public.consent_records, public.provider_events, public.audit_log from authenticated;

commit;
