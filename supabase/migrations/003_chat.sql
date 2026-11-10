-- Live chat support + atomic rate limiting. Run once in the Supabase SQL editor
-- (also included in schema.sql for new projects).
--
-- Security model: Row Level Security is on with NO policies, so none of these tables can be read
-- or written with the public (publishable) key. Visitors talk to the site's server (/api/chat/*),
-- which uses the secret key. Live delivery uses Realtime Broadcast on a channel named after the
-- conversation's random id, so the database itself is never exposed to the browser.

create table if not exists chat_conversations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null default '',
  page_url        text not null default '',
  visitor_hash    text not null,
  status          text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now()
);
drop trigger if exists chat_conversations_updated on chat_conversations;
create trigger chat_conversations_updated before update on chat_conversations
  for each row execute function set_updated_date();

create table if not exists chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  sender          text not null check (sender in ('visitor', 'staff')),
  body            text not null,
  read_at         timestamptz,
  created_date    timestamptz not null default now()
);
create index if not exists chat_messages_conv_idx on chat_messages (conversation_id, created_date);
create index if not exists chat_conversations_last_idx on chat_conversations (last_message_at desc);

-- One row: whether staff are taking chats right now (the admin chat page sends a heartbeat).
create table if not exists chat_presence (
  id        smallint primary key default 1 check (id = 1),
  available boolean not null default true,
  last_seen timestamptz not null default 'epoch'
);
insert into chat_presence (id) values (1) on conflict do nothing;

alter table chat_conversations enable row level security;
alter table chat_messages      enable row level security;
alter table chat_presence      enable row level security;

-- Atomic rate limit: counts recent hits for a bucket and records this one in a single locked step,
-- so parallel requests can't all slip under the limit. Server-only (see grants below).
create or replace function check_rate_limit(p_bucket text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  hits int;
begin
  perform pg_advisory_xact_lock(hashtext(p_bucket));
  select count(*) into hits from rate_limits
   where bucket = p_bucket and created_at >= now() - make_interval(secs => p_window_seconds);
  if hits >= p_max then
    return false;
  end if;
  insert into rate_limits (bucket) values (p_bucket);
  return true;
end $$;

revoke all on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;
