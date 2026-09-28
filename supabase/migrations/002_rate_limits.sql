-- Rate limiting for the contact form, job applications, admin sign-in and password resets.
-- Run once in the Supabase SQL editor (already included in schema.sql for new projects).
-- Stores only a salted hash of the visitor's IP, never the IP itself.

create table if not exists rate_limits (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_bucket_idx on rate_limits (bucket, created_at desc);

-- Server-only: RLS on with no policies, so it's unreadable/unwritable with the publishable key.
alter table rate_limits enable row level security;
