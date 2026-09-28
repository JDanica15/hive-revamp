-- Hive BPO database. Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query),
-- then run seed.sql to load the current job listings.
--
-- Security model: Row Level Security is on for every table. The only public access is reading
-- open job listings. Everything else (saving inquiries/applications, the admin panel) goes
-- through the site's server with the service role key, after the admin login is checked.

create extension if not exists pgcrypto;

-- Keeps updated_date current on every edit.
create or replace function set_updated_date() returns trigger
language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end $$;

-- Job listings --------------------------------------------------------------
-- Text ids so the existing /careers/<id> URLs from Base44 keep working.
create table if not exists job_listings (
  id              text primary key default replace(gen_random_uuid()::text, '-', ''),
  title           text not null,
  department      text not null default 'Human Resources',
  location        text not null default 'Remote / Sydney, AU',
  employment_type text not null default 'Full-time',
  summary         text not null default '',
  description     text not null default '',
  requirements    text not null default '',
  status          text not null default 'open' check (status in ('open', 'draft', 'closed')),
  posted_date     date not null default current_date,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now()
);
drop trigger if exists job_listings_updated on job_listings;
create trigger job_listings_updated before update on job_listings
  for each row execute function set_updated_date();

-- Contact form inquiries -----------------------------------------------------
create table if not exists inquiries (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text not null,
  company          text not null default '',
  service_interest text not null default 'General Inquiry',
  message          text not null,
  status           text not null default 'new' check (status in ('new', 'in_review', 'contacted', 'closed')),
  priority         text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now()
);
drop trigger if exists inquiries_updated on inquiries;
create trigger inquiries_updated before update on inquiries
  for each row execute function set_updated_date();

-- Job applications -----------------------------------------------------------
-- job_listing_id is not a foreign key: "general" applications have no listing, and
-- applications should survive a listing being deleted (job_title keeps the name).
create table if not exists job_applications (
  id              uuid primary key default gen_random_uuid(),
  job_listing_id  text not null,
  job_title       text not null,
  applicant_name  text not null,
  applicant_email text not null,
  phone           text not null default '',
  cover_note      text not null default '',
  portfolio_url   text not null default '',
  resume_path     text not null default '',
  status          text not null default 'new' check (status in ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now()
);
drop trigger if exists job_applications_updated on job_applications;
create trigger job_applications_updated before update on job_applications
  for each row execute function set_updated_date();

-- Rate limiting (see src/lib/request-guard.ts). Stores a salted hash of the visitor's IP, never the IP.
create table if not exists rate_limits (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_bucket_idx on rate_limits (bucket, created_at desc);

create index if not exists inquiries_created_idx on inquiries (created_date desc);
create index if not exists job_applications_created_idx on job_applications (created_date desc);
create index if not exists job_listings_status_idx on job_listings (status, posted_date desc);

-- Row Level Security ---------------------------------------------------------
alter table job_listings     enable row level security;
alter table inquiries        enable row level security;
alter table job_applications enable row level security;
alter table rate_limits      enable row level security;

drop policy if exists "Anyone can read open jobs" on job_listings;
create policy "Anyone can read open jobs" on job_listings
  for select to anon, authenticated using (status = 'open');
-- No other policies: inquiries, applications and rate limits are unreadable without the secret key.

-- Resume storage (private bucket; the admin panel opens files through short-lived signed links).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 4194304,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;
