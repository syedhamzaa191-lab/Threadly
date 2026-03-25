create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  code          text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by    uuid not null references public.profiles(id),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz not null default now()
);
