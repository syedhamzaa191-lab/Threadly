-- ============================================
-- THREADLY DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. WORKSPACES
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- 3. CHANNELS
create table if not exists public.channels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  description   text default '',
  is_private    boolean not null default false,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, name)
);

-- 4. MESSAGES
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references public.channels(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  thread_id     uuid references public.messages(id) on delete cascade,
  reply_count   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_messages_channel on public.messages(channel_id, created_at);
create index if not exists idx_messages_thread on public.messages(thread_id, created_at);

create or replace function public.increment_reply_count()
returns trigger as $$
begin
  if new.thread_id is not null then
    update public.messages set reply_count = reply_count + 1 where id = new.thread_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_thread_reply on public.messages;
create trigger on_thread_reply
  after insert on public.messages
  for each row execute function public.increment_reply_count();

-- 5. INVITES
create table if not exists public.invites (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  code          text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by    uuid not null references public.profiles(id),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz not null default now()
);

-- 6. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.invites enable row level security;

-- Profiles
create policy "Profiles readable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

-- Workspaces
create policy "Members can view workspace"
  on public.workspaces for select to authenticated
  using (id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
create policy "Authenticated users can create workspaces"
  on public.workspaces for insert to authenticated with check (owner_id = auth.uid());

-- Workspace members
create policy "Members can view fellow members"
  on public.workspace_members for select to authenticated
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
create policy "Members can join via insert"
  on public.workspace_members for insert to authenticated with check (user_id = auth.uid());

-- Channels
create policy "Workspace members can view channels"
  on public.channels for select to authenticated
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
create policy "Workspace members can create channels"
  on public.channels for insert to authenticated
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

-- Messages
create policy "Channel members can view messages"
  on public.messages for select to authenticated
  using (channel_id in (
    select c.id from public.channels c
    join public.workspace_members wm on wm.workspace_id = c.workspace_id
    where wm.user_id = auth.uid()
  ));
create policy "Channel members can insert messages"
  on public.messages for insert to authenticated
  with check (user_id = auth.uid() and channel_id in (
    select c.id from public.channels c
    join public.workspace_members wm on wm.workspace_id = c.workspace_id
    where wm.user_id = auth.uid()
  ));
create policy "Users can update own messages"
  on public.messages for update to authenticated
  using (user_id = auth.uid());
create policy "Users can delete own messages"
  on public.messages for delete to authenticated
  using (user_id = auth.uid());

-- Invites
create policy "Authenticated users can view invites"
  on public.invites for select to authenticated using (true);
create policy "Workspace members can create invites"
  on public.invites for insert to authenticated
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

-- 7. ENABLE REALTIME for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channels;
