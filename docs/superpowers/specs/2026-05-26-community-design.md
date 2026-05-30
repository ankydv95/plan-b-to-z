# Community Section — Design Spec

## Goal

Build the Community section of Plan B to Z: a social space for ex-UPSC aspirants to share experiences on a global feed and connect with peers in career-specific cohort groups.

## Architecture

Approach B — Posts + Cohort Groups. Two core tables (`community_posts`, `community_groups`) with a join table (`community_group_members`). Resources inside groups are pulled from existing `career_paths` JSONB columns — no new data to maintain. Global feed and group feeds share one posts table, differentiated by a nullable `group_id`.

## Tech Stack

Next.js App Router (server + client components), Supabase (auth, DB, RLS), TypeScript strict, Tailwind CSS v4, lucide-react icons.

---

## Features

### 1. Global Feed

- Displayed on `/dashboard/community` under the "Feed" tab
- All authenticated users can read posts; only authenticated users can post
- Posts have a **tag**: `career_doubts`, `transition_story`, `skill_building`, `emotional_support`, `general`
- Posts can be **liked** (one like per user, toggle)
- Posts support **one-level replies** (no nested threading in v1)

### 2. Anonymous Posting

- Every post has an **anonymous toggle** (off by default — named by default)
- `is_anonymous` is stored per post, not per user
- When `is_anonymous = true`, the UI renders "Anonymous" with a grey avatar; the real `author_id` is stored in the DB for moderation purposes only
- Anonymity is enforced **server-side**: the API never returns `author_id` for anonymous posts to non-admin users

### 3. Cohort Groups

- One group per career path, created by admin when adding/editing a career path in the admin panel
- Users can join up to **5 groups** maximum — enforced server-side in the join API route
- Users manually browse and join groups from the Explore tab
- Joining/leaving is instant with optimistic UI update

### 4. Group Detail (`/dashboard/community/groups/[slug]`)

Three tabs inside each group:

**Discussion tab**
- Group-scoped post feed (posts with `group_id = this group`)
- Same compose box as global feed, same anonymous toggle
- Same like/reply mechanics

**Resources tab**
- Pulls data from `career_paths.launchpad_phases` JSONB (90-day plan phases and tasks)
- Pulls data from `career_paths.resources` JSONB (courses, books, communities, etc.)
- Read-only, no new DB table required

**Members tab**
- Lists all users in `community_group_members` joined with `profiles`
- Shows: avatar, name, stage reached (e.g. "Mains 2022"), join date
- No messaging in v1

### 5. Explore Groups (`?tab=explore` on community home)

- Browse all `community_groups` with member count and daily post count
- Filter chips by career domain (Technology, Law, Consulting, Finance, Education, etc.)
- Search bar filters by group name
- "Joined X of 5 groups" counter always visible
- Join/leave buttons with instant feedback

---

## Layout

### Desktop (≥ md breakpoint) — 3-column

| Left sidebar (220px) | Main feed (flex-1) | Right sidebar (260px) |
|---|---|---|
| Community nav (Feed / My Groups / Explore) | Feed tabs + compose + post cards | Suggested groups |
| My Groups list | | Trending topics |
| Tag filters | | Profile completion nudge (if assessment not done) |

### Mobile (< md) — Single column

- Instagram-style stories row at top for quick group switching
- Feed / My Groups / Explore tabs below stories
- Full-width post cards
- Floating compose button (optional v2 enhancement)

---

## Data Model

### `community_groups`
```sql
id              uuid primary key default gen_random_uuid()
career_path_id  uuid references career_paths(id) on delete cascade
name            text not null
slug            text not null unique
description     text
member_count    int default 0   -- cached, incremented/decremented in join/leave API routes
created_at      timestamptz default now()
```

### `community_group_members`
```sql
id          uuid primary key default gen_random_uuid()
group_id    uuid references community_groups(id) on delete cascade
user_id     uuid references profiles(id) on delete cascade
joined_at   timestamptz default now()
unique (group_id, user_id)
```

### `community_posts`
```sql
id            uuid primary key default gen_random_uuid()
author_id     uuid references profiles(id) on delete set null
group_id      uuid references community_groups(id) on delete cascade  -- null = global feed
parent_id     uuid references community_posts(id) on delete cascade   -- null = top-level post
content       text not null
is_anonymous  boolean default false
tag           text check (tag in ('career_doubts','transition_story','skill_building','emotional_support','general'))
likes_count   int default 0   -- cached
replies_count int default 0   -- cached
created_at    timestamptz default now()
```

### `community_post_likes`
```sql
id         uuid primary key default gen_random_uuid()
post_id    uuid references community_posts(id) on delete cascade
user_id    uuid references profiles(id) on delete cascade
created_at timestamptz default now()
unique (post_id, user_id)
```

---

## RLS Policies

| Table | Read | Insert | Delete |
|---|---|---|---|
| `community_groups` | All authenticated users | Admin only | Admin only |
| `community_group_members` | All authenticated users | Own rows only | Own rows only |
| `community_posts` | All authenticated users | Own rows only | Own rows only |
| `community_post_likes` | All authenticated users | Own rows only | Own rows only |

**Anonymous post enforcement:** The API route strips `author_id` from the response payload for posts where `is_anonymous = true` unless the requesting user has `role = 'admin'`.

**Max 5 groups:** Enforced in the `/api/community/groups/join` route handler before INSERT. Returns 400 if user already has 5 memberships.

---

## Pages & Components

### Routes
```
/dashboard/community                    CommunityPage (server)
/dashboard/community/groups/[slug]      GroupDetailPage (server)
```

### Component Breakdown

| Component | Type | Responsibility |
|---|---|---|
| `CommunityPage` | Server | Fetch user's groups + initial posts, render layout |
| `PostFeed` | Client | Infinite scroll, optimistic likes, compose trigger |
| `PostCard` | Client | Render post, like toggle, reply count |
| `ComposePost` | Client | Text input, tag picker, anonymous toggle, submit |
| `GroupSidebar` | Server | Left sidebar — nav, my groups list, tag filters |
| `SuggestedGroups` | Server | Right sidebar — suggested + trending |
| `GroupDetailPage` | Server | Fetch group + initial posts, render group header |
| `GroupTabs` | Client | Discussion / Resources / Members tab switching |
| `GroupMemberList` | Server | Members list from DB |
| `GroupResources` | Server | Pull launchpad + resources from career_paths |
| `ExploreGroups` | Client | Search + filter chips + join/leave |

---

## API Routes

```
POST   /api/community/posts              Create post (global or group)
POST   /api/community/posts/[id]/like    Toggle like
POST   /api/community/groups/join        Join a group (enforces max 5)
POST   /api/community/groups/leave       Leave a group
```

All routes: server-side auth check, input validation, no console.log.

---

## Out of Scope (v1)

- Mentor matching (accessible via career detail pages already)
- Real-time notifications / Supabase Realtime subscriptions
- Nested reply threading (max 1 level in v1)
- DMs or private messaging
- Post editing
- Admin moderation UI (admin can query DB directly for now)
- Weekly cohort challenges or structured batch programs
