create table public.channels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  description   text default '',
  is_private    boolean not null default false,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, name)
);
