create table if not exists public.employee_notifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  title text not null,
  message text not null,
  type text not null,
  visitor_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_employee_notifications_employee_id
on public.employee_notifications (employee_id);

alter table public.employee_notifications enable row level security;

create policy "employees view own notifications"
on public.employee_notifications
for select
using (true);

create policy "employees update own notifications"
on public.employee_notifications
for update
using (true);

create policy "employees insert own notifications"
on public.employee_notifications
for insert
with check (true);

create policy "employees delete own notifications"
on public.employee_notifications
for delete
using (true);
