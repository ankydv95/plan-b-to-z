'use client'

import { useState } from 'react'
import PostCard from '../../PostCard'
import ComposePost from '../../ComposePost'
import GroupResources from './GroupResources'
import GroupMemberList from './GroupMemberList'
import type { CommunityPost, CommunityGroupMember, Resource, LaunchpadPhase } from '@/types'

type GroupTab = 'discussion' | 'resources' | 'members'

interface Props {
  groupId: string
  posts: CommunityPost[]
  likedPostIdArray: string[]
  resources: Resource[]
  launchpadPhases: LaunchpadPhase[]
  members: CommunityGroupMember[]
  totalMemberCount: number
  userInitial: string
  isMember: boolean
}

export default function GroupTabs({
  groupId,
  posts: initialPosts,
  likedPostIdArray,
  resources,
  launchpadPhases,
  members,
  totalMemberCount,
  userInitial,
  isMember,
}: Props) {
  const [activeTab, setActiveTab] = useState<GroupTab>('discussion')
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [likedIds] = useState<Set<string>>(new Set(likedPostIdArray))

  function handleNewPost(post: CommunityPost) {
    setPosts(prev => [post, ...prev])
  }

  const tabs: { id: GroupTab; label: string }[] = [
    { id: 'discussion', label: 'Discussion' },
    { id: 'resources',  label: 'Resources' },
    { id: 'members',    label: `Members (${totalMemberCount})` },
  ]

  return (
    <div>
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

      {activeTab === 'discussion' && (
        <div className="space-y-4">
          {isMember && (
            <ComposePost groupId={groupId} userInitial={userInitial} onPost={handleNewPost} />
          )}
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#e2e8f0] rounded-2xl">
              <p className="text-[#64748b] text-sm">
                {isMember
                  ? 'No posts yet. Start the conversation!'
                  : 'Join this group to see and post discussions.'}
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                initialLiked={likedIds.has(post.id)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'resources' && (
        <GroupResources resources={resources} launchpadPhases={launchpadPhases} />
      )}

      {activeTab === 'members' && (
        <GroupMemberList members={members} totalCount={totalMemberCount} />
      )}
    </div>
  )
}
