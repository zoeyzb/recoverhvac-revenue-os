create table if not exists public.public_intake_requests (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  business_name text not null check (char_length(business_name) between 2 and 160),
  phone text not null check (char_length(phone) between 7 and 40),
  email text not null check (char_length(email) <= 254),
  industry text not null check (char_length(industry) between 2 and 120),
  service_area text not null check (char_length(service_area) between 2 and 160),
  website_url text,
  no_website boolean not null default false,
  needs jsonb not null default '[]'::jsonb,
  service_path text not null check (service_path in ('audit','front-office','complete')),
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'new' check (status in ('new','reviewing','contacted','qualified','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.public_intake_requests enable row level security;

revoke all on table public.public_intake_requests from anon, authenticated;
grant select, insert on table public.public_intake_requests to service_role;

create index if not exists public_intake_requests_status_created_idx
  on public.public_intake_requests (status, created_at desc);

comment on table public.public_intake_requests is
  'Public recovery-plan requests. No client policies permit browser access; writes use the server-only service role.';
