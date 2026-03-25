-- ============================================
-- MIGRATION: Update to v2 schema
-- Run this if you already have the old schema
-- ============================================

-- 1. PROFILES: Add soft delete fields
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists is_deleted boolean not null default false;

-- Add constraints if not exist
do $$ begin
  alter table public.profiles add constraint profiles_role_check check (role in ('owner', 'admin', 'member'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.profiles add constraint profiles_status_check check (status in ('active', 'inactive'));
exception when duplicate_object then null;
end $$;

-- Soft delete & reactivate functions
create or replace function public.deactivate_user(target_user_id uuid)
returns void as $$
begin
  update public.profiles
  set status = 'inactive', is_deleted = true, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.reactivate_user(target_user_id uuid)
returns void as $$
begin
  update public.profiles
  set status = 'active', is_deleted = false, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- 2. MESSAGES: Rename columns to match new schema
-- Rename user_id -> sender_id
alter table public.messages rename column user_id to sender_id;

-- Rename thread_id -> parent_message_id
alter table public.messages rename column thread_id to parent_message_id;

-- Add index for auto-delete cron
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Update reply count trigger for new column name
create or replace function public.increment_reply_count()
returns trigger as $$
begin
  if new.parent_message_id is not null then
    update public.messages set reply_count = reply_count + 1 where id = new.parent_message_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Auto-delete messages older than 100 days
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

-- Update RLS policies for new column names
drop policy if exists "Channel members can insert messages" on public.messages;
create policy "Channel members can insert messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and channel_id in (
    select c.id from public.channels c
    join public.workspace_members wm on wm.workspace_id = c.workspace_id
    where wm.user_id = auth.uid()
  ));

drop policy if exists "Users can update own messages" on public.messages;
create policy "Users can update own messages"
  on public.messages for update to authenticated
  using (sender_id = auth.uid());

drop policy if exists "Users can delete own messages" on public.messages;
create policy "Users can delete own messages"
  on public.messages for delete to authenticated
  using (sender_id = auth.uid());

-- Update profiles RLS for soft delete
drop policy if exists "Profiles readable by authenticated users" on public.profiles;
create policy "Profiles readable by authenticated users"
  on public.profiles for select to authenticated
  using (is_deleted = false);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid() and is_deleted = false);
