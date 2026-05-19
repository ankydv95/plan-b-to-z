-- Migration: Career Page Depth Upgrade
-- Run this in Supabase dashboard → SQL Editor
-- Date: 2026-05-19

-- ─── Ensure profiles.role exists (defensive — column likely already present) ────
alter table profiles add column if not exists role text not null default 'user';

-- ─── New table: career_mentors ─────────────────────────────────────────────
create table career_mentors (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references career_paths(id) on delete cascade,
  name text not null,
  role text not null,
  company text,
  upsc_background text,
  bio text,
  photo_url text,
  linkedin_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS on career_mentors
alter table career_mentors enable row level security;

create policy "Public can read active mentors"
  on career_mentors for select
  using (is_active = true);

create policy "Admin and editor can manage mentors"
  on career_mentors for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'editor')
    )
  );

-- ─── Indexes ───────────────────────────────────────────────────────────────
create index idx_career_mentors_career_id on career_mentors(career_id);
create index idx_career_mentors_is_active on career_mentors(is_active);

-- ─── New JSONB columns on career_paths ─────────────────────────────────────
-- These are additive — existing columns (launchpad_weeks, youtube_links, podcast_links) are NOT dropped.
alter table career_paths add column if not exists launchpad_phases jsonb;
alter table career_paths add column if not exists resources jsonb;
