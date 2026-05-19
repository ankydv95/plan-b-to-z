import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CareerDetail from './CareerDetail'

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: career } = await supabase
    .from('career_paths')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!career) notFound()

  // Mark as explored
  await supabase
    .from('user_career_matches')
    .update({ explored: true })
    .eq('user_id', user.id)
    .eq('career_path_id', career.id)

  const { data: match } = await supabase
    .from('user_career_matches')
    .select('match_percentage')
    .eq('user_id', user.id)
    .eq('career_path_id', career.id)
    .single()

  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*')
    .eq('career_path_id', career.id)
    .order('posted_at', { ascending: false })
    .limit(10)

  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('career_path_id', career.id)
    .eq('is_approved', true)
    .limit(5)

  const { data: mentors } = await supabase
    .from('career_mentors')
    .select('*')
    .eq('career_id', career.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills')
    .eq('id', user.id)
    .single()

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
}
