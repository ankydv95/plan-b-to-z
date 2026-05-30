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
              <span className="text-xs text-[#475569] text-center w-14 truncate group-hover:text-[#D97706] transition-colors">
                {group.name.split(' → ')[1] ?? group.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#e2e8f0] mb-5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-[#D97706] border-[#D97706]'
                : 'text-[#64748b] border-transparent hover:text-[#475569]'
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
            <div className="text-center py-16 bg-white border border-[#e2e8f0] rounded-2xl">
              <p className="text-[#64748b] text-sm">
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
