import type { CommunityGroupMember } from '@/types'

interface Props {
  members: CommunityGroupMember[]
  totalCount: number
}

export default function GroupMemberList({ members, totalCount }: Props) {
  if (members.length === 0) {
    return (
      <div className="text-center py-16 text-[#64748b] text-sm">
        No members yet. Be the first to join!
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-[#64748b] mb-4">{totalCount} members total</p>
      <div className="space-y-2">
        {members.map(member => {
          const name = member.profiles?.full_name ?? 'Member'
          const initial = name[0]?.toUpperCase() ?? 'M'
          const stage = member.profiles?.stage_reached
          const joinedDate = new Date(member.joined_at).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric',
          })
          return (
            <div
              key={member.id}
              className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-[#D97706] to-[#EA580C]">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#1e293b] text-sm">{name}</div>
                {stage && (
                  <div className="text-xs text-[#64748b]">{stage}</div>
                )}
              </div>
              <div className="text-xs text-[#64748b] flex-shrink-0">Joined {joinedDate}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
