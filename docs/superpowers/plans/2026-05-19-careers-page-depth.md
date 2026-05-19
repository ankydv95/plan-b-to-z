# Career Page Depth Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade each career detail page with a phased 90-Day Launchpad, an annotated/categorized Resources library, and a Mentors section with a contact-form inquiry flow.

**Architecture:** Three additive content upgrades to `CareerDetail.tsx` backed by two new JSONB columns on `career_paths` (`launchpad_phases`, `resources`) and a new `career_mentors` table. Admin CareerForm gains three updated/new tabs. AI generation is updated for the new schemas. Mentor inquiries are routed through `/api/mentor-inquiry` using Resend and delivered to `planbtoz95@gmail.com`.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (server + RLS), Gemini (`gemini-2.5-flash`), Resend (new dependency), Tailwind CSS v4, lucide-react.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| Supabase SQL editor | Run SQL | Add `career_mentors` table + new columns on `career_paths` |
| `src/types/index.ts` | Modify | Add `LaunchpadTask`, `LaunchpadPhaseWeek`, `LaunchpadPhase`, `Resource`, `Mentor` types; update `CareerPath` |
| `src/app/api/mentor-inquiry/route.ts` | Create | POST — sends mentor inquiry email via Resend |
| `src/app/api/admin/mentors/route.ts` | Create | GET (by careerId) + POST (create mentor) |
| `src/app/api/admin/mentors/[id]/route.ts` | Create | PUT (update) + DELETE |
| `src/app/api/admin/ai-generate/route.ts` | Modify | Update `launchpad` and `resources` prompts to new schemas |
| `src/app/admin/careers/CareerForm.tsx` | Modify | New phased LaunchpadTab, unified ResourcesTab, new MentorsTab; update TABS + emptyForm + imports |
| `src/app/admin/careers/[id]/page.tsx` | Modify | Fetch mentors from DB, pass as prop to CareerForm |
| `src/app/dashboard/careers/[slug]/page.tsx` | Modify | Fetch mentors from `career_mentors`, pass to CareerDetail |
| `src/app/dashboard/careers/[slug]/CareerDetail.tsx` | Modify | Updated Launchpad tab (phased), updated Resources tab (categorized), new Mentors tab + inquiry modal |

---

## Task 1: Database Schema

**Files:**
- Supabase dashboard → SQL Editor (no local file)

- [ ] **Step 1: Run the following SQL in the Supabase SQL Editor**

```sql
-- New table: career_mentors
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

-- New JSONB columns on career_paths (additive — do NOT drop existing columns yet)
alter table career_paths add column if not exists launchpad_phases jsonb;
alter table career_paths add column if not exists resources jsonb;
```

- [ ] **Step 2: Verify in Supabase Table Editor**

Check that:
- `career_mentors` table exists with all 11 columns
- `career_paths` table has `launchpad_phases` and `resources` columns (nullable, no default)

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add new interfaces and update CareerPath**

Open `src/types/index.ts`. Replace the `LaunchpadWeek` interface and add the new types. The final file should look like this (keep all existing interfaces unchanged except as noted):

Replace:
```typescript
export interface LaunchpadWeek {
  week: number
  title: string
  tasks: string[]
}
```

With:
```typescript
export interface LaunchpadWeek {
  week: number
  title: string
  tasks: string[]
}

export interface LaunchpadTask {
  task: string
  resource_url?: string
}

export interface LaunchpadPhaseWeek {
  week: number
  title: string
  tasks: LaunchpadTask[]
}

export interface LaunchpadPhase {
  phase: number
  phase_title: string
  phase_milestone: string
  weeks: LaunchpadPhaseWeek[]
}

export interface Resource {
  category: string
  title: string
  url: string
  annotation: string
  stage: string
  provider?: string
}

export interface Mentor {
  id: string
  career_id: string
  name: string
  role: string
  company: string | null
  upsc_background: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  is_active: boolean
  created_at: string
}
```

Then in the `CareerPath` interface, add two new fields after `launchpad_weeks`:
```typescript
  launchpad_phases: LaunchpadPhase[] | null
  resources: Resource[] | null
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z
npx tsc --noEmit
```

Expected: no errors related to the new types. Ignore pre-existing errors if any.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add LaunchpadPhase, Resource, Mentor types to CareerPath"
```

---

## Task 3: Install Resend + Mentor Inquiry API

**Files:**
- Create: `src/app/api/mentor-inquiry/route.ts`

- [ ] **Step 1: Install Resend**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z
npm install resend
```

Expected output: `added 1 package` (or similar).

- [ ] **Step 2: Add RESEND_API_KEY to .env.local**

Get a free API key from resend.com (sign up if needed). Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Resend's free tier requires you to verify a domain to send FROM a custom email. Until then, use `onboarding@resend.dev` as the `from` address (Resend provides this for testing). Switch to `noreply@planbtoz.in` (or whatever domain you own) once domain is verified in Resend dashboard.

- [ ] **Step 3: Create the API route**

Create `src/app/api/mentor-inquiry/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { mentorName, careerTitle, senderName, senderEmail, message } =
      await request.json() as {
        mentorName: string
        careerTitle: string
        senderName: string
        senderEmail: string
        message: string
      }

    if (!senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Plan B to Z <onboarding@resend.dev>',
      to: 'planbtoz95@gmail.com',
      replyTo: senderEmail,
      subject: `[Plan B to Z] Mentor inquiry — ${mentorName} (${careerTitle})`,
      html: `
        <h2>New Mentor Inquiry</h2>
        <p><strong>Mentor requested:</strong> ${mentorName}</p>
        <p><strong>Career path:</strong> ${careerTitle}</p>
        <hr />
        <p><strong>From:</strong> ${senderName}</p>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor inquiry error:', error)
    return NextResponse.json({ error: 'Failed to send inquiry.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Test the route manually**

Start the dev server (`npm run dev`) and run in a new terminal:

```bash
curl -X POST http://localhost:3000/api/mentor-inquiry \
  -H "Content-Type: application/json" \
  -d '{"mentorName":"Test Mentor","careerTitle":"Policy Analyst","senderName":"Test User","senderEmail":"test@example.com","message":"Hello, I would like to connect."}'
```

Expected: `{"success":true}` and an email in `planbtoz95@gmail.com` inbox.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/api/mentor-inquiry/route.ts
git commit -m "feat: add mentor inquiry API route using Resend"
```

---

## Task 4: Admin Mentors CRUD API

**Files:**
- Create: `src/app/api/admin/mentors/route.ts`
- Create: `src/app/api/admin/mentors/[id]/route.ts`

- [ ] **Step 1: Create the collection route**

Create `src/app/api/admin/mentors/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'editor'].includes(profile.role ?? '')) return { user: null, supabase }
  return { user, supabase }
}

