-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  phone text,
  ai_instructions text,
  auto_follow_ups boolean not null default true,
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
  score integer default 50,
  score_breakdown jsonb default '{}'::jsonb,
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

  -- Seed sample properties for new users so the dashboard isn't empty
  insert into public.properties (title, price, location, city, type, description, owner_id)
  values
    ('Modern Downtown Villa', 450000, 'Center City', 'Algiers', 'villa', 'A beautiful modern villa in the heart of the city with 4 bedrooms, pool, and garden.', new.id),
    ('Seaside Apartment', 280000, 'Corniche', 'Oran', 'apartment', 'Stunning sea-view apartment with 3 bedrooms, modern kitchen, and balcony.', new.id),
    ('Mountain View House', 320000, 'Highland Hills', 'Tizi Ouzou', 'house', 'Cozy mountain house with panoramic views, 5 bedrooms, and large backyard.', new.id);

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
alter table public.leads add column if not exists   property_id uuid references public.properties(id) on delete set null;

alter table public.leads add column if not exists preferences jsonb default '{}'::jsonb;

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

alter table public.conversations add column if not exists ai_active boolean not null default true;

alter table public.conversations add column if not exists notes text;

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
  priority text not null default 'normal' check (priority in ('urgent', 'normal', 'low')),
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

-- Integrations table (per-user Twilio/Meta creds)
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  provider text not null default 'twilio',
  twilio_account_sid text not null,
  twilio_auth_token text not null,
  twilio_whatsapp_from text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.integrations enable row level security;

drop policy if exists "Users can view own integration" on public.integrations;
create policy "Users can view own integration"
  on public.integrations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own integration" on public.integrations;
create policy "Users can insert own integration"
  on public.integrations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own integration" on public.integrations;
create policy "Users can update own integration"
  on public.integrations for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own integration" on public.integrations;
create policy "Users can delete own integration"
  on public.integrations for delete
  using (auth.uid() = user_id);

-- Error logs
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  context text not null,
  message text,
  stack text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.logs enable row level security;

-- Only service_role can read logs (admin client)
drop policy if exists "Service role can manage logs" on public.logs;
create policy "Service role can manage logs"
  on public.logs for all
  using (true)
  with check (true);

-- Delivery logs (Twilio status callbacks)
create table if not exists public.delivery_logs (
  id uuid primary key default gen_random_uuid(),
  message_sid text,
  conversation_id uuid references public.conversations(id) on delete set null,
  status text not null,
  error_code text,
  error_message text,
  to_phone text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.delivery_logs enable row level security;

drop policy if exists "Service role can manage delivery_logs" on public.delivery_logs;
create policy "Service role can manage delivery_logs"
  on public.delivery_logs for all
  using (true)
  with check (true);

-- Dead letter queue for failed message deliveries
create table if not exists public.delivery_queue (
  id uuid primary key default gen_random_uuid(),
  to_phone text not null,
  message_text text not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  owner_id uuid references public.profiles(id),
  error text,
  retry_count int default 0,
  max_retries int default 3,
  status text default 'failed',
  created_at timestamptz default now()
);

alter table public.delivery_queue enable row level security;

drop policy if exists "Service role can manage delivery_queue" on public.delivery_queue;
create policy "Service role can manage delivery_queue"
  on public.delivery_queue for all
  using (true)
  with check (true);

-- Phase 2: Property availability status + tags
alter table public.properties add column if not exists status text not null default 'for_sale'
  check (status in ('for_sale', 'for_rent', 'sold', 'rented'));
alter table public.properties add column if not exists tags jsonb default '[]'::jsonb;

-- Phase 2: Tags, assignment, reminders on leads
alter table public.leads add column if not exists tags jsonb default '[]'::jsonb;
alter table public.leads add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
alter table public.leads add column if not exists reminder_at timestamptz;
alter table public.leads drop constraint if exists leads_status_check;

-- Phase 2: Starred conversations
alter table public.conversations add column if not exists starred boolean not null default false;

-- Phase 2: Custom lead statuses per user
create table if not exists public.lead_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table public.lead_statuses enable row level security;
drop policy if exists "Users can manage own lead statuses" on public.lead_statuses;
create policy "Users can manage own lead statuses"
  on public.lead_statuses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Phase 3: Better qualification — bedrooms, purchase timeline, financing
alter table public.leads add column if not exists viewed_properties jsonb default '[]'::jsonb;

-- Phase 3: Follow-up pause per-lead
alter table public.leads add column if not exists follow_ups_paused boolean not null default false;

-- Phase 3: Custom follow-up sequences
create table if not exists public.follow_up_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
alter table public.follow_up_sequences enable row level security;
drop policy if exists "Users can manage own follow_up_sequences" on public.follow_up_sequences;
create policy "Users can manage own follow_up_sequences"
  on public.follow_up_sequences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.follow_up_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.follow_up_sequences(id) on delete cascade,
  delay_days int not null,
  message text not null,
  type text not null default 'suggestion',
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table public.follow_up_sequence_steps enable row level security;
drop policy if exists "Users can manage own follow_up_sequence_steps" on public.follow_up_sequence_steps;
create policy "Users can manage own follow_up_sequence_steps"
  on public.follow_up_sequence_steps for all
  using (auth.uid() = (select user_id from public.follow_up_sequences where id = sequence_id))
  with check (auth.uid() = (select user_id from public.follow_up_sequences where id = sequence_id));

alter table public.leads add column if not exists sequence_id uuid references public.follow_up_sequences(id) on delete set null;

-- Phase 3: Bookings (appointment scheduling)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.bookings enable row level security;
drop policy if exists "Users can view own bookings" on public.bookings;
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);
drop policy if exists "Users can insert own bookings" on public.bookings;
create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);
drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);
drop policy if exists "Users can delete own bookings" on public.bookings;
create policy "Users can delete own bookings"
  on public.bookings for delete
  using (auth.uid() = user_id);

