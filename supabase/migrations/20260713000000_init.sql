-- TrackKaro initial schema.
-- Mirrors the local/mock SQLite schema in src/adapters/mock/db.ts — same
-- entities, same shape — so the Supabase* adapters are a drop-in swap for
-- the Local* adapters behind the same ports (PRD §4.5/§9.1).
--
-- Auth: uses Supabase's built-in auth.users (phone OTP) rather than a
-- custom users table — auth.uid() is the userId everywhere below.
-- Rate limiting (guest daily AI-extraction cap) intentionally has no table
-- here: it's keyed on device id, not account id, and stays served by
-- LocalRateLimiter regardless of which database backs everything else,
-- since signed-up users have no cap in the first place (PRD §4.4/§8.5).

create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR',
  merchant text,
  category text not null,
  category_confidence text not null,
  note text,
  date date not null,
  source text not null,
  receipt_image_uri text,
  reference_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
create index if not exists expenses_user_reference_idx on public.expenses (user_id, reference_number);

create table if not exists public.payees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vpa text not null,
  display_name text not null,
  last_used_category text,
  unique (user_id, vpa)
);

create table if not exists public.category_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_key text not null,
  category text not null,
  primary key (user_id, merchant_key)
);

-- Row-level security: every table is scoped to auth.uid() so the public
-- anon key is safe to embed in the client (PRD §9 data-isolation
-- requirement — one user's data must never be reachable via another's
-- session, under any bug condition).

alter table public.expenses enable row level security;
alter table public.payees enable row level security;
alter table public.category_overrides enable row level security;

create policy "expenses_owner_all" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "payees_owner_all" on public.payees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "category_overrides_owner_all" on public.category_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: a private bucket for receipt photos, one folder per user,
-- readable/writable only by that user (mirrors LocalFileStorage's
-- per-device isolation).

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts_owner_all" on storage.objects
  for all using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
