-- Enable RLS on all tables
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

-- Invites (readable by anyone authenticated for accepting, creatable by workspace members)
create policy "Authenticated users can view invites"
  on public.invites for select to authenticated using (true);
create policy "Workspace members can create invites"
  on public.invites for insert to authenticated
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
