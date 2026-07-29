create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  subscription_json jsonb not null,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_push_subscriptions_employee_endpoint
on public.push_subscriptions (
  employee_id,
  (subscription_json->>'endpoint')
);

alter table public.push_subscriptions enable row level security;

create policy "employees manage own subscriptions"
on public.push_subscriptions
for all
using (true)
with check (true);
