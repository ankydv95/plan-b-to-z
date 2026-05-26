'use client'

import { useState } from 'react'
import { Send, Lock } from 'lucide-react'
import type { PostTag, CommunityPost } from '@/types'

const TAGS: { value: PostTag; label: string }[] = [
  { value: 'general',           label: '💬 General' },
  { value: 'career_doubts',     label: '🎯 Career Doubts' },
  { value: 'transition_story',  label: '✨ Transition Story' },
  { value: 'skill_building',    label: '📚 Skill Building' },
  { value: 'emotional_support', label: '💙 Emotional Support' },
]

interface Props {
  groupId?: string
  userInitial: string
  onPost: (post: CommunityPost) => void
}

export default function ComposePost({ groupId, userInitial, onPost }: Props) {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState<PostTag>('general')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          tag,
          is_anonymous: isAnonymous,
          group_id: groupId ?? null,
        }),
      })
      const json = await res.json() as { data?: CommunityPost; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to post.')
      } else if (json.data) {
        onPost(json.data)
        setContent('')
        setTag('general')
        setIsAnonymous(false)
        setExpanded(false)
      }
    } catch {
      setError('Failed to post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-[#EDDFCC] rounded-2xl p-4 shadow-sm">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-[#D97706] to-[#EA580C]">
          {userInitial}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Share something with the community..."
            rows={expanded ? 3 : 1}
            maxLength={2000}
            className="w-full resize-none bg-[#F9F6F2] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] placeholder-[#9A8B78] outline-none border border-transparent focus:border-[#D97706] transition-colors"
          />
          {expanded && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TAGS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTag(t.value)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      tag === t.value
                        ? 'bg-[#D97706] text-white'
                        : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#D97706] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsAnonymous(prev => !prev)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    isAnonymous
                      ? 'bg-[#2A1F14] text-white'
                      : 'bg-[#F5F5F5] text-[#9A8B78] hover:bg-[#2A1F14] hover:text-white'
                  }`}
                >
                  <Lock size={11} />
                  {isAnonymous ? 'Posting anonymously' : 'Post anonymously'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting}
                  className="flex items-center gap-1.5 bg-[#D97706] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#B45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={12} />
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
              {error && (
                <p className="text-xs text-[#E11D48] mt-2">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
