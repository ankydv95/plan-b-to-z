'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Story {
  id: string
  person_name: string | null
  is_anonymous: boolean
  current_role: string | null
  company: string | null
  story_text: string | null
  is_approved: boolean
  created_at: string
  career_paths?: { title: string } | null
}

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStories()
  }, [filter])

  async function loadStories() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('stories')
      .select('*, career_paths(title)')
      .order('created_at', { ascending: false })

    if (filter === 'pending') query = query.eq('is_approved', false)
    if (filter === 'approved') query = query.eq('is_approved', true)

    const { data } = await query
    setStories((data as Story[]) ?? [])
    setLoading(false)
  }

  async function approve(id: string) {
    const supabase = createClient()
    await supabase.from('stories').update({ is_approved: true }).eq('id', id)
    setStories(prev => prev.map(s => s.id === id ? { ...s, is_approved: true } : s))
  }

  async function reject(id: string) {
    if (!confirm('Delete this story? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('stories').delete().eq('id', id)
    setStories(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>Stories</h1>
        <p className="text-[#64748b]">Review and approve transition stories from users.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-[#D97706] text-white'
                : 'bg-white border-2 border-[#e2e8f0] text-[#475569] hover:border-[#D97706]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#e2e8f0] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 text-[#64748b] bg-white border-2 border-[#e2e8f0] rounded-2xl">
          No {filter === 'all' ? '' : filter} stories.
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map(story => (
            <div key={story.id} className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1e293b]">
                      {story.is_anonymous ? 'Anonymous' : story.person_name ?? 'Unknown'}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: story.is_approved ? '#DCFCE7' : '#FEF3C7',
                        color: story.is_approved ? '#059669' : '#D97706',
                      }}
                    >
                      {story.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-sm text-[#64748b] mt-0.5">
                    {story.current_role}{story.company && ` at ${story.company}`}
                    {story.career_paths?.title && <span className="ml-2">· {story.career_paths.title}</span>}
                  </div>
                  <div className="text-xs text-[#64748b] mt-0.5">
                    {new Date(story.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!story.is_approved && (
                    <button
                      onClick={() => approve(story.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DCFCE7] text-[#059669] rounded-xl text-sm font-semibold hover:bg-[#059669] hover:text-white transition-colors"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => reject(story.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE2E2] text-[#E11D48] rounded-xl text-sm font-semibold hover:bg-[#E11D48] hover:text-white transition-colors"
                  >
                    <XCircle size={14} /> Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed line-clamp-4">{story.story_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
