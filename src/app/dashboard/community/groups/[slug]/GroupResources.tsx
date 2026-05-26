import { type ReactNode } from 'react'
import { ExternalLink, BookOpen, Video, Mic, Users, FileText, Globe } from 'lucide-react'
import type { Resource, LaunchpadPhase } from '@/types'

const CATEGORY_ICONS: Record<string, ReactNode> = {
  'YouTube Channels':   <Video size={14} />,
  'Podcasts':           <Mic size={14} />,
  'Free Courses':       <BookOpen size={14} />,
  'Books':              <FileText size={14} />,
  'Communities':        <Users size={14} />,
  'Government Portals': <Globe size={14} />,
  'Newsletters':        <FileText size={14} />,
}

interface Props {
  resources: Resource[]
  launchpadPhases: LaunchpadPhase[]
}

export default function GroupResources({ resources, launchpadPhases }: Props) {
  const hasResources = resources.length > 0
  const hasLaunchpad = launchpadPhases.length > 0

  if (!hasResources && !hasLaunchpad) {
    return (
      <div className="text-center py-16 text-[#9A8B78] text-sm">
        No resources added to this group yet.
      </div>
    )
  }

  const byCategory: Record<string, Resource[]> = {}
  for (const r of resources) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  }

  return (
    <div className="space-y-6">
      {hasLaunchpad && (
        <div>
          <h3 className="font-bold text-[#2A1F14] mb-4" style={{ fontFamily: 'var(--font-lora)' }}>
            90-Day Launchpad
          </h3>
          <div className="space-y-3">
            {launchpadPhases.map(phase => (
              <div
                key={phase.phase}
                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {phase.phase}
                  </span>
                  <span className="font-bold text-[#2A1F14] text-sm">{phase.phase_title}</span>
                </div>
                <p className="text-xs text-[#5C4E3D] mb-3 leading-relaxed">
                  Milestone: {phase.phase_milestone}
                </p>
                <div className="space-y-1.5">
                  {phase.weeks.map(week => (
                    <div key={week.week} className="text-xs text-[#9A8B78]">
                      <span className="font-semibold text-[#5C4E3D]">Week {week.week}:</span>{' '}
                      {week.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-bold text-[#2A1F14] mb-3 flex items-center gap-2 text-sm">
            <span className="text-[#D97706]">{CATEGORY_ICONS[category] ?? <BookOpen size={14} />}</span>
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((resource, i) => (
              <div key={i} className="bg-white border border-[#EDDFCC] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#2A1F14] text-sm mb-0.5">
                      {resource.title}
                    </div>
                    {resource.provider && (
                      <div className="text-xs text-[#9A8B78] mb-1">{resource.provider}</div>
                    )}
                    {resource.annotation && (
                      <p className="text-xs text-[#5C4E3D] leading-relaxed">{resource.annotation}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: resource.stage === 'Beginner' ? '#DCFCE7' : resource.stage === 'Advanced' ? '#FEE2E2' : '#FEF3C7',
                        color: resource.stage === 'Beginner' ? '#059669' : resource.stage === 'Advanced' ? '#E11D48' : '#D97706',
                      }}
                    >
                      {resource.stage}
                    </span>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9A8B78] hover:text-[#D97706] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
