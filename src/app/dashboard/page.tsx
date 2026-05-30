import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Brain, Briefcase, MapPin, BookOpen, Heart, Users, Sparkles, Award } from 'lucide-react'
import ProfileCompletion from './ProfileCompletion'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: stories }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('stories')
      .select('*, career_paths(title, slug)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const { data: matches } = profile?.assessment_completed
    ? await supabase
        .from('user_career_matches')
        .select('*, career_paths(id, title, slug, domain, description, salary_entry, difficulty_rating)')
        .eq('user_id', user.id)
        .order('match_percentage', { ascending: false })
        .limit(4)
    : { data: null }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const interests = profile?.interests as string[] | null
  const skills = profile?.skills as string[] | null
  const priorities = profile?.priorities as string[] | null

  const quickActions = [
    { href: '/dashboard/careers', icon: MapPin, label: 'Browse Careers', color: '#D97706', bg: '#FEF3C7' },
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Job Board', color: '#059669', bg: '#DCFCE7' },
    { href: '/dashboard/wellbeing', icon: Heart, label: 'Well Being', color: '#7C3AED', bg: '#EDE9FE' },
    { href: '/dashboard/stories', icon: BookOpen, label: 'Stories', color: '#E11D48', bg: '#FEE2E2' },
    { href: '/dashboard/community', icon: Users, label: 'Community', color: '#0284C7', bg: '#E0F2FE' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">

      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>
            Good to see you, {firstName}. 👋
          </h1>
          <p className="text-[#64748b]">
            {profile?.assessment_completed
              ? 'Your personalised career roadmap is ready.'
              : 'Your next chapter starts here.'}
          </p>
        </div>
        {profile?.assessment_completed && (
          <Link
            href="/dashboard/assessment"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#64748b] border border-[#e2e8f0] rounded-xl px-3 py-2 hover:border-[#D97706] hover:text-[#D97706] transition-colors"
          >
            <Brain size={13} /> Retake Assessment
          </Link>
        )}
      </div>

      {/* Assessment Banner — only if not done */}
      {!profile?.assessment_completed && (
        <div className="bg-[#FFFBEB] border-2 border-[#D97706]/30 rounded-2xl p-7 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D97706] to-[#EA580C] rounded-t-2xl" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#D97706] flex items-center justify-center">
                  <Brain size={15} className="text-white" />
                </div>
                <span className="text-[#D97706] font-bold text-xs uppercase tracking-widest">AI Assessment</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1e293b] mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
                Discover your perfect career match
              </h2>
              <p className="text-[#475569] max-w-lg leading-relaxed">
                Take a 10-minute conversation with our AI counselor to get matched with careers
                that value exactly what you&apos;ve built.
              </p>
            </div>
            <Link
              href="/dashboard/assessment"
              className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-7 py-3 rounded-xl font-bold transition-colors flex-shrink-0"
            >
              Start Assessment <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {/* Profile Completion Widget */}
      <ProfileCompletion
        userId={user.id}
        fullName={profile?.full_name ?? null}
        education={profile?.education ?? null}
        optionalSubject={profile?.optional_subject ?? null}
        attempts={profile?.attempts ?? null}
        stageReached={profile?.stage_reached ?? null}
        interests={interests ?? null}
        skills={skills ?? null}
        priorities={priorities ?? null}
        resumeUrl={profile?.resume_url ?? null}
        assessmentCompleted={!!profile?.assessment_completed}
      />

      {/* Your Background — post-assessment snapshot */}
      {profile?.assessment_completed && (interests?.length || skills?.length || profile?.optional_subject) && (
        <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-2 border-[#D97706]/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-[#D97706]" />
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-lora)' }}>Your Profile Snapshot</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {profile.optional_subject && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1.5">Optional Subject</p>
                <p className="font-semibold text-[#1e293b]">{profile.optional_subject}</p>
              </div>
            )}
            {profile.stage_reached && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1.5">Highest Stage</p>
                <p className="font-semibold text-[#1e293b]">{profile.stage_reached}</p>
              </div>
            )}
            {profile.attempts && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1.5">Attempts</p>
                <p className="font-semibold text-[#1e293b]">{profile.attempts} attempt{Number(profile.attempts) > 1 ? 's' : ''}</p>
              </div>
            )}
            {interests?.length ? (
              <div className="sm:col-span-2 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1.5">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map(i => (
                    <span key={i} className="text-xs bg-white border border-[#D97706]/30 text-[#D97706] font-semibold px-2.5 py-1 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {priorities?.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1.5">Career Priority</p>
                <div className="flex flex-wrap gap-1.5">
                  {priorities.slice(0, 2).map(p => (
                    <span key={p} className="text-xs bg-white border border-[#e2e8f0] text-[#475569] font-semibold px-2.5 py-1 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Recommended Careers — post-assessment */}
      {matches && matches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#D97706]" />
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
                Recommended for You
              </h2>
            </div>
            <Link href="/dashboard/careers" className="text-sm text-[#D97706] font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {matches.map((match) => {
              const cp = match.career_paths as Record<string, unknown>
              const pct = match.match_percentage ?? 0
              return (
                <Link
                  key={match.id}
                  href={`/dashboard/careers/${cp?.slug}`}
                  className="bg-white border-2 border-[#e2e8f0] p-5 rounded-2xl flex gap-4 group hover:border-[#D97706] transition-colors"
                >
                  {/* Match % circle */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                    style={{ background: pct >= 70 ? '#DCFCE7' : '#FEF3C7' }}>
                    <span className="text-lg font-bold leading-none" style={{
                      color: pct >= 70 ? '#059669' : '#D97706',
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}>{pct}%</span>
                    <span className="text-xs font-semibold" style={{ color: pct >= 70 ? '#059669' : '#D97706' }}>match</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] mb-1.5 inline-block">
                      {String(cp?.domain ?? '').split(',')[0].split('&')[0].trim()}
                    </span>
                    <h3 className="font-bold text-base group-hover:text-[#D97706] transition-colors leading-snug mb-1" style={{ fontFamily: 'var(--font-lora)' }}>
                      {String(cp?.title ?? '')}
                    </h3>
                    <p className="text-xs text-[#64748b] line-clamp-1 mb-2">{String(cp?.description ?? '')}</p>
                    {!!cp?.salary_entry && (
                      <p className="text-xs font-semibold text-[#475569]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        From {String(cp.salary_entry)}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-[#CDBFA8] group-hover:text-[#D97706] flex-shrink-0 self-center transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Quick Actions</h2>
        <div className="grid grid-cols-5 gap-3">
          {quickActions.map(({ href, icon: Icon, label, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2.5 p-4 bg-white border-2 border-[#e2e8f0] rounded-2xl hover:border-[#D97706] transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={22} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-[#475569] text-center group-hover:text-[#D97706] transition-colors leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Move On Success Stories */}
      {stories && stories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              Move On Success Stories
            </h2>
            <Link href="/dashboard/stories" className="text-sm text-[#D97706] font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {stories.map((story) => (
              <Link
                key={story.id}
                href="/dashboard/stories"
                className="bg-white border-2 border-[#e2e8f0] rounded-2xl overflow-hidden group hover:border-[#D97706] transition-colors"
              >
                {story.photo_url ? (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={story.photo_url}
                      alt={story.is_anonymous ? 'Anonymous' : story.person_name ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-[#FEF3C7] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#D97706] flex items-center justify-center text-white text-2xl font-bold">
                      {story.is_anonymous ? '?' : (story.person_name?.[0] ?? '?')}
                    </div>
                  </div>
                )}
                <div className="p-4">
                  {(story as { career_paths?: { title?: string } }).career_paths?.title && (
                    <p className="text-xs text-[#D97706] font-bold uppercase tracking-wide mb-1.5">
                      {(story as { career_paths?: { title?: string } }).career_paths?.title}
                    </p>
                  )}
                  <h3 className="font-bold text-[#1e293b] mb-0.5">
                    {story.is_anonymous ? 'Anonymous' : story.person_name}
                  </h3>
                  <p className="text-xs text-[#64748b] mb-2">
                    {story.current_role}{story.company && ` at ${story.company}`}
                  </p>
                  <p className="text-sm text-[#475569] line-clamp-2 leading-relaxed">{story.story_text}</p>
                  <p className="text-xs text-[#D97706] font-semibold mt-3">Read story →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
