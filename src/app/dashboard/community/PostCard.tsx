'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { CommunityPost } from '@/types'

const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  career_doubts:    { bg: '#FEF3C7', color: '#D97706', label: '🎯 Career Doubts' },
  transition_story: { bg: '#DCFCE7', color: '#059669', label: '✨ Transition Story' },
  skill_building:   { bg: '#EDE9FE', color: '#7C3AED', label: '📚 Skill Building' },
  emotional_support:{ bg: '#FEE2E2', color: '#E11D48', label: '💙 Emotional Support' },
  general:          { bg: '#F5F5F5', color: '#6B7280', label: '💬 General' },
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Props {
  post: CommunityPost
  initialLiked: boolean
}

export default function PostCard({ post, initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [liking, setLiking] = useState(false)

  async function toggleLike() {
    if (liking) return
    setLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1)
    try {
      const res = await fetch(`/api/community/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLiked(wasLiked)
        setLikesCount(prev => wasLiked ? prev + 1 : prev - 1)
      }
    } catch {
      setLiked(wasLiked)
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1)
    } finally {
      setLiking(false)
    }
  }

  const tag = TAG_STYLES[post.tag] ?? TAG_STYLES.general
  const displayName = post.is_anonymous ? 'Anonymous' : (post.profiles?.full_name ?? 'Member')
  const initials = post.is_anonymous ? '?' : (post.profiles?.full_name?.[0]?.toUpperCase() ?? 'M')

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm hover:border-[#D97706]/50 transition-colors">
      <div className="flex gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white"
          style={{
            background: post.is_anonymous
              ? '#9CA3AF'
              : 'linear-gradient(135deg, #D97706, #EA580C)',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#1e293b] text-sm">{displayName}</div>
          <div className="text-xs text-[#64748b]">
            {post.profiles?.stage_reached && !post.is_anonymous
              ? `${post.profiles.stage_reached} · `
              : ''}
            {formatTimeAgo(post.created_at)}
          </div>
          <span
            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1"
            style={{ background: tag.bg, color: tag.color }}
          >
            {tag.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-[#333] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-5">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            liked ? 'text-[#E11D48]' : 'text-[#64748b] hover:text-[#E11D48]'
          }`}
        >
          <Heart size={15} fill={liked ? '#E11D48' : 'none'} strokeWidth={2} />
          {likesCount}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b]">
          <MessageCircle size={15} />
          {post.replies_count}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#D97706] ml-auto transition-colors">
          <Share2 size={13} />
          Share
        </button>
      </div>
    </div>
  )
}
