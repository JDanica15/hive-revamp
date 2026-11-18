-- Blog + AI writing agent. Run once in the Supabase SQL editor (after 003_chat.sql).
--
-- Security model: Row Level Security is on with NO policies, so these tables can't be read or
-- written with the public (publishable) key. The site's server reads published posts with the
-- secret key; only the admin panel and the cron endpoint can create or change posts.

create table if not exists blog_posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  excerpt          text not null default '',
  body             text not null default '',          -- simple markdown: ## headings, lists, **bold**, links
  tags             text[] not null default '{}',
  cover_image_url  text not null default '',
  cover_image_path text not null default '',          -- path inside the blog-images bucket
  cover_alt        text not null default '',
  image_prompt     text not null default '',
  fact_check_notes text not null default '',          -- claims the writer flagged for a human to verify
  status           text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  source           text not null default 'manual' check (source in ('manual', 'ai')),
  topic            text not null default '',
  model            text not null default '',
  published_date   timestamptz,
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now()
);
create index if not exists blog_posts_status_idx on blog_posts (status, published_date desc);

drop trigger if exists blog_posts_updated on blog_posts;
create trigger blog_posts_updated before update on blog_posts
  for each row execute function set_updated_date();

-- Topics the agent should write about, oldest first. When the queue is empty the agent chooses its own.
create table if not exists blog_topics (
  id           uuid primary key default gen_random_uuid(),
  topic        text not null,
  status       text not null default 'queued' check (status in ('queued', 'used')),
  created_date timestamptz not null default now(),
  used_date    timestamptz
);
create index if not exists blog_topics_queue_idx on blog_topics (status, created_date);

alter table blog_posts  enable row level security;
alter table blog_topics enable row level security;

-- Cover images. Public read (they're shown on the public blog); only the secret key can upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
