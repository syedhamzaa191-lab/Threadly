create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references public.channels(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  thread_id     uuid references public.messages(id) on delete cascade,
  reply_count   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_messages_channel on public.messages(channel_id, created_at);
create index idx_messages_thread on public.messages(thread_id, created_at);

-- Increment reply_count on parent when a thread reply is inserted
create or replace function public.increment_reply_count()
returns trigger as $$
begin
  if new.thread_id is not null then
    update public.messages set reply_count = reply_count + 1 where id = new.thread_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_thread_reply
  after insert on public.messages
  for each row execute function public.increment_reply_count();
