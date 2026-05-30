# Community Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional Community section with a global post feed, career-path cohort groups (max 5 per user), and anonymous posting.

**Architecture:** Four Supabase tables (community_groups, community_group_members, community_posts, community_post_likes) with RLS. Server components fetch initial data; client components handle likes, posting, tab switching, and group join/leave. Resources inside groups are read from existing `career_paths` JSONB columns — no extra tables.

**Tech Stack:** Next.js App Router, TypeScript strict, Supabase (`@supabase/ssr`), Tailwind CSS v4, lucide-react.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/types/index.ts` | Modify | Add CommunityGroup, CommunityPost, CommunityGroupMember, PostTag |
| `src/app/api/community/groups/join/route.ts` | Create | POST — join a group (enforces max 5) |
| `src/app/api/community/groups/leave/route.ts` | Create | POST — leave a group |
| `src/app/api/community/posts/route.ts` | Create | POST — create a post (global or group) |
| `src/app/api/community/posts/[id]/like/route.ts` | Create | POST — toggle like on a post |
| `src/app/dashboard/community/PostCard.tsx` | Create | Client — single post card with like button |
| `src/app/dashboard/community/ComposePost.tsx` | Create | Client — compose box with tag picker + anonymous toggle |
| `src/app/dashboard/community/ExploreGroups.tsx` | Create | Client — browse and join/leave groups |
| `src/app/dashboard/community/PostFeed.tsx` | Create | Client — feed container with tabs and stories row |
| `src/app/dashboard/community/page.tsx` | Modify | Server — replace placeholder, fetch all data, render layout |
| `src/app/dashboard/community/groups/[slug]/GroupResources.tsx` | Create | Server — resources from career_paths JSONB |
| `src/app/dashboard/community/groups/[slug]/GroupMemberList.tsx` | Create | Server — member list |
| `src/app/dashboard/community/groups/[slug]/GroupTabs.tsx` | Create | Client — Discussion/Resources/Members tab switcher |
| `src/app/dashboard/community/groups/[slug]/page.tsx` | Create | Server — group detail page |

---

## Task 1: Database Migration

**Files:**
- No files — run SQL directly in Supabase SQL Editor

- [ ] **Step 1: Run the migration in Supabase SQL Editor**

Go to your Supabase project → SQL Editor → New query. Paste and run:

```sql
-- community_groups: one per career path
create table community_groups (
  id              uuid primary key default gen_random_uuid(),
  career_path_id  uuid references career_paths(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  description     text,
  member_count    int default 0 not null,
  created_at      timestamptz default now()
);

alter table community_groups enable row level security;

create policy "cg_read" on community_groups
  for select to authenticated using (true);

create policy "cg_admin_write" on community_groups
  for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','editor'))
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','editor'))
  );

-- community_group_members: who joined which group
create table community_group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid references community_groups(id) on delete cascade not null,
  user_id   uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

alter table community_group_members enable row level security;

create policy "cgm_read" on community_group_members
  for select to authenticated using (true);

create policy "cgm_insert" on community_group_members
  for insert to authenticated with check (auth.uid() = user_id);

create policy "cgm_delete" on community_group_members
  for delete to authenticated using (auth.uid() = user_id);

-- community_posts: global feed + group posts + replies
create table community_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references profiles(id) on delete set null,
  group_id      uuid references community_groups(id) on delete cascade,
  parent_id     uuid references community_posts(id) on delete cascade,
  content       text not null,
  is_anonymous  boolean default false not null,
  tag           text not null default 'general'
                  check (tag in ('career_doubts','transition_story','skill_building','emotional_support','general')),
  likes_count   int default 0 not null,
  replies_count int default 0 not null,
  created_at    timestamptz default now()
);

alter table community_posts enable row level security;

create policy "cp_read" on community_posts
  for select to authenticated using (true);

create policy "cp_insert" on community_posts
  for insert to authenticated with check (auth.uid() = author_id);

create policy "cp_delete" on community_posts
  for delete to authenticated using (auth.uid() = author_id);

