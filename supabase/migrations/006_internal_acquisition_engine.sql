begin;

-- Internal acquisition is a bounded subsystem. It prepares prospects for sale but
-- never writes directly into a customer's operational conversations or automations.
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  niche text not null,
  metro text not null,
  radius_miles integer not null default 40 check(radius_miles between 1 and 250),
  search_terms text[] not null default '{}',
  max_results integer not null default 100 check(max_results between 1 and 5000),
  schedule text,
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scrape_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  saved_search_id uuid references public.saved_searches(id) on delete set null,
  provider text not null default 'google_maps',
  state text not null default 'queued' check(state in ('queued','running','succeeded','failed','cancelled')),
  idempotency_key text not null,
  requested_count integer not null default 0,
  raw_count integer not null default 0,
  duplicate_count integer not null default 0,
  suppressed_count integer not null default 0,
  qualified_count integer not null default 0,
  worker_reference text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(tenant_id,idempotency_key)
);

create table if not exists public.raw_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  scrape_batch_id uuid not null references public.scrape_batches(id) on delete cascade,
  source text not null,
  source_record_id text,
  source_url text,
  payload jsonb not null,
  normalized_phone text,
  normalized_domain text,
  normalized_name text,
  normalized_address text,
  duplicate_of uuid references public.raw_leads(id) on delete set null,
  suppression_reason text,
  imported_at timestamptz not null default now(),
  unique(tenant_id,source,source_record_id)
);

create table if not exists public.acquisition_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  raw_lead_id uuid references public.raw_leads(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  niche text not null,
  name text not null,
  phone text,
  email text,
  domain text,
  website_url text,
  address text,
  city text,
  region text,
  maps_url text,
  rating numeric(3,2),
  review_count integer,
  contactability text not null default 'unknown' check(contactability in ('unknown','low','medium','high','blocked')),
  stage text not null default 'discovered' check(stage in ('discovered','qualified','audit_queued','audit_ready','awaiting_approval','contacted','audit_viewed','interested','proposal','deposit_pending','deposit_paid','onboarding','active_customer','recurring_customer','rejected','blocked')),
  twenty_company_id text,
  twenty_opportunity_id text,
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists acquisition_leads_phone_unique on public.acquisition_leads(tenant_id,phone) where phone is not null;
create unique index if not exists acquisition_leads_domain_unique on public.acquisition_leads(tenant_id,domain) where domain is not null;

create table if not exists public.lead_score_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  version integer not null,
  name text not null,
  rules jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(tenant_id,version)
);

create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.acquisition_leads(id) on delete cascade,
  score_version_id uuid references public.lead_score_versions(id) on delete set null,
  fit_score integer not null default 0,
  website_opportunity_score integer not null default 0,
  contactability_score integer not null default 0,
  evidence_confidence integer not null default 0,
  expected_value_score integer not null default 0,
  total_score integer not null default 0,
  blocked boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now()
);
create index if not exists lead_scores_lead_latest_idx on public.lead_scores(lead_id,calculated_at desc);

alter table public.audit_jobs add column if not exists acquisition_lead_id uuid references public.acquisition_leads(id) on delete set null;

create table if not exists public.outreach_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.acquisition_leads(id) on delete cascade,
  audit_job_id uuid references public.audit_jobs(id) on delete set null,
  status text not null default 'draft' check(status in ('draft','awaiting_approval','approved','rejected','active','paused','completed','blocked')),
  recommended_channel text check(recommended_channel in ('email','sms','call','multi_channel')),
  rationale jsonb not null default '{}'::jsonb,
  estimated_cost_minor bigint not null default 0,
  currency text not null default 'USD',
  policy_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  outreach_plan_id uuid not null references public.outreach_plans(id) on delete cascade,
  channel text not null check(channel in ('email','sms','call')),
  subject text,
  body text not null,
  prompt_version text,
  evidence_refs jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  unique(outreach_plan_id,channel,version)
);

create table if not exists public.outreach_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  outreach_plan_id uuid not null references public.outreach_plans(id) on delete cascade,
  decision text not null check(decision in ('approved','rejected','changes_requested','revoked')),
  approved_channels text[] not null default '{}',
  note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now()
);

create table if not exists public.acquisition_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.acquisition_leads(id) on delete cascade,
  outreach_plan_id uuid references public.outreach_plans(id) on delete set null,
  event_type text not null,
  provider text,
  external_id text,
  channel text,
  direction text,
  status text,
  occurred_at timestamptz not null,
  evidence jsonb not null default '{}'::jsonb,
  cost_minor bigint not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  unique(tenant_id,provider,external_id)
);

create table if not exists public.workspace_provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.acquisition_leads(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  customer_organization_id uuid references public.organizations(id) on delete set null,
  state text not null default 'queued' check(state in ('queued','running','waiting_for_intake','waiting_for_connections','ready_for_test','active','failed','cancelled')),
  idempotency_key text not null,
  context jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,idempotency_key)
);

create index if not exists acquisition_leads_stage_idx on public.acquisition_leads(tenant_id,stage,updated_at desc);
create index if not exists scrape_batches_state_idx on public.scrape_batches(state,created_at);
create index if not exists outreach_plans_status_idx on public.outreach_plans(tenant_id,status,updated_at desc);
create index if not exists acquisition_events_lead_idx on public.acquisition_events(lead_id,occurred_at desc);

-- Authenticated organization operators may inspect and manage acquisition data for
-- their organization. Platform workers continue to use service-role access.
do $$ declare t text; begin
  foreach t in array array[
    'saved_searches','scrape_batches','raw_leads','acquisition_leads','lead_score_versions',
    'lead_scores','outreach_plans','outreach_drafts','outreach_approvals',
    'acquisition_events','workspace_provisioning_jobs'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_member_select',t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(tenant_id))',t||'_member_select',t);
    execute format('drop policy if exists %I on public.%I',t||'_operator_write',t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_organization_operator(tenant_id)) with check (public.is_organization_operator(tenant_id))',t||'_operator_write',t);
  end loop;
end $$;

commit;
