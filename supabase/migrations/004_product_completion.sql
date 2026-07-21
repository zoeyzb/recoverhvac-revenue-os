-- Product-owned completion layer: audits, reusable workflows, attribution, costs and onboarding.
create extension if not exists pgcrypto;

create table if not exists public.audit_jobs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  recovery_order_id uuid references public.recovery_orders(id) on delete set null, requested_url text not null,
  final_url text, status text not null default 'queued' check(status in ('queued','running','succeeded','failed')),
  lighthouse jsonb, summary jsonb not null default '{}'::jsonb, error text, started_at timestamptz,
  completed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.audit_evidence (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  audit_job_id uuid not null references public.audit_jobs(id) on delete cascade, kind text not null,
  label text not null, source_url text not null, selector text, value jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);
create table if not exists public.public_audit_reports (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  audit_job_id uuid not null references public.audit_jobs(id) on delete cascade, token_hash text not null unique,
  status text not null default 'draft' check(status in ('draft','published','revoked')), title text not null,
  published_at timestamptz, expires_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  key text not null, name text not null, trigger_type text not null, version integer not null default 1,
  enabled boolean not null default false, definition jsonb not null, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique(tenant_id,key)
);
create table if not exists public.revenue_ledger (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null, contact_id uuid references public.contacts(id) on delete set null,
  recovery_order_id uuid references public.recovery_orders(id) on delete set null, payment_id uuid references public.payments(id) on delete set null,
  entry_type text not null check(entry_type in ('revenue','refund','cost')), category text not null,
  amount_minor bigint not null check(amount_minor>=0), currency text not null default 'USD', provider text,
  external_id text, occurred_at timestamptz not null, evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique(tenant_id,provider,external_id)
);
create table if not exists public.attribution_links (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.organizations(id) on delete cascade,
  revenue_entry_id uuid not null references public.revenue_ledger(id) on delete cascade,
  touch_type text not null, touch_id uuid, model text not null default 'direct', weight numeric(6,5) not null check(weight>0 and weight<=1),
  evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.onboarding_progress (
  tenant_id uuid not null references public.organizations(id) on delete cascade, step_key text not null,
  status text not null default 'pending' check(status in ('pending','blocked','complete')),
  evidence jsonb not null default '{}'::jsonb, completed_at timestamptz, updated_at timestamptz not null default now(),
  primary key(tenant_id,step_key)
);

create index if not exists audit_jobs_tenant_created_idx on public.audit_jobs(tenant_id,created_at desc);
create index if not exists audit_evidence_job_idx on public.audit_evidence(audit_job_id,captured_at);
create index if not exists ledger_tenant_occurred_idx on public.revenue_ledger(tenant_id,occurred_at desc);

do $$ declare t text; begin foreach t in array array['audit_jobs','audit_evidence','public_audit_reports','workflow_templates','revenue_ledger','attribution_links','onboarding_progress'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists %I on public.%I',t||'_member_select',t);
  execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(tenant_id))',t||'_member_select',t);
  execute format('drop policy if exists %I on public.%I',t||'_operator_write',t);
  execute format('create policy %I on public.%I for all to authenticated using (public.is_organization_operator(tenant_id)) with check (public.is_organization_operator(tenant_id))',t||'_operator_write',t);
end loop; end $$;

create or replace function public.seed_recovery_templates(target uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  insert into workflow_templates(tenant_id,key,name,trigger_type,definition) values
    (target,'missed_call','Missed call recovery','call.missed','{"steps":[{"type":"policy_check"},{"type":"sms","delay_seconds":60},{"type":"create_task","delay_seconds":900}],"requires_consent":true,"stop_on_reply":true}'::jsonb),
    (target,'estimate_followup','Estimate follow-up','estimate.sent','{"steps":[{"type":"wait","delay_seconds":86400},{"type":"policy_check"},{"type":"email"},{"type":"create_task","delay_seconds":172800}],"stop_on_booked_or_paid":true}'::jsonb),
    (target,'review_request','Review request','job.completed','{"steps":[{"type":"wait","delay_seconds":7200},{"type":"policy_check"},{"type":"sms"}],"requires_completed_job":true,"single_send":true}'::jsonb),
    (target,'audit_outreach','Audit outreach','audit.completed','{"steps":[{"type":"policy_check"},{"type":"approval","scope":"first_touch"},{"type":"ai_call"},{"type":"capture_outcome"},{"type":"book_or_follow_up"}],"requires_verified_audit":true,"stop_on_opt_out":true}'::jsonb)
  on conflict(tenant_id,key) do nothing;
end $$;
revoke all on function public.seed_recovery_templates(uuid) from public,anon,authenticated;
grant execute on function public.seed_recovery_templates(uuid) to service_role;

create or replace function public.claim_audit_job() returns setof public.audit_jobs language plpgsql security definer set search_path=public as $$
declare claimed uuid;
begin
  select id into claimed from audit_jobs where status='queued' order by created_at for update skip locked limit 1;
  if claimed is null then return; end if;
  return query update audit_jobs set status='running',started_at=now() where id=claimed returning *;
end $$;
revoke all on function public.claim_audit_job() from public, anon, authenticated;
grant execute on function public.claim_audit_job() to service_role;
