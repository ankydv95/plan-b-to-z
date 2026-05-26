import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PostFeed from './PostFeed'
import type { CommunityPost, CommunityGroup } from '@/types'

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

  const feedPosts = sanitizePosts(rawFeedPosts as unknown[] | null)
  const groupPosts = sanitizePosts(rawGroupPosts as unknown[] | null)
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
              <h3 className="font-bold text-[#2A1F14] text-sm mb-4">Suggested Groups</h3>
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
            <h3 className="font-bold text-[#2A1F14] text-sm mb-3">Topics</h3>
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
