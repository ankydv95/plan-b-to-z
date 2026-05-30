'use client'

import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import type { CommunityGroup } from '@/types'

interface Props {
  allGroups: CommunityGroup[]
  initialJoinedIds: string[]
}

export default function ExploreGroups({ allGroups, initialJoinedIds }: Props) {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set(initialJoinedIds))
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(groupId: string) {
    const isJoined = joinedIds.has(groupId)
    if (!isJoined && joinedIds.size >= 5) {
      setError('You can join a maximum of 5 groups.')
      return
    }
    setLoading(groupId)
    setError(null)
    const endpoint = isJoined
      ? '/api/community/groups/leave'
      : '/api/community/groups/join'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      })
      if (res.ok) {
        setJoinedIds(prev => {
          const next = new Set(prev)
          isJoined ? next.delete(groupId) : next.add(groupId)
          return next
        })
      } else {
        const json = await res.json() as { error?: string }
        setError(json.error ?? 'Action failed.')
      }
    } catch {
      setError('Failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const filtered = allGroups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 bg-white border border-[#e2e8f0] rounded-xl px-4 py-2.5 mb-4 shadow-sm">
        <Search size={16} className="text-[#64748b] flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search career cohorts..."
          className="flex-1 text-sm bg-transparent outline-none text-[#1e293b] placeholder-[#64748b]"
        />
      </div>

      {/* Counter */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-2 mb-4">
        <Users size={13} />
        Joined {joinedIds.size} of 5 groups
      </div>

      {error && (
        <p className="text-xs text-[#E11D48] bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Group list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#64748b] text-sm">No groups found.</div>
        ) : (
          filtered.map(group => {
            const isJoined = joinedIds.has(group.id)
            const isLoading = loading === group.id
            return (
              <div
                key={group.id}
                className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                  isJoined ? 'border-[#059669] bg-[#F0FDF4]' : 'border-[#e2e8f0]'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-xl flex-shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#1e293b] text-sm truncate">{group.name}</div>
                  <div className="text-xs text-[#64748b]">{group.member_count} members</div>
                </div>
                <button
                  onClick={() => handleToggle(group.id)}
                  disabled={isLoading || (!isJoined && joinedIds.size >= 5)}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                    isJoined
                      ? 'bg-[#F0FDF4] text-[#059669] border-2 border-[#059669] hover:bg-[#DCFCE7]'
                      : 'bg-[#D97706] text-white hover:bg-[#B45309]'
                  }`}
                >
                  {isLoading ? '...' : isJoined ? '✓ Joined' : 'Join'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
