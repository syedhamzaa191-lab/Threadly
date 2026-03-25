create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
