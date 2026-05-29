-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  phone text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  status text not null default 'cold' check (status in ('hot', 'warm', 'cold')),
  source text default 'manual',
  notes text,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.leads enable row level security;

drop policy if exists "Users can view own leads" on public.leads;
create policy "Users can view own leads"
  on public.leads for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own leads" on public.leads;
create policy "Users can insert own leads"
  on public.leads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own leads" on public.leads;
create policy "Users can update own leads"
  on public.leads for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own leads" on public.leads;
create policy "Users can delete own leads"
  on public.leads for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric not null,
  location text not null,
  city text not null,
  type text not null check (type in ('villa', 'apartment', 'house', 'land', 'commercial', 'other')),
  description text,
  images jsonb default '[]'::jsonb,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.properties enable row level security;

drop policy if exists "Users can view own properties" on public.properties;
create policy "Users can view own properties"
  on public.properties for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own properties" on public.properties;
create policy "Users can insert own properties"
  on public.properties for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own properties" on public.properties;
create policy "Users can update own properties"
  on public.properties for update
  using (auth.uid() = owner_id);

drop policy if exists "Users can delete own properties" on public.properties;
create policy "Users can delete own properties"
  on public.properties for delete
  using (auth.uid() = owner_id);

-- Link leads to properties
alter table public.leads add column if not exists property_id uuid references public.properties(id) on delete set null;

-- WhatsApp conversations (owner_id = property owner who receives the lead)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  contact_name text,
  owner_id uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  intent text,
  intent_score numeric,
  status text not null default 'active' check (status in ('active', 'archived')),
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.conversations add column if not exists owner_id uuid references public.profiles(id) on delete set null;

alter table public.conversations enable row level security;

drop policy if exists "Users can view own conversations" on public.conversations;
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert conversations" on public.conversations;
create policy "Users can insert conversations"
  on public.conversations for insert
  with check (true);

drop policy if exists "Users can update own conversations" on public.conversations;
create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = owner_id);

-- Messages in conversations
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select
  using (
    auth.uid() = (select c.owner_id from public.conversations c where c.id = conversation_id)
  );

drop policy if exists "Users can insert messages" on public.messages;
create policy "Users can insert messages"
  on public.messages for insert
  with check (true);

-- In-app notifications for owners
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'lead_hot', 'lead_warm', 'message', 'follow_up')),
  link text,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert notifications" on public.notifications;
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

-- Follow-up scheduling
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  scheduled_at timestamptz not null,
  type text not null check (type in ('suggestion', 'reminder', 'update', 'custom')),
  message text not null,
  completed boolean not null default false,
  created_at timestamptz default now()
);

alter table public.follow_ups enable row level security;

drop policy if exists "Users can view own follow_ups" on public.follow_ups;
create policy "Users can view own follow_ups"
  on public.follow_ups for select
  using (auth.uid() = (select user_id from public.leads where id = lead_id));

drop policy if exists "Users can insert follow_ups" on public.follow_ups;
create policy "Users can insert follow_ups"
  on public.follow_ups for insert
  with check (auth.uid() = (select user_id from public.leads where id = lead_id));

drop policy if exists "Users can update own follow_ups" on public.follow_ups;
create policy "Users can update own follow_ups"
  on public.follow_ups for update
  using (auth.uid() = (select user_id from public.leads where id = lead_id));
