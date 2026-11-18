-- Blog studio: content brief, strategy, SEO fields. Run once in the Supabase SQL editor
-- (after 005_blog_facts.sql), BEFORE deploying the matching code.
--
-- Same security model as 004: Row Level Security stays on with no policies.
--
-- Scheduling needs no new column: a post with status 'published' and a FUTURE published_date is
-- "scheduled". The public site only shows published posts whose published_date has passed, so it
-- goes live by itself (within the 5 minute page cache), with no cron job.

alter table blog_posts add column if not exists meta_title       text  not null default '';
alter table blog_posts add column if not exists meta_description text  not null default '';
alter table blog_posts add column if not exists focus_keyword    text  not null default '';
-- [{ "path": "/careers", "anchor": "hiring remote staff", "reason": "..." }]: suggested internal links
alter table blog_posts add column if not exists link_suggestions jsonb not null default '[]'::jsonb;
-- What the editor asked for and the approved plan the article was written from.
alter table blog_posts add column if not exists brief            jsonb not null default '{}'::jsonb;
alter table blog_posts add column if not exists strategy         jsonb not null default '{}'::jsonb;
