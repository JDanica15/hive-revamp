-- Blog agent: company brief, per-topic facts, and the General/Hive rotation. Run once in the
-- Supabase SQL editor (after 004_blog.sql).
--
-- Same security model as 004: Row Level Security on, no policies, so only the site's server
-- (secret key) can read or write these.

-- Settings: one row. `company_brief` is what the writer may state as true about Hive.
-- `hive_post_every` = every Nth scheduled post is a Hive post (0 = never rotate automatically).
create table if not exists blog_settings (
  id              smallint primary key default 1 check (id = 1),
  company_brief   text not null default '',
  hive_post_every int  not null default 3 check (hive_post_every between 0 and 20),
  updated_date    timestamptz not null default now()
);
insert into blog_settings (id) values (1) on conflict do nothing;
alter table blog_settings enable row level security;

-- Queued topics can carry facts and a kind.
alter table blog_topics add column if not exists kind  text not null default 'general' check (kind in ('general', 'hive'));
alter table blog_topics add column if not exists facts text not null default '';

-- Remember which facts a post was written from, so the reviewer can check the post against them.
alter table blog_posts add column if not exists facts_used text not null default '';
