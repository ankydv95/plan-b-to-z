import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'editor'].includes(profile.role ?? '')) return null
  return user
}

const TAB_PROMPTS: Record<string, (title: string) => string> = {
  basic: (title) => `Generate a career overview for "${title}" on a platform for ex-UPSC aspirants in India transitioning careers.
Return ONLY valid JSON:
{
  "overview": "2-3 sentence compelling overview of this career path",
  "growth_rate": "e.g. 15% annually or High"
}`,

  trajectory: (title) => `Generate a realistic career trajectory for "${title}" in India for ex-UPSC aspirants.
Return ONLY valid JSON:
{
  "trajectory": [
    { "stage": "Entry", "title": "Job title at entry", "years": "0-2", "salary": "₹X-Y LPA", "responsibilities": ["task 1", "task 2", "task 3"] },
    { "stage": "Mid", "title": "Job title at mid level", "years": "3-6", "salary": "₹X-Y LPA", "responsibilities": ["task 1", "task 2", "task 3"] },
    { "stage": "Senior", "title": "Senior title", "years": "7-12", "salary": "₹X-Y LPA", "responsibilities": ["task 1", "task 2", "task 3"] },
    { "stage": "Expert", "title": "Expert/leadership title", "years": "12+", "salary": "₹X+ LPA", "responsibilities": ["task 1", "task 2", "task 3"] }
  ]
}`,

  salary: (title) => `Generate realistic salary data and perks for "${title}" in India.
Return ONLY valid JSON:
{
  "salary_entry": "₹X-Y LPA",
  "salary_mid": "₹X-Y LPA",
  "salary_senior": "₹X+ LPA",
  "estimated_cost": "e.g. ₹10,000-50,000 for certifications",
  "perks": ["perk 1", "perk 2", "perk 3", "perk 4", "perk 5"]
}`,

  impact: (title) => `Describe the impact and exposure for "${title}" in India.
Return ONLY valid JSON:
{
  "impact": "2-3 sentences on what societal/organizational impact a person in this role can create",
  "exposure": "2-3 sentences on the kind of exposure, networks, and opportunities this career provides"
}`,

  skills: (title) => `Generate skills and eligibility for "${title}" relevant to ex-UPSC aspirants in India.
Return ONLY valid JSON:
{
  "eligibility": "1-2 sentences on educational and experience requirements",
  "skills_needed": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5", "skill 6"],
  "upsc_skill_mapping": "2-3 sentences explaining how UPSC preparation skills directly apply to this career",
  "certifications": ["cert 1", "cert 2", "cert 3"]
}`,

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
      "phase_milestone": "Concrete verifiable outcome after 4 weeks",
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
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { careerTitle, tab } = await request.json() as { careerTitle: string; tab: string }
    const promptFn = TAB_PROMPTS[tab]
    if (!promptFn) return NextResponse.json({ error: 'Unknown tab' }, { status: 400 })

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(promptFn(careerTitle))
    const text = result.response.text()

    // Extract JSON from response (strip markdown code fences if present)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
    const jsonStr = (jsonMatch[1] || text).trim()
    const data = JSON.parse(jsonStr)

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
