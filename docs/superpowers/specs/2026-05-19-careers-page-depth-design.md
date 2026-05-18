# Design Spec: Career Page Depth Upgrade
**Date:** 2026-05-19
**Scope:** Career detail page — 90-Day Launchpad, Mentors section, Resources library
**Status:** Approved

---

## 1. Problem

The career detail page has solid structure but shallow content. The 90-Day Launchpad has vague week-level tasks. Resources are raw link dumps with no context. There is no human touchpoint. A user landing on a career page today cannot confidently answer: "What do I do first?" or "Who do I talk to?"

---

## 2. Goals

- The launchpad should give a user a clear, specific action for every week of their first 90 days
- Resources should tell the user what to consume, in what order, and why
- Every career page should have at least one real human a user can reach out to
- Admin should be able to create/edit this content efficiently with AI assistance

---

## 3. Upgrade 1 — 90-Day Launchpad (Phased + Specific)

### Current schema
```json
launchpad_weeks: [{ week, title, tasks: string[] }]
```

### New schema
```json
launchpad_phases: [
  {
    phase: 1,
    phase_title: "Foundation",
    phase_milestone: "You understand the field, have your tools set up, and have made first contact with the community.",
    weeks: [
      {
        week: 1,
        title: "Understand the Landscape",
        tasks: [
          { task: "Read the NITI Aayog's 'Strategy for New India' — Chapter 3 (policy context)", resource_url: "https://..." },
          { task: "Join the India Policy Watch LinkedIn group and follow 5 active policy professionals" },
          { task: "Watch the 'Day in the Life of a Policy Analyst' video in your Resources tab" }
        ]
      }
    ]
  }
]
```

### 3 Phases
| Phase | Name | Weeks | Milestone |
|-------|------|-------|-----------|
| 1 | Foundation | 1–4 | Understands the field, tools set up, first community contact made |
| 2 | Build | 5–9 | Has a portfolio artifact, has done at least one informational interview, applied to first role |
| 3 | Apply | 10–13 | Actively interviewing, resume reviewed, referrals sought |

### Rules for task quality
- Every task is specific and completable in under 2 hours
- Tasks that reference a resource link to it directly (URL in task object)
- No task uses vague language: "explore", "research the field", "look into options" are banned
- Gemini generates the initial content; admin reviews and edits before saving

### UI change
- Phase header with milestone callout card at the top of each phase
- Weeks accordion within each phase (existing accordion pattern preserved)
- Tasks that have a `resource_url` render as a link, not plain text

---

## 4. Upgrade 2 — Mentors Section (New Tab)

### New tab
Added as tab index 5, shifting Jobs → 6, Resources → 7, Stories → 8.
Tab label: **Mentors**

### Mentor card content
| Field | Description |
|-------|-------------|
| `name` | Full name or alias |
| `role` | Current job title |
| `company` | Current employer |
| `upsc_background` | e.g., "4 attempts, Interview stage" |
| `bio` | 1–2 sentence statement on how they help |
| `photo_url` | Optional headshot |
| `linkedin_url` | Optional |
| `is_active` | Boolean — controls visibility |

### "Book a call" flow
- Button opens a modal (not a new page)
- Modal form: Name, Email, Brief message (textarea)
- On submit: sends email to Ankit via a `/api/mentor-inquiry` POST route using **Resend** (default for Vercel/Next.js — confirm if a different email provider is already configured)
- Email subject: `[Plan B to Z] Mentor inquiry — {mentor_name} ({career_title})`
- Success state: "We've received your request. Ankit will connect you within 48 hours."
- No in-app scheduling, no Calendly dependency

### DB: new table `career_mentors`
```sql
create table career_mentors (
  id uuid primary key default gen_random_uuid(),
  career_id uuid references career_paths(id) on delete cascade,
  name text not null,
  role text not null,
  company text,
  upsc_background text,
  bio text,
  photo_url text,
  linkedin_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

RLS: public read where `is_active = true`. Admin full access.

### Admin
New "Mentors" tab in the CareerForm (7-tab form → 8-tab). Fields map 1:1 to the table. No AI assist — manual entry only. Admin can add multiple mentors per career, toggle active status.

---

## 5. Upgrade 3 — Resources Library (Annotated, Categorized, Stage-Tagged)

### Current schema
Two separate fields: `youtube_links: [{url, title, channel}]`, `podcast_links: [{url, title, host}]`

### New unified schema
```json
resources: [
  {
    category: "YouTube Channels",
    title: "PRS Legislative Research",
    url: "https://youtube.com/...",
    annotation: "Start here — best plain-language breakdown of Indian policy and bills",
    stage: "Beginner",
    provider: "PRS India"
  }
]
```

### Categories (ordered as displayed)
1. YouTube Channels
2. Podcasts
3. Free Courses
4. Books
5. Newsletters
6. Communities (LinkedIn groups, Discord, Slack, WhatsApp)
7. Government Portals

### Stage tags
- **Beginner** — orientation, no prior domain knowledge needed
- **Intermediate** — assumes basic familiarity, builds depth
- **Advanced** — for serious practitioners, dense or technical

### Annotation rules
- Every resource must have an annotation — no blank entries
- Annotation explains: what it is + why it's useful for this specific career path
- Gemini generates initial set; admin reviews before saving
- Minimum 3 resources per category for major categories (YT, Courses, Communities)

### UI change
- Resources tab shows categories as section headers
- Each resource card shows: title, provider/channel, stage badge (color-coded: green/amber/purple), annotation text, external link
- Filter bar at top: All | Beginner | Intermediate | Advanced

### DB change
- Deprecate `youtube_links` and `podcast_links` columns
- Add `resources` JSONB column to `career_paths` table
- Migration: transform existing data into new format before removing old columns

---

## 6. Admin Changes Summary

| Area | Change |
|------|--------|
| CareerForm | Add "Mentors" tab (manual) |
| CareerForm — Launchpad tab | Replace week editor with phase + week editor; Gemini generates phased content |
| CareerForm — Resources tab | Replace separate YT/podcast fields with unified resource editor; Gemini generates initial set |
| New API route | `/api/mentor-inquiry` — POST, sends email to Ankit |

---

## 7. DB Migration Plan

1. Add `career_mentors` table (new, no migration risk)
2. Add `launchpad_phases` JSONB column to `career_paths` (additive)
3. Add `resources` JSONB column to `career_paths` (additive)
4. Backfill `launchpad_phases` from `launchpad_weeks` via migration script
5. Backfill `resources` from `youtube_links` + `podcast_links` via migration script
6. After admin has verified all careers: drop `launchpad_weeks`, `youtube_links`, `podcast_links` columns (separate step, explicit confirmation required)

---

## 8. Out of Scope

- In-app calendar/scheduling for mentors
- User ability to submit themselves as mentors
- Resource ratings or user-generated annotations
- Progress tracking on launchpad tasks (no checkboxes saved to DB)

---

## 9. Files Affected

| File | Change |
|------|--------|
| `src/app/dashboard/careers/[slug]/CareerDetail.tsx` | Add Mentors tab, update Launchpad + Resources tabs |
| `src/app/admin/careers/CareerForm.tsx` | Add Mentors tab, update Launchpad + Resources editors |
| `src/types/index.ts` | Update `CareerPath` type, add `Mentor` type |
| `src/app/api/mentor-inquiry/route.ts` | New file — POST handler, sends email |
| `src/app/dashboard/careers/[slug]/page.tsx` | Fetch mentors from DB alongside career |
| Supabase | New table, new columns, migration script |