-- Phase 3: Pending AI suggestion on conversations
alter table public.conversations add column if not exists pending_suggestion text;
alter table public.conversations add column if not exists pending_suggestion_media jsonb default null;

-- Phase 4: Conversation summary
alter table public.conversations add column if not exists summary text;

-- Phase 4: Escalation
alter table public.conversations add column if not exists escalated boolean not null default false;
alter table public.conversations add column if not exists escalation_reason text;

-- Phase 4: Deal tracking on leads
alter table public.leads add column if not exists deal_value numeric;
alter table public.leads add column if not exists close_date timestamptz;
alter table public.leads add column if not exists deal_stage text;

-- Phase 4: Video URL for properties
alter table public.properties add column if not exists video_url text;

-- Phase 1 Hardening: Audit logs table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (auth.uid() = user_id);

-- Phase 1 Hardening: Performance indexes
create index if not exists idx_leads_user_id on public.leads(user_id);
create index if not exists idx_leads_phone on public.leads(phone);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_properties_owner_id on public.properties(owner_id);
create index if not exists idx_properties_type on public.properties(type);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_conversations_phone on public.conversations(phone);
create index if not exists idx_conversations_owner_id on public.conversations(owner_id);
create index if not exists idx_conversations_last_message_at on public.conversations(last_message_at desc);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_follow_ups_lead_id on public.follow_ups(lead_id);
create index if not exists idx_follow_ups_scheduled_at on public.follow_ups(scheduled_at);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_scheduled_at on public.bookings(scheduled_at);
create index if not exists idx_lead_statuses_user_id on public.lead_statuses(user_id);
create index if not exists idx_follow_up_sequences_user_id on public.follow_up_sequences(user_id);

-- Phase 2: AI cost tracking
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost numeric(10,6) not null default 0,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.ai_usage_logs enable row level security;
drop policy if exists "Users can view own usage" on public.ai_usage_logs;
create policy "Users can view own usage"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create index if not exists idx_ai_usage_conversation on public.ai_usage_logs(conversation_id);
create index if not exists idx_ai_usage_created_at on public.ai_usage_logs(created_at);

-- Phase 2b: Team roles
alter table public.profiles add column if not exists role text not null default 'owner' check (role in ('owner', 'admin', 'agent', 'viewer'));
alter table public.profiles add column if not exists agency_id uuid references public.profiles(id) on delete set null;

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  role text not null default 'agent' check (role in ('admin', 'agent', 'viewer')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

alter table public.team_invites enable row level security;
drop policy if exists "Agency owners/admins can view invites" on public.team_invites;
create policy "Agency owners/admins can view invites"
  on public.team_invites for select
  using (auth.uid() in (
    select id from public.profiles where agency_id = team_invites.agency_id and role in ('owner', 'admin')
  ));

drop policy if exists "Agency owners/admins can create invites" on public.team_invites;
create policy "Agency owners/admins can create invites"
  on public.team_invites for insert
  with check (auth.uid() in (
    select id from public.profiles where agency_id = team_invites.agency_id and role in ('owner', 'admin')
  ));

create index if not exists idx_team_invites_token on public.team_invites(token);
create index if not exists idx_profiles_agency_id on public.profiles(agency_id);
create index if not exists idx_profiles_role on public.profiles(role);
