-- ================================================================
-- ABAVIE — Push notifications + E2E public key registry
-- ================================================================

-- Push subscriptions (Web Push API endpoints)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  endpoint text not null unique,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_push_subs_membre on public.push_subscriptions(membre_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Push subs: own read" on public.push_subscriptions;
create policy "Push subs: own read" on public.push_subscriptions
  for select using (auth.uid() = membre_id);

drop policy if exists "Push subs: own write" on public.push_subscriptions;
create policy "Push subs: own write" on public.push_subscriptions
  for all using (auth.uid() = membre_id) with check (auth.uid() = membre_id);

-- ================================================================
-- E2E public keys (one per device per user)
-- ================================================================
create table if not exists public.e2e_public_keys (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  device_id text not null,
  public_key text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(membre_id, device_id)
);

create index if not exists idx_e2e_keys_membre on public.e2e_public_keys(membre_id);

alter table public.e2e_public_keys enable row level security;

-- Anyone authenticated can read public keys (they're public by nature)
drop policy if exists "E2E keys: read all" on public.e2e_public_keys;
create policy "E2E keys: read all" on public.e2e_public_keys
  for select using (auth.uid() is not null);

drop policy if exists "E2E keys: own write" on public.e2e_public_keys;
create policy "E2E keys: own write" on public.e2e_public_keys
  for all using (auth.uid() = membre_id) with check (auth.uid() = membre_id);

-- ================================================================
-- Add e2e_payload to messages (optional ciphertext)
-- ================================================================
alter table public.messages add column if not exists e2e_payload jsonb;
alter table public.messages add column if not exists e2e_recipient_key text;