-- community_post_likes: prevents double-liking
create table community_post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references community_posts(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

alter table community_post_likes enable row level security;

create policy "cpl_read" on community_post_likes
  for select to authenticated using (true);

create policy "cpl_insert" on community_post_likes
  for insert to authenticated with check (auth.uid() = user_id);

create policy "cpl_delete" on community_post_likes
  for delete to authenticated using (auth.uid() = user_id);
```

- [ ] **Step 2: Seed a few community groups for testing**

Still in SQL Editor, run:

```sql
-- Requires career_paths rows to exist. Replace UUIDs with real ones from your career_paths table.
-- OR create groups manually without career_path_id for now:

insert into community_groups (name, slug, description) values
  ('IAS → Product Management', 'ias-product-management', 'For aspirants transitioning into product roles at tech companies.'),
  ('IAS → Consulting', 'ias-consulting', 'Management consulting — BCG, McKinsey, Bain, and boutiques.'),
  ('IAS → Law & Judiciary', 'ias-law-judiciary', 'CLAT, AIBE, and judicial services preparation.'),
  ('IAS → Data & Analytics', 'ias-data-analytics', 'Data science, analytics, and BI roles.'),
  ('IAS → Education & Ed-Tech', 'ias-education-edtech', 'Teaching, coaching, curriculum, and ed-tech startups.');
```

- [ ] **Step 3: Verify tables exist**

Run in SQL Editor:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name like 'community%'
order by table_name;
```

Expected output: 4 rows — `community_group_members`, `community_groups`, `community_post_likes`, `community_posts`.

- [ ] **Step 4: Commit a note**

```bash
# No code changes — just note the migration was applied
git add docs/superpowers/plans/2026-05-26-community.md
git commit -m "docs: add community implementation plan"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts` (append at end of file)

- [ ] **Step 1: Add community types to `src/types/index.ts`**

Open `src/types/index.ts`. At the bottom of the file, after the last interface, add:

```typescript
export type PostTag =
  | 'career_doubts'
  | 'transition_story'
  | 'skill_building'
  | 'emotional_support'
  | 'general'

export interface CommunityGroup {
  id: string
  career_path_id: string | null
  name: string
  slug: string
  description: string | null
  member_count: number
  created_at: string
}

export interface CommunityGroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profiles?: {
    id: string
    full_name: string | null
    stage_reached: string | null
  } | null
}

export interface CommunityPost {
  id: string
  author_id: string | null
  group_id: string | null
  parent_id: string | null
  content: string
  is_anonymous: boolean
  tag: PostTag
  likes_count: number
  replies_count: number
  created_at: string
  profiles?: {
    full_name: string | null
    stage_reached: string | null
  } | null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (clean) or only pre-existing errors unrelated to the new types.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(community): add TypeScript types for community tables"
```

---

## Task 3: API — Join and Leave Group

**Files:**
- Create: `src/app/api/community/groups/join/route.ts`
- Create: `src/app/api/community/groups/leave/route.ts`

- [ ] **Step 1: Create the join route**

Create `src/app/api/community/groups/join/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { group_id } = await request.json() as { group_id: string }
    if (!group_id?.trim()) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    // Enforce max 5 groups per user
    const { count } = await supabase
      .from('community_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'You can join a maximum of 5 groups.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('community_group_members')
      .insert({ group_id, user_id: user.id })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already a member.' }, { status: 400 })
      }
      throw error
    }

    // Increment member_count
    await supabase.rpc('increment_group_member_count', { gid: group_id })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to join group.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the Supabase RPC function for member_count increment**

Run in Supabase SQL Editor:

```sql
create or replace function increment_group_member_count(gid uuid)
returns void language sql security definer as $$
  update community_groups set member_count = member_count + 1 where id = gid;
$$;

create or replace function decrement_group_member_count(gid uuid)
returns void language sql security definer as $$
  update community_groups set member_count = greatest(0, member_count - 1) where id = gid;
$$;
```

- [ ] **Step 3: Create the leave route**

Create `src/app/api/community/groups/leave/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { group_id } = await request.json() as { group_id: string }
    if (!group_id?.trim()) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('community_group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', user.id)

    if (error) throw error

    // Decrement member_count
    await supabase.rpc('decrement_group_member_count', { gid: group_id })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to leave group.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/community/groups/
git commit -m "feat(community): add join/leave group API routes"
```

---

## Task 4: API — Create Post and Toggle Like

**Files:**
- Create: `src/app/api/community/posts/route.ts`
- Create: `src/app/api/community/posts/[id]/like/route.ts`

- [ ] **Step 1: Create the posts route**

Create `src/app/api/community/posts/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PostTag } from '@/types'

