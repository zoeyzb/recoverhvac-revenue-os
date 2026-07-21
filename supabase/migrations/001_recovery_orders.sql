create table if not exists public.recovery_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  company_name text not null check (char_length(company_name) between 1 and 160),
  domain text not null check (char_length(domain) between 1 and 500),
  contact_email text,
  contact_phone text,
  status text not null check (status in ('queued','auditing','review','approved','contacting','replied','booked','paid','blocked','failed')),
  current_step text not null,
  findings jsonb not null default '[]'::jsonb,
  action_plan jsonb,
  provider_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recovery_orders enable row level security;
create index if not exists recovery_orders_tenant_created_idx on public.recovery_orders (tenant_id, created_at desc);

comment on table public.recovery_orders is 'Tenant-scoped acquisition and recovery work orders. Service-role writes require server authorization.';
