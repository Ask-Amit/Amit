-- ============================================================
-- AMIT SUPABASE SCHEMA
-- One database. Hub + AmitAccounting + Compass + Onboarding.
-- Built for single business owner now.
-- Architected for multi-staff later (add business_members table).
-- ============================================================

-- ── USERS ───────────────────────────────────────────────────
-- Extends Supabase auth.users. One row per person who signs in.
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users see own row"
  on public.users for all
  using (auth.uid() = id);

-- ── BUSINESSES ──────────────────────────────────────────────
-- Each user owns one business (now). Multi-staff: add business_members later.
create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.businesses enable row level security;
create policy "Owner sees own business"
  on public.businesses for all
  using (auth.uid() = owner_id);

-- ── COMPASS PROFILES ────────────────────────────────────────
-- Amit's spiritual compass per user. Written on first Hub visit.
create table public.compass_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  display_name    text,
  first_visit     date,
  compass_reading numeric(4,2) default 0 check (compass_reading >= 0 and compass_reading <= 10),
  signals         integer default 0,
  witness_path    integer default 0,
  ref_source      text,   -- 'facebook', 'email', 'direct', etc.
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.compass_profiles enable row level security;
create policy "User sees own compass"
  on public.compass_profiles for all
  using (auth.uid() = user_id);

-- ── ONBOARDING EVENTS ───────────────────────────────────────
-- First-visit events, tutorial completion, referral sources.
create table public.onboarding_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  event_type  text not null,  -- 'first_visit','tutorial_complete','ref_facebook','signal_recorded'
  metadata    jsonb,
  created_at  timestamptz default now()
);
alter table public.onboarding_events enable row level security;
create policy "User sees own events"
  on public.onboarding_events for all
  using (auth.uid() = user_id);

-- ── HUB PURSUITS ────────────────────────────────────────────
-- Pursuits / tasks from the Hub.
create table public.hub_pursuits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  title           text not null,
  notes           text,
  purpose         text,   -- spiritual / personal / professional / app-dev
  focus           text,
  priority        text default 'P3',
  due_date        date,
  done            boolean default false,
  completed_at    date,
  recur           text default 'none',
  starred         boolean default false,
  is_sample       boolean default false,
  subcategory     text,
  tags            text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.hub_pursuits enable row level security;
create policy "User sees own pursuits"
  on public.hub_pursuits for all
  using (auth.uid() = user_id);

-- ── HUB MEMORIES ────────────────────────────────────────────
-- Memory and experience entries from the Hub.
create table public.hub_memories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  title           text not null,
  body            text,
  kind            text default 'memory',   -- 'memory' | 'experience' | 'testimony'
  due             date,
  completed_date  date,
  recur           text default 'none',
  source_id       uuid,   -- links testimony pursuit to source memory
  reactivated_from uuid,
  is_sample       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.hub_memories enable row level security;
create policy "User sees own memories"
  on public.hub_memories for all
  using (auth.uid() = user_id);

-- ── HUB REFLECTIONS ─────────────────────────────────────────
-- Daily Word for Today reflections.
create table public.hub_reflections (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  reflection_date  date not null,
  content          text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (user_id, reflection_date)
);
alter table public.hub_reflections enable row level security;
create policy "User sees own reflections"
  on public.hub_reflections for all
  using (auth.uid() = user_id);

-- ── ACCOUNTING: VENDORS ─────────────────────────────────────
-- Vendor memory — Amit remembers who you buy from.
create table public.accounting_vendors (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  name                text not null,
  category            text,
  typical_amount      numeric(10,2),
  notes               text,
  relationship_stage  integer default 1 check (relationship_stage between 1 and 5),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.accounting_vendors enable row level security;
create policy "Owner sees own vendors"
  on public.accounting_vendors for all
  using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

-- ── ACCOUNTING: CATEGORIES ──────────────────────────────────
-- Chart of accounts. Tim Luker's standard structure goes here.
-- parent_id allows hierarchy (Income > Services > Design Work).
create table public.accounting_categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('income','expense','asset','liability','equity')),
  parent_id   uuid references public.accounting_categories(id),
  created_at  timestamptz default now()
);
alter table public.accounting_categories enable row level security;
create policy "Owner sees own categories"
  on public.accounting_categories for all
  using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

-- ── ACCOUNTING: TRANSACTIONS ────────────────────────────────
-- Every receipt, payment, and income entry.
create table public.accounting_transactions (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  vendor_id        uuid references public.accounting_vendors(id),
  category_id      uuid references public.accounting_categories(id),
  amount           numeric(10,2) not null,
  transaction_date date not null,
  description      text,
  document_id      text unique,   -- YYYY-MM-DD-NNNNNNN format
  receipt_url      text,          -- Supabase Storage path
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table public.accounting_transactions enable row level security;
create policy "Owner sees own transactions"
  on public.accounting_transactions for all
  using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

-- ── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.businesses
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.compass_profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.hub_pursuits
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.hub_memories
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.hub_reflections
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.accounting_vendors
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.accounting_transactions
  for each row execute function public.handle_updated_at();

-- ── NEW USER HANDLER ────────────────────────────────────────
-- When someone signs up, automatically create their user row.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