const VALID_TAGS: PostTag[] = [
  'career_doubts', 'transition_story', 'skill_building', 'emotional_support', 'general',
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, group_id, tag, is_anonymous, parent_id } = await request.json() as {
      content: string
      group_id?: string | null
      tag?: PostTag
      is_anonymous?: boolean
      parent_id?: string | null
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 })
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Content must be 2000 characters or fewer.' }, { status: 400 })
    }

    const resolvedTag: PostTag = VALID_TAGS.includes(tag as PostTag) ? (tag as PostTag) : 'general'

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        group_id: group_id ?? null,
        parent_id: parent_id ?? null,
        content: content.trim(),
        is_anonymous: is_anonymous ?? false,
        tag: resolvedTag,
      })
      .select('*, profiles(full_name, stage_reached)')
      .single()

    if (error) throw error

    // If reply, increment parent's replies_count
    if (parent_id) {
      await supabase.rpc('increment_replies_count', { pid: parent_id })
    }

    // Sanitize: strip author info for anonymous posts before returning
    const sanitized = {
      ...data,
      author_id: (is_anonymous ?? false) ? null : data.author_id,
      profiles: (is_anonymous ?? false) ? null : data.profiles,
    }

    return NextResponse.json({ data: sanitized })
  } catch {
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the like toggle route**

Create `src/app/api/community/posts/[id]/like/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: post_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if already liked
    const { data: existing } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Unlike: delete the row and decrement
      await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', post_id)
        .eq('user_id', user.id)

      await supabase.rpc('decrement_likes_count', { pid: post_id })

      return NextResponse.json({ liked: false })
    } else {
      // Like: insert and increment
      await supabase
        .from('community_post_likes')
        .insert({ post_id, user_id: user.id })

      await supabase.rpc('increment_likes_count', { pid: post_id })

      return NextResponse.json({ liked: true })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to toggle like.' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create the likes count RPC functions**

Run in Supabase SQL Editor:

```sql
create or replace function increment_likes_count(pid uuid)
returns int language sql security definer as $$
  update community_posts set likes_count = likes_count + 1 where id = pid
  returning likes_count;
$$;

create or replace function decrement_likes_count(pid uuid)
returns int language sql security definer as $$
  update community_posts set likes_count = greatest(0, likes_count - 1) where id = pid
  returning likes_count;
$$;

create or replace function increment_replies_count(pid uuid)
returns int language sql security definer as $$
  update community_posts set replies_count = replies_count + 1 where id = pid
  returning replies_count;
$$;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/community/posts/
git commit -m "feat(community): add create-post and like-toggle API routes"
```

---

## Task 5: PostCard Component

**Files:**
- Create: `src/app/dashboard/community/PostCard.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/PostCard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { CommunityPost } from '@/types'

const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  career_doubts:    { bg: '#FEF3C7', color: '#D97706', label: '🎯 Career Doubts' },
  transition_story: { bg: '#DCFCE7', color: '#059669', label: '✨ Transition Story' },
  skill_building:   { bg: '#EDE9FE', color: '#7C3AED', label: '📚 Skill Building' },
  emotional_support:{ bg: '#FEE2E2', color: '#E11D48', label: '💙 Emotional Support' },
  general:          { bg: '#F5F5F5', color: '#6B7280', label: '💬 General' },
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Props {
  post: CommunityPost
  initialLiked: boolean
}

export default function PostCard({ post, initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [liking, setLiking] = useState(false)

  async function toggleLike() {
    if (liking) return
    setLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1)
    try {
      const res = await fetch(`/api/community/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLiked(wasLiked)
        setLikesCount(prev => wasLiked ? prev + 1 : prev - 1)
      }
    } catch {
      setLiked(wasLiked)
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1)
    } finally {
      setLiking(false)
    }
  }

  const tag = TAG_STYLES[post.tag] ?? TAG_STYLES.general
  const displayName = post.is_anonymous ? 'Anonymous' : (post.profiles?.full_name ?? 'Member')
  const initials = post.is_anonymous ? '?' : (post.profiles?.full_name?.[0]?.toUpperCase() ?? 'M')

  return (
    <div className="bg-white border border-[#EDDFCC] rounded-2xl p-5 shadow-sm hover:border-[#D97706]/50 transition-colors">
      <div className="flex gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white"
          style={{
            background: post.is_anonymous
              ? '#9CA3AF'
              : 'linear-gradient(135deg, #D97706, #EA580C)',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#2A1F14] text-sm">{displayName}</div>
          <div className="text-xs text-[#9A8B78]">
            {post.profiles?.stage_reached && !post.is_anonymous
              ? `${post.profiles.stage_reached} · `
              : ''}
            {formatTimeAgo(post.created_at)}
          </div>
          <span
            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1"
            style={{ background: tag.bg, color: tag.color }}
          >
            {tag.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-[#333] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-5">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            liked ? 'text-[#E11D48]' : 'text-[#9A8B78] hover:text-[#E11D48]'
          }`}
        >
          <Heart size={15} fill={liked ? '#E11D48' : 'none'} strokeWidth={2} />
          {likesCount}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8B78]">
          <MessageCircle size={15} />
          {post.replies_count}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8B78] hover:text-[#D97706] ml-auto transition-colors">
          <Share2 size={13} />
          Share
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/PostCard.tsx
git commit -m "feat(community): add PostCard component with like toggle"
```

---

## Task 6: ComposePost Component

**Files:**
- Create: `src/app/dashboard/community/ComposePost.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/ComposePost.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Send, Lock } from 'lucide-react'
import type { PostTag, CommunityPost } from '@/types'

const TAGS: { value: PostTag; label: string }[] = [
  { value: 'general',           label: '💬 General' },
  { value: 'career_doubts',     label: '🎯 Career Doubts' },
  { value: 'transition_story',  label: '✨ Transition Story' },
  { value: 'skill_building',    label: '📚 Skill Building' },
  { value: 'emotional_support', label: '💙 Emotional Support' },
]

interface Props {
  groupId?: string
  userInitial: string
  onPost: (post: CommunityPost) => void
}

export default function ComposePost({ groupId, userInitial, onPost }: Props) {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState<PostTag>('general')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          tag,
          is_anonymous: isAnonymous,
          group_id: groupId ?? null,
        }),
      })
      const json = await res.json() as { data?: CommunityPost; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to post.')
      } else if (json.data) {
        onPost(json.data)
        setContent('')
        setTag('general')
        setIsAnonymous(false)
        setExpanded(false)
      }
    } catch {
      setError('Failed to post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-[#EDDFCC] rounded-2xl p-4 shadow-sm">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-[#D97706] to-[#EA580C]">
          {userInitial}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Share something with the community..."
            rows={expanded ? 3 : 1}
            maxLength={2000}
            className="w-full resize-none bg-[#F9F6F2] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] placeholder-[#9A8B78] outline-none border border-transparent focus:border-[#D97706] transition-colors"
          />
          {expanded && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TAGS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTag(t.value)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      tag === t.value
                        ? 'bg-[#D97706] text-white'
                        : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#D97706] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsAnonymous(prev => !prev)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    isAnonymous
                      ? 'bg-[#2A1F14] text-white'
                      : 'bg-[#F5F5F5] text-[#9A8B78] hover:bg-[#2A1F14] hover:text-white'
                  }`}
                >
                  <Lock size={11} />
                  {isAnonymous ? 'Posting anonymously' : 'Post anonymously'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting}
                  className="flex items-center gap-1.5 bg-[#D97706] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#B45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={12} />
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
              {error && (
                <p className="text-xs text-[#E11D48] mt-2">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/ComposePost.tsx
git commit -m "feat(community): add ComposePost component"
```

---

## Task 7: ExploreGroups Component

**Files:**
- Create: `src/app/dashboard/community/ExploreGroups.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/ExploreGroups.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import type { CommunityGroup } from '@/types'

interface Props {
  allGroups: CommunityGroup[]
  initialJoinedIds: string[]
}

export default function ExploreGroups({ allGroups, initialJoinedIds }: Props) {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set(initialJoinedIds))
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(groupId: string) {
    const isJoined = joinedIds.has(groupId)
    if (!isJoined && joinedIds.size >= 5) {
      setError('You can join a maximum of 5 groups.')
      return
    }
    setLoading(groupId)
    setError(null)
    const endpoint = isJoined
      ? '/api/community/groups/leave'
      : '/api/community/groups/join'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      })
      if (res.ok) {
        setJoinedIds(prev => {
          const next = new Set(prev)
          isJoined ? next.delete(groupId) : next.add(groupId)
          return next
        })
      } else {
        const json = await res.json() as { error?: string }
        setError(json.error ?? 'Action failed.')
      }
    } catch {
      setError('Failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const filtered = allGroups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 bg-white border border-[#EDDFCC] rounded-xl px-4 py-2.5 mb-4 shadow-sm">
        <Search size={16} className="text-[#9A8B78] flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search career cohorts..."
          className="flex-1 text-sm bg-transparent outline-none text-[#2A1F14] placeholder-[#9A8B78]"
        />
      </div>

      {/* Counter */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-2 mb-4">
        <Users size={13} />
        Joined {joinedIds.size} of 5 groups
      </div>

      {error && (
        <p className="text-xs text-[#E11D48] bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Group list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#9A8B78] text-sm">No groups found.</div>
        ) : (
          filtered.map(group => {
            const isJoined = joinedIds.has(group.id)
            const isLoading = loading === group.id
            return (
              <div
                key={group.id}
                className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                  isJoined ? 'border-[#059669] bg-[#F0FDF4]' : 'border-[#EDDFCC]'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-xl flex-shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#2A1F14] text-sm truncate">{group.name}</div>
                  <div className="text-xs text-[#9A8B78]">{group.member_count} members</div>
                </div>
                <button
                  onClick={() => handleToggle(group.id)}
                  disabled={isLoading || (!isJoined && joinedIds.size >= 5)}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                    isJoined
                      ? 'bg-[#F0FDF4] text-[#059669] border-2 border-[#059669] hover:bg-[#DCFCE7]'
                      : 'bg-[#D97706] text-white hover:bg-[#B45309]'
                  }`}
                >
                  {isLoading ? '...' : isJoined ? '✓ Joined' : 'Join'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/ExploreGroups.tsx
git commit -m "feat(community): add ExploreGroups component"
```

---

## Task 8: PostFeed Component

**Files:**
- Create: `src/app/dashboard/community/PostFeed.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/PostFeed.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import PostCard from './PostCard'
import ComposePost from './ComposePost'
import ExploreGroups from './ExploreGroups'
import type { CommunityPost, CommunityGroup } from '@/types'

type FeedTab = 'feed' | 'my_groups' | 'explore'

interface Props {
  initialFeedPosts: CommunityPost[]
  initialGroupPosts: CommunityPost[]
  likedPostIds: string[]
  currentUserId: string
  userInitial: string
  joinedGroups: CommunityGroup[]
  allGroups: CommunityGroup[]
  joinedGroupIds: string[]
}

export default function PostFeed({
  initialFeedPosts,
  initialGroupPosts,
  likedPostIds,
  userInitial,
  joinedGroups,
  allGroups,
  joinedGroupIds,
}: Props) {
  const [activeTab, setActiveTab] = useState<FeedTab>('feed')
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>(initialFeedPosts)
  const [groupPosts, setGroupPosts] = useState<CommunityPost[]>(initialGroupPosts)
  const [likedIds] = useState<Set<string>>(new Set(likedPostIds))

  function handleNewPost(post: CommunityPost) {
    if (post.group_id) {
      setGroupPosts(prev => [post, ...prev])
    } else {
      setFeedPosts(prev => [post, ...prev])
    }
  }

  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'feed',      label: 'Feed' },
    { id: 'my_groups', label: 'My Groups' },
    { id: 'explore',   label: 'Explore' },
  ]

  const activePosts = activeTab === 'feed' ? feedPosts : groupPosts

  return (
    <div>
      {/* Stories row — quick access to joined groups */}
      {joinedGroups.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {joinedGroups.map(group => (
            <Link
              key={group.id}
              href={`/dashboard/community/groups/${group.slug}`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div
                className="w-13 h-13 rounded-full p-[2.5px]"
                style={{ background: 'linear-gradient(135deg,#059669,#0284C7)' }}
              >
                <div className="w-full h-full rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-lg font-bold text-[#059669]">
                  {group.name.charAt(0)}
                </div>
              </div>
              <span className="text-xs text-[#5C4E3D] text-center w-14 truncate group-hover:text-[#D97706] transition-colors">
                {group.name.split(' → ')[1] ?? group.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#EDDFCC] mb-5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-[#D97706] border-[#D97706]'
                : 'text-[#9A8B78] border-transparent hover:text-[#5C4E3D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'explore' ? (
        <ExploreGroups allGroups={allGroups} initialJoinedIds={joinedGroupIds} />
      ) : (
        <div className="space-y-4">
          <ComposePost userInitial={userInitial} onPost={handleNewPost} />
          {activePosts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#EDDFCC] rounded-2xl">
              <p className="text-[#9A8B78] text-sm">
                {activeTab === 'my_groups'
                  ? 'No posts from your groups yet. Join groups and start the conversation.'
                  : 'No posts yet. Be the first to share something.'}
              </p>
            </div>
          ) : (
            activePosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                initialLiked={likedIds.has(post.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/PostFeed.tsx
git commit -m "feat(community): add PostFeed component with tabs and stories row"
```

---

## Task 9: Community Home Page

**Files:**
- Modify: `src/app/dashboard/community/page.tsx` (replace the placeholder entirely)

- [ ] **Step 1: Replace the community page**

Replace the entire contents of `src/app/dashboard/community/page.tsx` with:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PostFeed from './PostFeed'
import type { CommunityPost, CommunityGroup } from '@/types'

function sanitizePosts(posts: Record<string, unknown>[] | null): CommunityPost[] {
  return (posts ?? []).map(post => ({
    ...(post as CommunityPost),
    author_id: post.is_anonymous ? null : (post.author_id as string | null),
    profiles: post.is_anonymous ? null : (post.profiles as CommunityPost['profiles']),
  }))
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const [
    { data: allGroups },
    { data: memberships },
    { data: rawFeedPosts },
    { data: likedRows },
  ] = await Promise.all([
    supabase
      .from('community_groups')
      .select('*')
      .order('member_count', { ascending: false }),
    supabase
      .from('community_group_members')
      .select('group_id')
      .eq('user_id', user.id),
    supabase
      .from('community_posts')
      .select('*, profiles(full_name, stage_reached)')
      .is('group_id', null)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', user.id),
  ])

  const joinedGroupIdArray = (memberships ?? []).map(m => m.group_id as string)
  const joinedGroupIdSet = new Set(joinedGroupIdArray)
  const joinedGroups = (allGroups ?? []).filter(g => joinedGroupIdSet.has(g.id)) as CommunityGroup[]

  // Fetch posts from joined groups
  const { data: rawGroupPosts } = joinedGroupIdArray.length > 0
    ? await supabase
        .from('community_posts')
        .select('*, profiles(full_name, stage_reached)')
        .in('group_id', joinedGroupIdArray)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] as Record<string, unknown>[] }

  const feedPosts = sanitizePosts(rawFeedPosts as Record<string, unknown>[] | null)
  const groupPosts = sanitizePosts(rawGroupPosts as Record<string, unknown>[] | null)
  const likedPostIds = (likedRows ?? []).map(r => r.post_id as string)
  const userInitial = profile?.full_name?.[0]?.toUpperCase() ?? 'U'

  const suggestedGroups = (allGroups ?? [])
    .filter(g => !joinedGroupIdSet.has(g.id))
    .slice(0, 3) as CommunityGroup[]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-[#2A1F14]"
          style={{ fontFamily: 'var(--font-lora)' }}
        >
          Community
        </h1>
        <p className="text-[#9A8B78] mt-1">
          Ask anything. Share anything. Only people who get it.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6">
        {/* Main feed */}
        <div className="min-w-0">
          <PostFeed
            initialFeedPosts={feedPosts}
            initialGroupPosts={groupPosts}
            likedPostIds={likedPostIds}
            currentUserId={user.id}
            userInitial={userInitial}
            joinedGroups={joinedGroups}
            allGroups={(allGroups ?? []) as CommunityGroup[]}
            joinedGroupIds={joinedGroupIdArray}
          />
        </div>

        {/* Right sidebar — xl screens only */}
        <aside className="hidden xl:flex flex-col gap-4">
          {suggestedGroups.length > 0 && (
            <div className="bg-white border border-[#EDDFCC] rounded-2xl p-5">
              <h3 className="font-bold text-[#2A1F14] text-sm mb-4">🔥 Suggested Groups</h3>
              <div className="space-y-3">
                {suggestedGroups.map(group => (
                  <Link
                    key={group.id}
                    href={`/dashboard/community/groups/${group.slug}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-base flex-shrink-0 font-bold text-[#D97706]">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#2A1F14] truncate">{group.name}</div>
                      <div className="text-xs text-[#9A8B78]">{group.member_count} members</div>
                    </div>
                    <span className="text-xs text-[#D97706] font-bold flex-shrink-0">+ Join</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#EDDFCC] rounded-2xl p-5">
            <h3 className="font-bold text-[#2A1F14] text-sm mb-3">🏷️ Topics</h3>
            <div className="flex flex-wrap gap-2">
              {['Career Doubts', 'Transitions', 'Skill Building', 'Emotional Support', 'General'].map(t => (
                <span
                  key={t}
                  className="text-xs font-semibold px-3 py-1 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Start dev server and verify community page loads**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npm run dev
```

Open `http://localhost:3000/dashboard/community`. Expected:
- Page renders with "Community" heading
- Feed / My Groups / Explore tabs are visible
- No console errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/community/page.tsx
git commit -m "feat(community): implement community home page with feed and sidebar"
```

---

## Task 10: GroupResources Component

**Files:**
- Create: `src/app/dashboard/community/groups/[slug]/GroupResources.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/groups/[slug]/GroupResources.tsx`:

```typescript
import { type ReactNode } from 'react'
import { ExternalLink, BookOpen, Youtube, Mic, Users, FileText, Globe } from 'lucide-react'
import type { Resource, LaunchpadPhase } from '@/types'

const CATEGORY_ICONS: Record<string, ReactNode> = {
  'YouTube Channels': <Youtube size={14} />,
  'Podcasts':         <Mic size={14} />,
  'Free Courses':     <BookOpen size={14} />,
  'Books':            <FileText size={14} />,
  'Communities':      <Users size={14} />,
  'Government Portals': <Globe size={14} />,
  'Newsletters':      <FileText size={14} />,
}

interface Props {
  resources: Resource[]
  launchpadPhases: LaunchpadPhase[]
}

export default function GroupResources({ resources, launchpadPhases }: Props) {
  const hasResources = resources.length > 0
  const hasLaunchpad = launchpadPhases.length > 0

  if (!hasResources && !hasLaunchpad) {
    return (
      <div className="text-center py-16 text-[#9A8B78] text-sm">
        No resources added to this group yet.
      </div>
    )
  }

  // Group resources by category
  const byCategory: Record<string, Resource[]> = {}
  for (const r of resources) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  }

  return (
    <div className="space-y-6">
      {/* Launchpad phases */}
      {hasLaunchpad && (
        <div>
          <h3 className="font-bold text-[#2A1F14] mb-4" style={{ fontFamily: 'var(--font-lora)' }}>
            🗺️ 90-Day Launchpad
          </h3>
          <div className="space-y-3">
            {launchpadPhases.map(phase => (
              <div
                key={phase.phase}
                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {phase.phase}
                  </span>
                  <span className="font-bold text-[#2A1F14] text-sm">{phase.phase_title}</span>
                </div>
                <p className="text-xs text-[#5C4E3D] mb-3 leading-relaxed">
                  ✅ Milestone: {phase.phase_milestone}
                </p>
                <div className="space-y-1.5">
                  {phase.weeks.map(week => (
                    <div key={week.week} className="text-xs text-[#9A8B78]">
                      <span className="font-semibold text-[#5C4E3D]">Week {week.week}:</span>{' '}
                      {week.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized resources */}
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-bold text-[#2A1F14] mb-3 flex items-center gap-2 text-sm">
            <span className="text-[#D97706]">{CATEGORY_ICONS[category] ?? <BookOpen size={14} />}</span>
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((resource, i) => (
              <div
                key={i}
                className="bg-white border border-[#EDDFCC] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#2A1F14] text-sm mb-0.5">
                      {resource.title}
                    </div>
                    {resource.provider && (
                      <div className="text-xs text-[#9A8B78] mb-1">{resource.provider}</div>
                    )}
                    {resource.annotation && (
                      <p className="text-xs text-[#5C4E3D] leading-relaxed">{resource.annotation}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: resource.stage === 'Beginner' ? '#DCFCE7' : resource.stage === 'Advanced' ? '#FEE2E2' : '#FEF3C7',
                        color: resource.stage === 'Beginner' ? '#059669' : resource.stage === 'Advanced' ? '#E11D48' : '#D97706',
                      }}
                    >
                      {resource.stage}
                    </span>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9A8B78] hover:text-[#D97706] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/groups/
git commit -m "feat(community): add GroupResources component"
```

---

## Task 11: GroupMemberList Component

**Files:**
- Create: `src/app/dashboard/community/groups/[slug]/GroupMemberList.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/groups/[slug]/GroupMemberList.tsx`:

```typescript
import type { CommunityGroupMember } from '@/types'

interface Props {
  members: CommunityGroupMember[]
  totalCount: number
}

export default function GroupMemberList({ members, totalCount }: Props) {
  if (members.length === 0) {
    return (
      <div className="text-center py-16 text-[#9A8B78] text-sm">
        No members yet. Be the first to join!
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-[#9A8B78] mb-4">{totalCount} members total</p>
      <div className="space-y-2">
        {members.map(member => {
          const name = member.profiles?.full_name ?? 'Member'
          const initial = name[0]?.toUpperCase() ?? 'M'
          const stage = member.profiles?.stage_reached
          const joinedDate = new Date(member.joined_at).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric',
          })
          return (
            <div
              key={member.id}
              className="bg-white border border-[#EDDFCC] rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-[#D97706] to-[#EA580C]">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#2A1F14] text-sm">{name}</div>
                {stage && (
                  <div className="text-xs text-[#9A8B78]">{stage}</div>
                )}
              </div>
              <div className="text-xs text-[#9A8B78] flex-shrink-0">Joined {joinedDate}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/groups/[slug]/GroupMemberList.tsx
git commit -m "feat(community): add GroupMemberList component"
```

---

## Task 12: GroupTabs Component

**Files:**
- Create: `src/app/dashboard/community/groups/[slug]/GroupTabs.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/dashboard/community/groups/[slug]/GroupTabs.tsx`:

```typescript
'use client'

import { useState } from 'react'
import PostCard from '../../PostCard'
import ComposePost from '../../ComposePost'
import GroupResources from './GroupResources'
import GroupMemberList from './GroupMemberList'
import type { CommunityPost, CommunityGroupMember, Resource, LaunchpadPhase } from '@/types'

type GroupTab = 'discussion' | 'resources' | 'members'

interface Props {
  groupId: string
  posts: CommunityPost[]
  likedPostIdArray: string[]
  resources: Resource[]
  launchpadPhases: LaunchpadPhase[]
  members: CommunityGroupMember[]
  totalMemberCount: number
  userInitial: string
  isMember: boolean
}

export default function GroupTabs({
  groupId,
  posts: initialPosts,
  likedPostIdArray,
  resources,
  launchpadPhases,
  members,
  totalMemberCount,
  userInitial,
  isMember,
}: Props) {
  const [activeTab, setActiveTab] = useState<GroupTab>('discussion')
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [likedIds] = useState<Set<string>>(new Set(likedPostIdArray))

  function handleNewPost(post: CommunityPost) {
    setPosts(prev => [post, ...prev])
  }

  const tabs: { id: GroupTab; label: string }[] = [
    { id: 'discussion', label: 'Discussion' },
    { id: 'resources',  label: 'Resources' },
    { id: 'members',    label: `Members (${totalMemberCount})` },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#EDDFCC] mb-5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-[#D97706] border-[#D97706]'
                : 'text-[#9A8B78] border-transparent hover:text-[#5C4E3D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Discussion */}
      {activeTab === 'discussion' && (
        <div className="space-y-4">
          {isMember && (
            <ComposePost groupId={groupId} userInitial={userInitial} onPost={handleNewPost} />
          )}
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#EDDFCC] rounded-2xl">
              <p className="text-[#9A8B78] text-sm">
                {isMember
                  ? 'No posts yet. Start the conversation!'
                  : 'Join this group to see and post discussions.'}
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                initialLiked={likedIds.has(post.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Resources */}
      {activeTab === 'resources' && (
        <GroupResources resources={resources} launchpadPhases={launchpadPhases} />
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <GroupMemberList members={members} totalCount={totalMemberCount} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/groups/[slug]/GroupTabs.tsx
git commit -m "feat(community): add GroupTabs component with discussion/resources/members"
```

---

## Task 13: Group Detail Page

**Files:**
- Create: `src/app/dashboard/community/groups/[slug]/page.tsx`

- [ ] **Step 1: Create the group detail page**

Create `src/app/dashboard/community/groups/[slug]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import GroupTabs from './GroupTabs'
import type { CommunityPost, CommunityGroupMember, Resource, LaunchpadPhase } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

function sanitizePosts(posts: Record<string, unknown>[] | null): CommunityPost[] {
  return (posts ?? []).map(post => ({
    ...(post as CommunityPost),
    author_id: post.is_anonymous ? null : (post.author_id as string | null),
    profiles: post.is_anonymous ? null : (post.profiles as CommunityPost['profiles']),
  }))
}

export default async function GroupDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch group with career path data
  const { data: group } = await supabase
    .from('community_groups')
    .select('*, career_paths(title, resources, launchpad_phases)')
    .eq('slug', slug)
    .single()

  if (!group) notFound()

  const [
    { data: membership },
    { data: rawPosts },
    { data: likedRows },
    { data: members },
    { count: totalMemberCount },
  ] = await Promise.all([
    supabase
      .from('community_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('community_posts')
      .select('*, profiles(full_name, stage_reached)')
      .eq('group_id', group.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', user.id),
    supabase
      .from('community_group_members')
      .select('id, group_id, user_id, joined_at, profiles(id, full_name, stage_reached)')
      .eq('group_id', group.id)
      .order('joined_at', { ascending: false })
      .limit(20),
    supabase
      .from('community_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id),
  ])

  const isMember = !!membership
  const posts = sanitizePosts(rawPosts as Record<string, unknown>[] | null)
  const likedPostIdArray = (likedRows ?? []).map(r => r.post_id as string)
  const userInitial = profile?.full_name?.[0]?.toUpperCase() ?? 'U'

  const cp = group.career_paths as Record<string, unknown> | null
  const resources = (cp?.resources ?? []) as Resource[]
  const launchpadPhases = (cp?.launchpad_phases ?? []) as LaunchpadPhase[]

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/community"
        className="inline-flex items-center gap-1.5 text-sm text-[#9A8B78] hover:text-[#D97706] transition-colors mb-5 font-semibold"
      >
        <ArrowLeft size={15} />
        Community
      </Link>

      {/* Group header */}
      <div
        className="rounded-2xl p-6 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #D97706, #EA580C)' }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>
          {group.name}
        </h1>
        {group.description && (
          <p className="text-white/80 text-sm mb-3 leading-relaxed">{group.description}</p>
        )}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <Users size={14} />
            {group.member_count} members
          </div>
          {isMember && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              ✓ Joined
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <GroupTabs
        groupId={group.id}
        posts={posts}
        likedPostIdArray={likedPostIdArray}
        resources={resources}
        launchpadPhases={launchpadPhases}
        members={(members ?? []) as CommunityGroupMember[]}
        totalMemberCount={totalMemberCount ?? 0}
        userInitial={userInitial}
        isMember={isMember}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Start dev server and verify the full flow**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npm run dev
```

Manual checks:
1. Open `http://localhost:3000/dashboard/community` — community home loads, tabs visible
2. Click "Explore" tab — groups list renders, Join button works
3. Join a group — counter updates to "Joined 1 of 5 groups"
4. Click the group in the stories row — navigates to `/dashboard/community/groups/[slug]`
5. Group detail page loads with Discussion / Resources / Members tabs
6. Type a post in compose box, click Post — post appears at top of feed
7. Click the heart on a post — like count updates optimistically
8. Post anonymously — post shows "Anonymous" instead of your name
9. Try joining a 6th group — error message: "You can join a maximum of 5 groups."

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/community/groups/[slug]/page.tsx
git commit -m "feat(community): implement group detail page with full tabs"
```

---

## Task 14: Final Verification and Deploy

- [ ] **Step 1: Full TypeScript check**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 2: Build check**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no TypeScript or ESLint errors.

- [ ] **Step 3: Deploy to Vercel preview**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z && vercel
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(community): complete community section — feed, groups, posts, likes"
```