// GET /api/admin/mentors?careerId=xxx
export async function GET(request: Request) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const careerId = searchParams.get('careerId')
  if (!careerId) return NextResponse.json({ error: 'careerId is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('career_mentors')
    .select('*')
    .eq('career_id', careerId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/admin/mentors
export async function POST(request: Request) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { career_id, name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active } = body

  if (!career_id || !name?.trim() || !role?.trim()) {
    return NextResponse.json({ error: 'career_id, name, and role are required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_mentors')
    .insert({ career_id, name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active: is_active ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
```

- [ ] **Step 2: Create the item route**

Create `src/app/api/admin/mentors/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'editor'].includes(profile.role ?? '')) return { user: null, supabase }
  return { user, supabase }
}

// PUT /api/admin/mentors/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active } = body

  const { data, error } = await supabase
    .from('career_mentors')
    .update({ name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/admin/mentors/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('career_mentors').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify routes load**

With dev server running, visit `/api/admin/mentors?careerId=anything` while logged in as admin. Expected: `{"data":[]}` (empty array, no 500 errors).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/mentors/route.ts "src/app/api/admin/mentors/[id]/route.ts"
git commit -m "feat: admin mentors CRUD API routes"
```

---

## Task 5: Update AI Generate Prompts

**Files:**
- Modify: `src/app/api/admin/ai-generate/route.ts`

- [ ] **Step 1: Replace the `launchpad` and `resources` prompts**

In `src/app/api/admin/ai-generate/route.ts`, replace the `launchpad` and `resources` entries in `TAB_PROMPTS`:

Replace:
```typescript
  launchpad: (title) => `Generate a 90-day launchpad plan for someone transitioning into "${title}" from UPSC preparation in India.
Return ONLY valid JSON:
{
  "launchpad_weeks": [
    { "week": 1, "title": "Week 1 theme", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 2, "title": "Week 2 theme", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 4, "title": "Month 1 milestone", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 8, "title": "Month 2 milestone", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 12, "title": "90-day goal", "tasks": ["task 1", "task 2", "task 3"] }
  ],
  "courses": [
    { "name": "Course name", "provider": "Coursera/Udemy/etc", "url": "", "cost": "Free or ₹X", "duration": "X weeks" }
  ],
  "portfolio_projects": ["project 1", "project 2", "project 3"]
}`,

  resources: (title) => `Generate learning resources for "${title}" relevant to the Indian context.
Return ONLY valid JSON:
{
  "youtube_links": [
    { "title": "Video title", "url": "https://youtube.com", "channel": "Channel name" }
  ],
  "podcast_links": [
    { "title": "Podcast episode title", "url": "https://", "host": "Host name" }
  ],
  "professional_associations": ["Association 1", "Association 2", "Association 3"]
}`,
```

With:
```typescript
  launchpad: (title) => `Generate a detailed 90-day phased launchpad plan for someone transitioning into "${title}" from UPSC preparation in India.

Rules:
- Every task must be specific and completable in under 2 hours. No vague tasks like "explore the field" or "research options".
- Use action verbs: "Read X", "Join Y group", "Apply to Z", "Message one person who works as..."
- Where a task involves a specific resource, include a real URL if known (leave empty string if not certain).
- Phase 1 (Foundation) covers weeks 1-4. Phase 2 (Build) covers weeks 5-9. Phase 3 (Apply) covers weeks 10-13.
- Each phase has a milestone that is a concrete outcome the person can verify.

Return ONLY valid JSON:
{
  "launchpad_phases": [
    {
      "phase": 1,
      "phase_title": "Foundation",
      "phase_milestone": "Concrete verifiable outcome after 4 weeks — what has the person done/built/connected?",
      "weeks": [
        {
          "week": 1,
          "title": "Week theme",
          "tasks": [
            { "task": "Specific actionable task", "resource_url": "" },
            { "task": "Specific actionable task", "resource_url": "" },
            { "task": "Specific actionable task", "resource_url": "" }
          ]
        },
        {
          "week": 2,
          "title": "Week theme",
          "tasks": [
            { "task": "Specific actionable task", "resource_url": "" },
            { "task": "Specific actionable task", "resource_url": "" },
            { "task": "Specific actionable task", "resource_url": "" }
          ]
        },
        {
          "week": 3,
          "title": "Week theme",
          "tasks": [
            { "task": "Specific actionable task", "resource_url": "" },
            { "task": "Specific actionable task", "resource_url": "" }
          ]
        },
        {
          "week": 4,
          "title": "Week theme",
          "tasks": [
            { "task": "Specific actionable task", "resource_url": "" },
            { "task": "Specific actionable task", "resource_url": "" }
          ]
        }
      ]
    },
    {
      "phase": 2,
      "phase_title": "Build",
      "phase_milestone": "Concrete verifiable outcome after 9 weeks",
      "weeks": [
        { "week": 5, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 6, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 7, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 8, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 9, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] }
      ]
    },
    {
      "phase": 3,
      "phase_title": "Apply",
      "phase_milestone": "Concrete verifiable outcome after 13 weeks",
      "weeks": [
        { "week": 10, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 11, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 12, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] },
        { "week": 13, "title": "Week theme", "tasks": [{ "task": "...", "resource_url": "" }, { "task": "...", "resource_url": "" }] }
      ]
    }
  ],
  "courses": [
    { "name": "Course name", "provider": "Coursera/Udemy/NIIT/etc", "url": "", "cost": "Free or ₹X", "duration": "X weeks" }
  ],
  "portfolio_projects": ["specific project idea 1", "specific project idea 2", "specific project idea 3"]
}`,

  resources: (title) => `Generate a comprehensive, annotated resource library for "${title}" in the Indian context. This is for ex-UPSC aspirants transitioning careers.

Rules:
- Every resource MUST have an annotation explaining: what it is AND why it is specifically useful for someone entering this field.
- Stage tags: Beginner = no prior domain knowledge needed, Intermediate = builds on basics, Advanced = practitioner-level.
- Be exhaustive — generate at least 3-4 resources per category where they exist for this field.
- Categories: YouTube Channels, Podcasts, Free Courses, Books, Newsletters, Communities, Government Portals.
- Only include categories that are genuinely relevant for this specific career.
- For URLs: include real URLs where you are confident they are correct. Use empty string if unsure.

Return ONLY valid JSON:
{
  "resources": [
    {
      "category": "YouTube Channels",
      "title": "Channel or video name",
      "url": "https://youtube.com/...",
      "annotation": "Why this is useful and what the user should do with it",
      "stage": "Beginner",
      "provider": "Channel name or organization"
    },
    {
      "category": "Podcasts",
      "title": "Podcast name",
      "url": "https://...",
      "annotation": "Why this is useful",
      "stage": "Intermediate",
      "provider": "Host or network"
    },
    {
      "category": "Free Courses",
      "title": "Course name",
      "url": "https://...",
      "annotation": "Why this is useful",
      "stage": "Beginner",
      "provider": "Coursera / SWAYAM / etc"
    },
    {
      "category": "Books",
      "title": "Book title and author",
      "url": "",
      "annotation": "Why this book specifically matters for this career path",
      "stage": "Intermediate",
      "provider": "Author name"
    },
    {
      "category": "Newsletters",
      "title": "Newsletter name",
      "url": "https://...",
      "annotation": "What it covers and why subscribe",
      "stage": "Beginner",
      "provider": "Publisher"
    },
    {
      "category": "Communities",
      "title": "Community name",
      "url": "https://...",
      "annotation": "Who is in this community and what value it provides",
      "stage": "Beginner",
      "provider": "LinkedIn / WhatsApp / Discord"
    },
    {
      "category": "Government Portals",
      "title": "Portal name",
      "url": "https://...",
      "annotation": "What data/info lives here and how to use it",
      "stage": "Beginner",
      "provider": "Government of India / State"
    }
  ]
}`,
```

- [ ] **Step 2: Verify the route still works**

With dev server running, log in as admin, open any career in the admin form, go to the Launchpad tab, click "AI Fill Tab". Expected: JSON with `launchpad_phases` array is returned (check browser Network tab — response body should have the new structure).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/ai-generate/route.ts
git commit -m "feat: update AI generate prompts for phased launchpad and annotated resources"
```

---

## Task 6: Admin CareerForm — Phased LaunchpadTab

**Files:**
- Modify: `src/app/admin/careers/CareerForm.tsx`

This task replaces the `LaunchpadTab` function. The course editor within LaunchpadTab stays identical.

- [ ] **Step 1: Add new type imports at the top of CareerForm.tsx**

Change the import line from:
```typescript
import type { CareerPath, TrajectoryStage, LaunchpadWeek, Course, YoutubeLink, PodcastLink } from '@/types'
```
To:
```typescript
import type { CareerPath, TrajectoryStage, LaunchpadWeek, LaunchpadPhase, LaunchpadPhaseWeek, LaunchpadTask, Course, YoutubeLink, PodcastLink, Resource } from '@/types'
```

- [ ] **Step 2: Update emptyForm() to include new fields**

In `emptyForm()`, after `launchpad_weeks: []`, add:
```typescript
    launchpad_phases: [],
    resources: [],
```

- [ ] **Step 3: Replace the LaunchpadTab function**

Find the existing `function LaunchpadTab(...)` and replace the entire function (lines 309–417) with:

```typescript
function LaunchpadTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const phases = (form.launchpad_phases ?? []) as LaunchpadPhase[]
  const courses = form.courses ?? []
  const [openPhase, setOpenPhase] = useState<number | null>(0)
  const [openWeek, setOpenWeek] = useState<{ p: number; w: number } | null>(null)

  function addPhase() {
    const newPhase: LaunchpadPhase = {
      phase: phases.length + 1,
      phase_title: ['Foundation', 'Build', 'Apply'][phases.length] ?? `Phase ${phases.length + 1}`,
      phase_milestone: '',
      weeks: [],
    }
    set('launchpad_phases', [...phases, newPhase])
    setOpenPhase(phases.length)
  }

  function updatePhase(pi: number, key: keyof LaunchpadPhase, value: unknown) {
    set('launchpad_phases', phases.map((p, i) => i === pi ? { ...p, [key]: value } : p))
  }

  function removePhase(pi: number) {
    set('launchpad_phases', phases.filter((_, i) => i !== pi))
  }

  function addWeek(pi: number) {
    const updated = phases.map((p, i) => {
      if (i !== pi) return p
      const newWeek: LaunchpadPhaseWeek = { week: p.weeks.length + 1, title: '', tasks: [] }
      return { ...p, weeks: [...p.weeks, newWeek] }
    })
    set('launchpad_phases', updated)
    setOpenWeek({ p: pi, w: phases[pi].weeks.length })
  }

  function updateWeek(pi: number, wi: number, key: keyof LaunchpadPhaseWeek, value: unknown) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return { ...p, weeks: p.weeks.map((w, j) => j === wi ? { ...w, [key]: value } : w) }
    }))
  }

  function removeWeek(pi: number, wi: number) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return { ...p, weeks: p.weeks.filter((_, j) => j !== wi) }
    }))
  }

  function addTask(pi: number, wi: number) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p, weeks: p.weeks.map((w, j) => {
          if (j !== wi) return w
          return { ...w, tasks: [...w.tasks, { task: '', resource_url: '' }] }
        }),
      }
    }))
  }

  function updateTask(pi: number, wi: number, ti: number, key: keyof LaunchpadTask, value: string) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p, weeks: p.weeks.map((w, j) => {
          if (j !== wi) return w
          return { ...w, tasks: w.tasks.map((t, k) => k === ti ? { ...t, [key]: value } : t) }
        }),
      }
    }))
  }

  function removeTask(pi: number, wi: number, ti: number) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p, weeks: p.weeks.map((w, j) => {
          if (j !== wi) return w
          return { ...w, tasks: w.tasks.filter((_, k) => k !== ti) }
        }),
      }
    }))
  }

  // Course handlers (unchanged)
  const [openCourse, setOpenCourse] = useState<number | null>(null)
  function addCourse() {
    set('courses', [...courses, { name: '', provider: '', url: '', cost: '', duration: '' }])
    setOpenCourse(courses.length)
  }
  function updateCourse(i: number, key: keyof Course, value: string) {
    set('courses', courses.map((c, j) => j === i ? { ...c, [key]: value } : c))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-lora)' }}>90-Day Phases</h3>
          <span className="text-xs text-[#9A8B78]">Recommended: 3 phases — Foundation, Build, Apply</span>
        </div>
        <div className="space-y-3">
          {phases.map((phase, pi) => (
            <div key={pi} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
              {/* Phase header */}
              <button type="button" onClick={() => setOpenPhase(openPhase === pi ? null : pi)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FDF6EC] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center">{phase.phase}</span>
                  <span className="font-bold text-sm">{phase.phase_title || `Phase ${phase.phase}`}</span>
                  <span className="text-xs text-[#9A8B78]">{phase.weeks.length} week{phase.weeks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={e => { e.stopPropagation(); removePhase(pi) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                    <Trash2 size={14} />
                  </button>
                  {openPhase === pi ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
                </div>
              </button>

              {openPhase === pi && (
                <div className="px-5 pb-5 border-t border-[#EDDFCC] pt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Phase Title">
                      <Input value={phase.phase_title} onChange={v => updatePhase(pi, 'phase_title', v)} placeholder="e.g. Foundation" />
                    </Field>
                    <Field label="Phase Milestone" hint="What concrete outcome marks this phase complete?">
                      <Input value={phase.phase_milestone} onChange={v => updatePhase(pi, 'phase_milestone', v)} placeholder="e.g. Applied to 3 jobs, resume reviewed..." />
                    </Field>
                  </div>

                  {/* Weeks */}
                  <div>
                    <p className="text-xs font-semibold text-[#9A8B78] mb-2 uppercase tracking-wide">Weeks</p>
                    <div className="space-y-2">
                      {phase.weeks.map((week, wi) => (
                        <div key={wi} className="border border-[#EDDFCC] rounded-xl overflow-hidden">
                          <button type="button"
                            onClick={() => setOpenWeek(openWeek?.p === pi && openWeek?.w === wi ? null : { p: pi, w: wi })}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#FEF9F0] transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold flex items-center justify-center">{week.week}</span>
                              <span className="text-sm font-semibold">{week.title || 'Untitled Week'}</span>
                              <span className="text-xs text-[#9A8B78]">{week.tasks.length} task{week.tasks.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={e => { e.stopPropagation(); removeWeek(pi, wi) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                                <Trash2 size={13} />
                              </button>
                              {openWeek?.p === pi && openWeek?.w === wi
                                ? <ChevronUp size={14} className="text-[#9A8B78]" />
                                : <ChevronDown size={14} className="text-[#9A8B78]" />}
                            </div>
                          </button>

                          {openWeek?.p === pi && openWeek?.w === wi && (
                            <div className="px-4 pb-4 border-t border-[#EDDFCC] pt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Field label="Week #">
                                  <Input type="number" value={String(week.week)} onChange={v => updateWeek(pi, wi, 'week', Number(v))} />
                                </Field>
                                <Field label="Week Theme">
                                  <Input value={week.title} onChange={v => updateWeek(pi, wi, 'title', v)} placeholder="e.g. Build Your Network" />
                                </Field>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-[#9A8B78] mb-2">Tasks (be specific — no vague tasks)</p>
                                <div className="space-y-2">
                                  {week.tasks.map((task, ti) => (
                                    <div key={ti} className="flex gap-2">
                                      <div className="flex-1 space-y-1.5">
                                        <input
                                          value={task.task}
                                          onChange={e => updateTask(pi, wi, ti, 'task', e.target.value)}
                                          placeholder="Specific actionable task..."
                                          className="w-full border-2 border-[#EDDFCC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D97706]"
                                        />
                                        <input
                                          value={task.resource_url ?? ''}
                                          onChange={e => updateTask(pi, wi, ti, 'resource_url', e.target.value)}
                                          placeholder="Resource URL (optional)"
                                          className="w-full border border-[#EDDFCC] rounded-lg px-3 py-1.5 text-xs text-[#9A8B78] focus:outline-none focus:border-[#D97706]"
                                        />
                                      </div>
                                      <button type="button" onClick={() => removeTask(pi, wi, ti)} className="text-[#9A8B78] hover:text-[#E11D48] p-1 flex-shrink-0 mt-1">
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button type="button" onClick={() => addTask(pi, wi)} className="flex items-center gap-1 text-xs text-[#D97706] font-semibold hover:underline mt-2">
                                  <Plus size={12} /> Add Task
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => addWeek(pi)} className="flex items-center gap-1 text-xs text-[#D97706] font-semibold hover:underline mt-2">
                      <Plus size={12} /> Add Week
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addPhase} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline mt-3">
          <Plus size={16} /> Add Phase
        </button>
      </div>

      {/* Courses — unchanged */}
      <div>
        <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Recommended Courses</h3>
        <div className="space-y-2">
          {courses.map((course, i) => (
            <div key={i} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setOpenCourse(openCourse === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#FDF6EC] transition-colors">
                <span className="font-semibold text-sm">{course.name || 'Untitled Course'}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={e => { e.stopPropagation(); set('courses', courses.filter((_, j) => j !== i)) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                    <Trash2 size={14} />
                  </button>
                  {openCourse === i ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
                </div>
              </button>
              {openCourse === i && (
                <div className="px-5 pb-4 border-t border-[#EDDFCC] pt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Course Name"><Input value={course.name} onChange={v => updateCourse(i, 'name', v)} placeholder="Course name" /></Field>
                    <Field label="Provider"><Input value={course.provider} onChange={v => updateCourse(i, 'provider', v)} placeholder="Coursera, Udemy…" /></Field>
                    <Field label="URL"><Input value={course.url} onChange={v => updateCourse(i, 'url', v)} placeholder="https://…" /></Field>
                    <Field label="Cost"><Input value={course.cost} onChange={v => updateCourse(i, 'cost', v)} placeholder="Free or ₹X" /></Field>
                    <Field label="Duration"><Input value={course.duration} onChange={v => updateCourse(i, 'duration', v)} placeholder="6 weeks" /></Field>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addCourse} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline mt-2">
          <Plus size={16} /> Add Course
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/careers/CareerForm.tsx
git commit -m "feat: admin LaunchpadTab — phased 90-day structure with task-level actions"
```

---

## Task 7: Admin CareerForm — Unified ResourcesTab

**Files:**
- Modify: `src/app/admin/careers/CareerForm.tsx`

- [ ] **Step 1: Replace the ResourcesTab function**

Find `function ResourcesTab(...)` and replace the entire function with:

```typescript
const RESOURCE_CATEGORIES = [
  'YouTube Channels', 'Podcasts', 'Free Courses', 'Books',
  'Newsletters', 'Communities', 'Government Portals',
] as const

const RESOURCE_STAGES = ['Beginner', 'Intermediate', 'Advanced'] as const

function ResourcesTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const resources = (form.resources ?? []) as Resource[]
  const [openResource, setOpenResource] = useState<number | null>(null)

  function addResource() {
    const newResource: Resource = {
      category: 'YouTube Channels',
      title: '',
      url: '',
      annotation: '',
      stage: 'Beginner',
      provider: '',
    }
    set('resources', [...resources, newResource])
    setOpenResource(resources.length)
  }

  function updateResource(i: number, key: keyof Resource, value: string) {
    set('resources', resources.map((r, j) => j === i ? { ...r, [key]: value } : r))
  }

  function removeResource(i: number) {
    set('resources', resources.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#9A8B78]">
        Every resource needs an annotation explaining why it is useful for this career. Use AI Fill to generate a starting set.
      </p>
      <div className="space-y-2">
        {resources.map((resource, i) => (
          <div key={i} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setOpenResource(openResource === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#FDF6EC] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] flex-shrink-0">{resource.category.split(' ')[0]}</span>
                <span className="font-semibold text-sm truncate">{resource.title || 'Untitled Resource'}</span>
                <span className="text-xs text-[#9A8B78] flex-shrink-0">{resource.stage}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={e => { e.stopPropagation(); removeResource(i) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                  <Trash2 size={14} />
                </button>
                {openResource === i ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
              </div>
            </button>
            {openResource === i && (
              <div className="px-5 pb-4 border-t border-[#EDDFCC] pt-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Category">
                    <select value={resource.category} onChange={e => updateResource(i, 'category', e.target.value)}
                      className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706]">
                      {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Stage">
                    <select value={resource.stage} onChange={e => updateResource(i, 'stage', e.target.value)}
                      className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706]">
                      {RESOURCE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Title">
                  <Input value={resource.title} onChange={v => updateResource(i, 'title', v)} placeholder="Resource name" />
                </Field>
                <Field label="Provider / Channel" hint="Optional — e.g. PRS India, SWAYAM, Nitin Pai">
                  <Input value={resource.provider ?? ''} onChange={v => updateResource(i, 'provider', v)} placeholder="Organization or author" />
                </Field>
                <Field label="URL">
                  <Input value={resource.url} onChange={v => updateResource(i, 'url', v)} placeholder="https://…" />
                </Field>
                <Field label="Annotation *" hint="Why is this useful? What should the user do with it?">
                  <Textarea value={resource.annotation} onChange={v => updateResource(i, 'annotation', v)}
                    placeholder="e.g. Start here — best plain-language breakdown of Indian policy analysis. Watch the 'Policy 101' playlist first." rows={2} />
                </Field>
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addResource} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline">
        <Plus size={16} /> Add Resource
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/careers/CareerForm.tsx
git commit -m "feat: admin ResourcesTab — unified annotated resource editor"
```

---

## Task 8: Admin CareerForm — MentorsTab + Form Wiring

**Files:**
- Modify: `src/app/admin/careers/CareerForm.tsx`

- [ ] **Step 1: Add Mentor type import**

Change the import line to also import `Mentor`:
```typescript
import type { CareerPath, TrajectoryStage, LaunchpadWeek, LaunchpadPhase, LaunchpadPhaseWeek, LaunchpadTask, Course, YoutubeLink, PodcastLink, Resource, Mentor } from '@/types'
```

- [ ] **Step 2: Add the MentorsTab function** (add after ResourcesTab, before the `TAB_KEYS` constant)

```typescript
function MentorsTab({ careerId }: { careerId: string }) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(false)
  const [openMentor, setOpenMentor] = useState<number | null>(null)
  const [savingIdx, setSavingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Mentor>>({})
  const [addingNew, setAddingNew] = useState(false)

  useEffect(() => {
    if (!careerId) return
    setLoading(true)
    fetch(`/api/admin/mentors?careerId=${careerId}`)
      .then(r => r.json())
      .then(j => setMentors(j.data ?? []))
      .finally(() => setLoading(false))
  }, [careerId])

  async function saveMentor() {
    if (!draft.name?.trim() || !draft.role?.trim()) return
    setSavingIdx(-1)
    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: careerId, ...draft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMentors(prev => [...prev, json.data])
      setDraft({})
      setAddingNew(false)
    } finally {
      setSavingIdx(null)
    }
  }

  async function toggleActive(mentor: Mentor) {
    const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mentor, is_active: !mentor.is_active }),
    })
    const json = await res.json()
    if (res.ok) setMentors(prev => prev.map(m => m.id === mentor.id ? json.data : m))
  }

  async function deleteMentor(id: string) {
    if (!confirm('Delete this mentor?')) return
    const res = await fetch(`/api/admin/mentors/${id}`, { method: 'DELETE' })
    if (res.ok) setMentors(prev => prev.filter(m => m.id !== id))
  }

  if (!careerId) {
    return (
      <div className="text-center py-16 text-[#9A8B78]">
        <p className="font-semibold mb-1">Save the career first</p>
        <p className="text-sm">Mentors can be added after the career is saved.</p>
      </div>
    )
  }

  if (loading) return <div className="py-12 text-center text-[#9A8B78] text-sm">Loading mentors…</div>

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#9A8B78]">Mentors are added manually. They appear on the career detail page with a "Book a call" button.</p>

      {mentors.map((mentor, i) => (
        <div key={mentor.id} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-sm text-[#9A8B78]">{mentor.role}{mentor.company && ` · ${mentor.company}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => toggleActive(mentor)}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${mentor.is_active ? 'bg-[#DCFCE7] text-[#059669]' : 'bg-[#F5F5F5] text-[#9A8B78]'}`}>
                {mentor.is_active ? 'Active' : 'Inactive'}
              </button>
              <button type="button" onClick={() => setOpenMentor(openMentor === i ? null : i)} className="text-[#9A8B78] hover:text-[#D97706]">
                {openMentor === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button type="button" onClick={() => deleteMentor(mentor.id)} className="text-[#9A8B78] hover:text-[#E11D48]">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {openMentor === i && (
            <div className="px-5 pb-5 border-t border-[#EDDFCC] pt-4 grid md:grid-cols-2 gap-3">
              <Field label="Name"><Input value={mentor.name} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, name: v } : m))} /></Field>
              <Field label="Current Role"><Input value={mentor.role} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, role: v } : m))} /></Field>
              <Field label="Company"><Input value={mentor.company ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, company: v } : m))} /></Field>
              <Field label="UPSC Background"><Input value={mentor.upsc_background ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, upsc_background: v } : m))} placeholder="e.g. 3 attempts, Mains cleared" /></Field>
              <Field label="LinkedIn URL"><Input value={mentor.linkedin_url ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, linkedin_url: v } : m))} /></Field>
              <Field label="Photo URL"><Input value={mentor.photo_url ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, photo_url: v } : m))} /></Field>
              <div className="md:col-span-2">
                <Field label="Bio" hint="1-2 sentences on how they can help.">
                  <Textarea value={mentor.bio ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, bio: v } : m))} rows={2} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <button type="button"
                  onClick={async () => {
                    setSavingIdx(i)
                    const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(mentors[i]),
                    })
                    const json = await res.json()
                    if (res.ok) setMentors(prev => prev.map((m, j) => j === i ? json.data : m))
                    setSavingIdx(null)
                  }}
                  disabled={savingIdx === i}
                  className="px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50">
                  {savingIdx === i ? 'Saving…' : 'Save Mentor'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew ? (
        <div className="border-2 border-[#D97706] rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-sm">New Mentor</p>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Name *"><Input value={draft.name ?? ''} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Full name" /></Field>
            <Field label="Current Role *"><Input value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Policy Analyst, World Bank" /></Field>
            <Field label="Company"><Input value={draft.company ?? ''} onChange={v => setDraft(d => ({ ...d, company: v }))} /></Field>
            <Field label="UPSC Background"><Input value={draft.upsc_background ?? ''} onChange={v => setDraft(d => ({ ...d, upsc_background: v }))} placeholder="e.g. 3 attempts, Mains cleared" /></Field>
            <Field label="LinkedIn URL"><Input value={draft.linkedin_url ?? ''} onChange={v => setDraft(d => ({ ...d, linkedin_url: v }))} /></Field>
            <Field label="Photo URL"><Input value={draft.photo_url ?? ''} onChange={v => setDraft(d => ({ ...d, photo_url: v }))} /></Field>
            <div className="md:col-span-2">
              <Field label="Bio" hint="1-2 sentences on how they help.">
                <Textarea value={draft.bio ?? ''} onChange={v => setDraft(d => ({ ...d, bio: v }))} rows={2} />
              </Field>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={saveMentor} disabled={savingIdx === -1}
              className="px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-semibold hover:bg-[#B45309] disabled:opacity-50">
              {savingIdx === -1 ? 'Saving…' : 'Save Mentor'}
            </button>
            <button type="button" onClick={() => { setAddingNew(false); setDraft({}) }}
              className="px-4 py-2 border-2 border-[#EDDFCC] text-[#5C4E3D] rounded-xl text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingNew(true)} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline">
          <Plus size={16} /> Add Mentor
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update TABS array and tab rendering**

Find:
```typescript
const TABS = ['Basic', 'Trajectory', 'Salary & Perks', 'Impact', 'Skills', 'Launchpad', 'Resources']
```
Replace with:
```typescript
const TABS = ['Basic', 'Trajectory', 'Salary & Perks', 'Impact', 'Skills', 'Launchpad', 'Resources', 'Mentors']
```

Find `TAB_KEYS`:
```typescript
const TAB_KEYS: Record<number, string> = {
  1: 'basic', 2: 'trajectory', 3: 'salary', 4: 'impact', 5: 'skills', 6: 'launchpad', 7: 'resources',
}
```
Replace with (Mentors tab at index 7 is intentionally absent — no AI fill for manual tab):
```typescript
const TAB_KEYS: Record<number, string> = {
  1: 'trajectory', 2: 'salary', 3: 'impact', 4: 'skills', 5: 'launchpad', 6: 'resources',
}
```

Note: indices shifted because TABS is 0-indexed and `TAB_KEYS` maps `activeTab` to prompt key. Looking at the original: `activeTab > 0` shows the button, and `TAB_KEYS[activeTab]` picks the prompt. The original mapping was off-by-one (tab 0 = Basic has no entry, tabs 1-7 map to keys). Keep the same pattern: add Mentors at index 7 but don't add it to `TAB_KEYS`.

- [ ] **Step 4: Add MentorsTab to the tab content section**

Find:
```typescript
        {activeTab === 6 && <ResourcesTab {...tabProps} />}
```
Add after it:
```typescript
        {activeTab === 7 && <MentorsTab careerId={form.id} />}
```

- [ ] **Step 5: Verify in browser**

Navigate to any existing career in admin (`/admin/careers/[id]`). Confirm:
- 8 tabs are visible: Basic, Trajectory, Salary & Perks, Impact, Skills, Launchpad, Resources, Mentors
- Launchpad tab shows the new phase editor
- Resources tab shows the unified resource editor
- Mentors tab shows the mentor list (empty for careers with no mentors yet)
- AI Fill button does NOT appear on the Mentors tab

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/careers/CareerForm.tsx
git commit -m "feat: admin CareerForm — add MentorsTab and wire all new tabs"
```

---

## Task 9: Feed Mentors Into Career Detail Pages

**Files:**
- Modify: `src/app/admin/careers/[id]/page.tsx`
- Modify: `src/app/dashboard/careers/[slug]/page.tsx`

- [ ] **Step 1: Confirm no change needed to admin edit page**

`src/app/admin/careers/[id]/page.tsx` does not need to change. `MentorsTab` fetches its own mentor data client-side via `/api/admin/mentors`. Skip to Step 2.

- [ ] **Step 2: Update dashboard career detail page to fetch mentors**

In `src/app/dashboard/careers/[slug]/page.tsx`, add a mentors query after the stories query:

After:
```typescript
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('career_path_id', career.id)
    .eq('is_approved', true)
    .limit(5)
```

Add:
```typescript
  const { data: mentors } = await supabase
    .from('career_mentors')
    .select('*')
    .eq('career_id', career.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
```

Then update the `CareerDetail` render call to pass mentors:
```typescript
  return (
    <CareerDetail
      career={career}
      matchPercentage={match?.match_percentage ?? null}
      jobs={jobs || []}
      stories={stories || []}
      userSkills={profile?.skills || []}
      mentors={mentors || []}
    />
  )
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/careers/[id]/page.tsx" "src/app/dashboard/careers/[slug]/page.tsx"
git commit -m "feat: fetch mentors in career detail page"
```

---

## Task 10: CareerDetail.tsx — Full Upgrade

**Files:**
- Modify: `src/app/dashboard/careers/[slug]/CareerDetail.tsx`

This task updates three tabs (Launchpad, Resources, Mentors) and adds a modal for mentor inquiries.

- [ ] **Step 1: Update imports**

Replace the current import block with:

```typescript
'use client'

import { useState } from 'react'
import type { CareerPath, LaunchpadPhase, Resource, Mentor } from '@/types'
import {
  Star,
  TrendingUp,
  DollarSign,
  MapPin,
  CheckCircle2,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Briefcase,
  BookOpen,
  Users,
  Target,
  X,
  Send,
  Loader2,
  Globe,
  BookMarked,
  Newspaper,
  MessageCircle,
  Building2,
} from 'lucide-react'
```

- [ ] **Step 2: Update Props interface and TABS constant**

Replace:
```typescript
interface Props {
  career: CareerPath
  matchPercentage: number | null
  jobs: JobListing[]
  stories: Story[]
  userSkills: string[]
}

const TABS = [
  'Trajectory', 'Salary & Perks', 'Impact & Exposure',
  'Skills & Eligibility', '90-Day Launchpad', 'Jobs',
  'Resources', 'Stories',
]
```

With:
```typescript
interface Props {
  career: CareerPath
  matchPercentage: number | null
  jobs: JobListing[]
  stories: Story[]
  userSkills: string[]
  mentors: Mentor[]
}

const TABS = [
  'Trajectory', 'Salary & Perks', 'Impact & Exposure',
  'Skills & Eligibility', '90-Day Launchpad', 'Mentors',
  'Jobs', 'Resources', 'Stories',
]
```

- [ ] **Step 3: Update component signature and add modal state**

Replace:
```typescript
export default function CareerDetail({ career, matchPercentage, jobs, stories, userSkills }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [openWeek, setOpenWeek] = useState<number | null>(0)
```

With:
```typescript
export default function CareerDetail({ career, matchPercentage, jobs, stories, userSkills, mentors }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [openWeek, setOpenWeek] = useState<number | null>(0)
  const [openPhase, setOpenPhase] = useState<number | null>(0)
  const [openPhaseWeek, setOpenPhaseWeek] = useState<{ p: number; w: number } | null>(null)
  const [resourceStageFilter, setResourceStageFilter] = useState<string>('All')
  const [inquiryMentor, setInquiryMentor] = useState<Mentor | null>(null)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' })
  const [inquirySending, setInquirySending] = useState(false)
  const [inquirySent, setInquirySent] = useState(false)
```

- [ ] **Step 4: Replace Tab 4 (90-Day Launchpad) rendering**

Find `{/* Tab 4: 90-Day Launchpad */}` block and replace the entire block with:

```typescript
      {/* Tab 4: 90-Day Launchpad */}
      {activeTab === 4 && (
        <div className="space-y-4">
          {career.estimated_cost && (
            <div className="flex items-center gap-3 bg-[#DCFCE7] text-[#059669] px-5 py-3 rounded-xl text-sm font-semibold mb-6">
              <DollarSign size={16} />
              Estimated cost: {career.estimated_cost}
            </div>
          )}

          {/* New phased launchpad */}
          {career.launchpad_phases && career.launchpad_phases.length > 0 ? (
            <div className="space-y-4">
              {(career.launchpad_phases as LaunchpadPhase[]).map((phase, pi) => (
                <div key={pi} className="card bg-white rounded-2xl overflow-hidden">
                  {/* Phase header */}
                  <button onClick={() => setOpenPhase(openPhase === pi ? null : pi)}
                    className="w-full flex items-center justify-between p-5 hover:bg-[#FDF6EC] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-[#D97706] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {phase.phase}
                      </span>
                      <div className="text-left">
                        <div className="font-bold" style={{ fontFamily: 'var(--font-lora)' }}>Phase {phase.phase}: {phase.phase_title}</div>
                        <div className="text-xs text-[#9A8B78]">{phase.weeks.length} weeks</div>
                      </div>
                    </div>
                    {openPhase === pi ? <ChevronUp size={18} className="text-[#9A8B78]" /> : <ChevronDown size={18} className="text-[#9A8B78]" />}
                  </button>

                  {openPhase === pi && (
                    <div className="border-t border-[#EDDFCC]">
                      {/* Milestone */}
                      {phase.phase_milestone && (
                        <div className="flex items-start gap-3 px-5 py-4 bg-[#FEF3C7]">
                          <Target size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-[#D97706] mb-0.5 uppercase tracking-wide">Phase milestone</div>
                            <div className="text-sm text-[#5C4E3D] font-semibold">{phase.phase_milestone}</div>
                          </div>
                        </div>
                      )}

                      {/* Weeks */}
                      <div className="p-4 space-y-2">
                        {phase.weeks.map((week, wi) => (
                          <div key={wi} className="border border-[#EDDFCC] rounded-xl overflow-hidden">
                            <button
                              onClick={() => setOpenPhaseWeek(openPhaseWeek?.p === pi && openPhaseWeek?.w === wi ? null : { p: pi, w: wi })}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FEF9F0] transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold flex items-center justify-center">
                                  W{week.week}
                                </span>
                                <span className="font-semibold text-sm">{week.title}</span>
                                <span className="text-xs text-[#9A8B78]">{week.tasks.length} tasks</span>
                              </div>
                              {openPhaseWeek?.p === pi && openPhaseWeek?.w === wi
                                ? <ChevronUp size={14} className="text-[#9A8B78]" />
                                : <ChevronDown size={14} className="text-[#9A8B78]" />}
                            </button>
                            {openPhaseWeek?.p === pi && openPhaseWeek?.w === wi && (
                              <div className="px-4 pb-4 border-t border-[#EDDFCC]">
                                <ul className="space-y-2 mt-3">
                                  {week.tasks.map((task, ti) => (
                                    <li key={ti} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                                      <CheckCircle2 size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                                      <span>
                                        {task.resource_url ? (
                                          <a href={task.resource_url} target="_blank" rel="noopener noreferrer"
                                            className="hover:text-[#D97706] underline underline-offset-2">{task.task}</a>
                                        ) : task.task}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Fallback to old launchpad_weeks if launchpad_phases not yet set */
            <div className="space-y-4">
              {(career.launchpad_weeks || []).map((week, i) => (
                <div key={i} className="card bg-white rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenWeek(openWeek === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 hover:bg-[#FDF6EC] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: '#D97706' }}>
                        {week.week}
                      </span>
                      <span className="font-semibold text-left" style={{ fontFamily: 'var(--font-lora)' }}>{week.title}</span>
                    </div>
                    {openWeek === i ? <ChevronUp size={18} className="text-[#9A8B78]" /> : <ChevronDown size={18} className="text-[#9A8B78]" />}
                  </button>
                  {openWeek === i && (
                    <div className="px-5 pb-5 border-t border-[#EDDFCC]">
                      <ul className="space-y-2 mt-4">
                        {(week.tasks || []).map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                            <CheckCircle2 size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                            {typeof task === 'string' ? task : task.task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Courses */}
          {career.courses && career.courses.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl mt-6">
              <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Recommended Courses</h3>
              <div className="space-y-3">
                {career.courses.map((course, i) => (
                  <a key={i} href={course.url || '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-[#EDDFCC] hover:border-[#D97706] transition-colors group">
                    <div>
                      <div className="font-semibold group-hover:text-[#D97706] transition-colors">{course.name}</div>
                      <div className="text-xs text-[#9A8B78] mt-0.5">{course.provider} · {course.duration} · {course.cost}</div>
                    </div>
                    <ExternalLink size={16} className="text-[#9A8B78] flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {career.certifications && career.certifications.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Key Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {career.certifications.map((cert, i) => (
                  <span key={i} className="tag bg-[#EDE9FE] text-[#7C3AED] px-3 py-1.5">{cert}</span>
                ))}
              </div>
            </div>
          )}

          {career.portfolio_projects && career.portfolio_projects.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Portfolio Projects</h3>
              <ul className="space-y-2">
                {career.portfolio_projects.map((proj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                    <Zap size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                    {proj}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 5: Add Tab 5 (Mentors) — insert before the Jobs block**

Find `{/* Tab 5: Jobs */}` and change it to `{/* Tab 6: Jobs */}` (update the activeTab number to 6). Then insert the new Mentors tab block before it:

```typescript
      {/* Tab 5: Mentors */}
      {activeTab === 5 && (
        <div>
          {mentors.length === 0 ? (
            <div className="text-center py-16 card bg-white rounded-2xl">
              <Users size={40} className="text-[#EDDFCC] mx-auto mb-4" />
              <p className="font-semibold text-lg mb-2">Mentors coming soon</p>
              <p className="text-[#9A8B78] text-sm">We're building a mentor network for this path. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#9A8B78] mb-6">These mentors have walked this path. Reach out — they've agreed to help.</p>
              {mentors.map((mentor) => (
                <div key={mentor.id} className="card bg-white p-6 rounded-2xl flex flex-col md:flex-row gap-5">
                  <div className="flex-shrink-0">
                    {mentor.photo_url ? (
                      <img src={mentor.photo_url} alt={mentor.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] text-2xl font-bold">
                        {mentor.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-lora)' }}>{mentor.name}</h3>
                        <p className="text-[#5C4E3D]">{mentor.role}{mentor.company && ` · ${mentor.company}`}</p>
                      </div>
                      {mentor.linkedin_url && (
                        <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-[#0284C7] hover:underline">
                          <Globe size={12} /> LinkedIn
                        </a>
                      )}
                    </div>
                    {mentor.upsc_background && (
                      <span className="tag bg-[#FEF3C7] text-[#D97706] text-xs mb-3 inline-block">
                        UPSC: {mentor.upsc_background}
                      </span>
                    )}
                    {mentor.bio && <p className="text-sm text-[#5C4E3D] mb-4 leading-relaxed">{mentor.bio}</p>}
                    <button
                      onClick={() => { setInquiryMentor(mentor); setInquirySent(false); setInquiryForm({ name: '', email: '', message: '' }) }}
                      className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
                    >
                      <MessageCircle size={14} /> Book a call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 6: Update Jobs, Resources, Stories tab indices**

Change:
- `{activeTab === 5 &&` → `{activeTab === 6 &&` (Jobs)
- `{activeTab === 6 &&` → `{activeTab === 7 &&` (Resources)
- `{activeTab === 7 &&` → `{activeTab === 8 &&` (Stories)

- [ ] **Step 7: Replace Tab 7 (Resources) content**

Find `{/* Tab 6: Resources */}` (now `{/* Tab 7: Resources */}`) and replace the entire tab block with:

```typescript
      {/* Tab 7: Resources */}
      {activeTab === 7 && (
        <div className="space-y-8">
          {career.resources && career.resources.length > 0 ? (
            <>
              {/* Stage filter */}
              <div className="flex gap-2 flex-wrap">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map(stage => (
                  <button key={stage} onClick={() => setResourceStageFilter(stage)}
                    className={`tag px-4 py-2 cursor-pointer transition-all text-sm font-semibold ${
                      resourceStageFilter === stage
                        ? 'bg-[#D97706] text-white'
                        : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#D97706] hover:text-white'
                    }`}>
                    {stage}
                  </button>
                ))}
              </div>

              {/* Group by category */}
              {(['YouTube Channels', 'Podcasts', 'Free Courses', 'Books', 'Newsletters', 'Communities', 'Government Portals'] as const).map(category => {
                const categoryResources = (career.resources as Resource[]).filter(r =>
                  r.category === category &&
                  (resourceStageFilter === 'All' || r.stage === resourceStageFilter)
                )
                if (categoryResources.length === 0) return null

                const categoryIcons: Record<string, React.ReactNode> = {
                  'YouTube Channels': <Play size={16} className="text-[#E11D48]" />,
                  'Podcasts': <span className="text-base">🎙️</span>,
                  'Free Courses': <BookOpen size={16} className="text-[#7C3AED]" />,
                  'Books': <BookMarked size={16} className="text-[#0284C7]" />,
                  'Newsletters': <Newspaper size={16} className="text-[#059669]" />,
                  'Communities': <Users size={16} className="text-[#D97706]" />,
                  'Government Portals': <Building2 size={16} className="text-[#5C4E3D]" />,
                }
                const stageBadgeStyle: Record<string, { bg: string; color: string }> = {
                  'Beginner': { bg: '#DCFCE7', color: '#059669' },
                  'Intermediate': { bg: '#FEF3C7', color: '#D97706' },
                  'Advanced': { bg: '#EDE9FE', color: '#7C3AED' },
                }

                return (
                  <div key={category}>
                    <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>{category}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {categoryResources.map((resource, i) => (
                        <a key={i} href={resource.url || '#'} target={resource.url ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className={`card bg-white p-4 rounded-xl flex gap-3 group ${resource.url ? 'hover:border-[#D97706]' : 'cursor-default'} border-2 border-[#EDDFCC] transition-colors`}>
                          <div className="w-9 h-9 rounded-xl bg-[#FDF6EC] flex items-center justify-center flex-shrink-0">
                            {categoryIcons[category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-semibold text-sm group-hover:text-[#D97706] transition-colors leading-snug">
                                {resource.title}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: stageBadgeStyle[resource.stage]?.bg ?? '#FEF3C7',
                                  color: stageBadgeStyle[resource.stage]?.color ?? '#D97706',
                                }}>
                                {resource.stage}
                              </span>
                            </div>
                            {resource.provider && (
                              <div className="text-xs text-[#9A8B78] mb-1">{resource.provider}</div>
                            )}
                            <p className="text-xs text-[#5C4E3D] leading-relaxed">{resource.annotation}</p>
                          </div>
                          {resource.url && <ExternalLink size={14} className="text-[#9A8B78] flex-shrink-0 mt-0.5" />}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            /* Fallback: render old youtube_links and podcast_links if resources not yet migrated */
            <div className="space-y-6">
              {career.youtube_links && career.youtube_links.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>YouTube Resources</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {career.youtube_links.map((yt, i) => (
                      <a key={i} href={yt.url} target="_blank" rel="noopener noreferrer"
                        className="card bg-white p-4 rounded-xl flex items-start gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                          <Play size={18} className="text-[#E11D48]" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm group-hover:text-[#D97706] transition-colors">{yt.title}</div>
                          <div className="text-xs text-[#9A8B78] mt-0.5">{yt.channel}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {career.podcast_links && career.podcast_links.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Podcasts</h3>
                  <div className="space-y-3">
                    {career.podcast_links.map((pod, i) => (
                      <a key={i} href={pod.url} target="_blank" rel="noopener noreferrer"
                        className="card bg-white p-4 rounded-xl flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">🎙️</div>
                        <div>
                          <div className="font-semibold text-sm group-hover:text-[#D97706] transition-colors">{pod.title}</div>
                          <div className="text-xs text-[#9A8B78]">{pod.host}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 8: Add the mentor inquiry modal**

Find the closing `</div>` of the main return (just before the last `}` of the component) and add the modal before it:

```typescript
      {/* Mentor Inquiry Modal */}
      {inquiryMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-xl" style={{ fontFamily: 'var(--font-lora)' }}>
                  Book a call with {inquiryMentor.name}
                </h3>
                <p className="text-sm text-[#9A8B78] mt-0.5">{inquiryMentor.role}</p>
              </div>
              <button onClick={() => setInquiryMentor(null)} className="text-[#9A8B78] hover:text-[#2A1F14]">
                <X size={20} />
              </button>
            </div>

            {inquirySent ? (
              <div className="text-center py-8">
                <CheckCircle2 size={40} className="text-[#059669] mx-auto mb-3" />
                <p className="font-bold text-lg mb-1">Request sent!</p>
                <p className="text-sm text-[#9A8B78]">We've received your request. Ankit will connect you within 48 hours.</p>
                <button onClick={() => setInquiryMentor(null)} className="btn-primary mt-5 text-sm py-2 px-6">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={async e => {
                e.preventDefault()
                setInquirySending(true)
                try {
                  const res = await fetch('/api/mentor-inquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      mentorName: inquiryMentor.name,
                      careerTitle: career.title,
                      senderName: inquiryForm.name,
                      senderEmail: inquiryForm.email,
                      message: inquiryForm.message,
                    }),
                  })
                  if (!res.ok) throw new Error()
                  setInquirySent(true)
                } finally {
                  setInquirySending(false)
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">Your name</label>
                  <input
                    required
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">Your email</label>
                  <input
                    required
                    type="email"
                    value={inquiryForm.email}
                    onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">What would you like to discuss?</label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryForm.message}
                    onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706] resize-none"
                    placeholder="Brief intro about your background and what guidance you're looking for..."
                  />
                </div>
                <button type="submit" disabled={inquirySending}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {inquirySending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {inquirySending ? 'Sending…' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
cd /Users/ankityadav/Desktop/plan-b-to-z
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Smoke test in browser**

With dev server running (`npm run dev`), open any career detail page. Verify:
- 9 tabs render correctly: Trajectory, Salary & Perks, Impact & Exposure, Skills & Eligibility, 90-Day Launchpad, Mentors, Jobs, Resources, Stories
- Launchpad tab: shows phased view if `launchpad_phases` is set, falls back to old weekly view if not
- Resources tab: shows categorized view if `resources` is set, falls back to old view if not
- Mentors tab: shows "coming soon" if no mentors, or mentor cards if mentors exist
- "Book a call" opens the modal, submitting the form sends the inquiry email

- [ ] **Step 11: Commit**

```bash
git add "src/app/dashboard/careers/[slug]/CareerDetail.tsx"
git commit -m "feat: career detail — phased launchpad, categorized resources, mentors tab with inquiry modal"
```

---

## Final Verification

- [ ] Run a full type check: `npx tsc --noEmit`
- [ ] Open 2 career pages in browser — one with old data (should fallback gracefully), one after running AI fill in admin (should show new UI)
- [ ] Test mentor inquiry end-to-end: add a mentor in admin → see it on career detail page → submit inquiry form → check `planbtoz95@gmail.com`
- [ ] Test AI Fill on Launchpad tab in admin — response should have `launchpad_phases` not `launchpad_weeks`
- [ ] Test AI Fill on Resources tab in admin — response should have `resources` array
- [ ] Push to GitHub

```bash
git push origin main
```
