import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import GroupTabs from './GroupTabs'
import type { CommunityPost, CommunityGroupMember, Resource, LaunchpadPhase } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

function sanitizePosts(posts: unknown[] | null): CommunityPost[] {
  return (posts ?? []).map(post => {
    const p = post as CommunityPost
    return {
      ...p,
      author_id: p.is_anonymous ? null : p.author_id,
      profiles: p.is_anonymous ? null : p.profiles,
    }
  })
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
  const posts = sanitizePosts(rawPosts as unknown[] | null)
  const likedPostIdArray = (likedRows ?? []).map(r => r.post_id as string)
  const userInitial = profile?.full_name?.[0]?.toUpperCase() ?? 'U'

  const cp = group.career_paths as Record<string, unknown> | null
  const resources = (cp?.resources ?? []) as Resource[]
  const launchpadPhases = (cp?.launchpad_phases ?? []) as LaunchpadPhase[]

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/community"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#D97706] transition-colors mb-5 font-semibold"
      >
        <ArrowLeft size={15} />
        Community
      </Link>

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
              Joined
            </span>
          )}
        </div>
      </div>

      <GroupTabs
        groupId={group.id}
        posts={posts}
        likedPostIdArray={likedPostIdArray}
        resources={resources}
        launchpadPhases={launchpadPhases}
        members={(members ?? []).map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles,
      })) as CommunityGroupMember[]}
        totalMemberCount={totalMemberCount ?? 0}
        userInitial={userInitial}
        isMember={isMember}
      />
    </div>
  )
}
