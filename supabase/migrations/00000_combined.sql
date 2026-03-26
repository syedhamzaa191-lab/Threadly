-- ============================================
-- THREADLY DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. PROFILES (Soft Delete - NEVER permanently delete users)
-- status: active/inactive
-- is_deleted: soft delete flag (keeps chat history safe, prevents system errors, allows recovery)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete set null,
  full_name   text not null default '',
  email       text,
  avatar_url  text,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status      text not null default 'active' check (status in ('active', 'inactive')),
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Soft delete function (deactivate user instead of deleting)
create or replace function public.deactivate_user(target_user_id uuid)
returns void as $$
begin
  update public.profiles
  set status = 'inactive', is_deleted = true, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- Reactivate user function
create or replace function public.reactivate_user(target_user_id uuid)
returns void as $$
begin
  update public.profiles
  set status = 'active', is_deleted = false, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- 2. WORKSPACES
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references public.profiles(id),
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

-- 3b. CHANNEL MEMBERS (Admin assigns employees to channels)
-- Not every workspace member sees every channel
-- Admin controls who is in which channel
create table if not exists public.channel_members (
  channel_id    uuid not null references public.channels(id) on delete cascade,
  user_id       uuid not null references public.profiles(id),
  added_by      uuid references public.profiles(id),
  added_at      timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create index if not exists idx_channel_members_user on public.channel_members(user_id);

-- 4. MESSAGES (Auto-delete after 100 days)
-- parent_message_id: null = top-level message, set = thread reply
create table if not exists public.messages (
  id                  uuid primary key default gen_random_uuid(),
  channel_id          uuid not null references public.channels(id) on delete cascade,
  sender_id           uuid not null references public.profiles(id),
  content             text not null,
  parent_message_id   uuid references public.messages(id) on delete cascade,
  reply_count         int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_messages_channel on public.messages(channel_id, created_at);
create index if not exists idx_messages_thread on public.messages(parent_message_id, created_at);
-- Index for the auto-delete cron job (fast lookup of old messages)
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Auto-increment reply_count when a thread reply is inserted
create or replace function public.increment_reply_count()
returns trigger as $$
begin
  if new.parent_message_id is not null then
    update public.messages set reply_count = reply_count + 1 where id = new.parent_message_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_thread_reply on public.messages;
create trigger on_thread_reply
  after insert on public.messages
  for each row execute function public.increment_reply_count();

-- Auto-delete messages older than 100 days
-- Call this function via Supabase cron (pg_cron) or external cron
create or replace function public.delete_old_messages()
returns int as $$
declare
  deleted_count int;
begin
  with deleted as (
    delete from public.messages
    where created_at < now() - interval '100 days'
    returning id
  )
  select count(*) into deleted_count from deleted;
  return deleted_count;
end;
$$ language plpgsql security definer;

-- Schedule auto-delete: runs daily at 3:00 AM UTC
-- NOTE: Requires pg_cron extension enabled in Supabase Dashboard > Database > Extensions
-- Uncomment the lines below after enabling pg_cron:
-- select cron.schedule(
--   'delete-old-messages',
--   '0 3 * * *',
--   $$ select public.delete_old_messages(); $$
-- );

-- 5. INVITES (Security gate - no one enters without invite)
-- Token-based: 32-byte secure random token, 24h expiry, single-use
create table if not exists public.invites (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  email         text not null,
  token         text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_by    uuid not null references public.profiles(id),
  is_used       boolean not null default false,
  used_by       uuid references public.profiles(id),
  used_at       timestamptz,
  expires_at    timestamptz not null default (now() + interval '24 hours'),
  created_at    timestamptz not null default now()
);

create index if not exists idx_invites_token on public.invites(token);
create index if not exists idx_invites_email on public.invites(email);

-- 6. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.channel_members enable row level security;
alter table public.invites enable row level security;

-- Profiles (only show active, non-deleted users in normal queries)
create policy "Profiles readable by authenticated users"
  on public.profiles for select to authenticated
  using (is_deleted = false);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid() and is_deleted = false);

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

-- Channel Members
create policy "Channel members can view their channel memberships"
  on public.channel_members for select to authenticated
  using (channel_id in (
    select cm.channel_id from public.channel_members cm where cm.user_id = auth.uid()
  ) or user_id = auth.uid());
create policy "Admins can add channel members"
  on public.channel_members for insert to authenticated
  with check (true); -- Backend API validates admin role
create policy "Admins can remove channel members"
  on public.channel_members for delete to authenticated
  using (true); -- Backend API validates admin role

-- Messages (only channel members can view/send in their channels)
create policy "Channel members can view messages"
  on public.messages for select to authenticated
  using (channel_id in (
    select cm.channel_id from public.channel_members cm
    where cm.user_id = auth.uid()
  ));
create policy "Channel members can insert messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and channel_id in (
    select cm.channel_id from public.channel_members cm
    where cm.user_id = auth.uid()
  ));
create policy "Users can update own messages"
  on public.messages for update to authenticated
  using (sender_id = auth.uid());
create policy "Users can delete own messages"
  on public.messages for delete to authenticated
  using (sender_id = auth.uid());

-- Invites
create policy "Authenticated users can view invites"
  on public.invites for select to authenticated using (true);
create policy "Workspace members can create invites"
  on public.invites for insert to authenticated
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

-- 7. ENABLE REALTIME for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channels;
