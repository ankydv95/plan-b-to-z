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
  } catch (error) {
    console.error('AI generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
