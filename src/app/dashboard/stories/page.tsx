'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Bookmark, BookmarkCheck } from 'lucide-react'

interface Story {
  id: string
  person_name: string | null
  is_anonymous: boolean
  current_role: string | null
  company: string | null
  story_text: string
  photo_url: string | null
  num_attempts: number | null
  optional_subject: string | null
  career_paths?: { title: string; slug: string } | null
}

const SAVED_STORIES_KEY = 'planbz_saved_stories'

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('stories')
        .select('*, career_paths(title, slug)')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
      setStories((data as Story[]) ?? [])
      setLoading(false)
    }
    load()
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_STORIES_KEY) || '[]')
      setSavedIds(new Set(saved))
    } catch { /* ignore */ }
  }, [])

  function toggleSave(e: React.MouseEvent, storyId: string) {
    e.preventDefault()
    e.stopPropagation()
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(storyId)) next.delete(storyId)
      else next.add(storyId)
      try { localStorage.setItem(SAVED_STORIES_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const careerTypes = ['All', ...Array.from(new Set(
    stories.map(s => s.career_paths?.title).filter(Boolean)
  ))] as string[]

  const filtered = stories.filter(s => {
    if (activeFilter === 'Saved') return savedIds.has(s.id)
    return activeFilter === 'All' || s.career_paths?.title === activeFilter
  })

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 bg-[#FEE2E2] text-[#E11D48] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
          <BookOpen size={12} /> Real People. Real Transitions.
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Move On Success Stories
        </h1>
        <p className="text-[#9A8B78] max-w-xl leading-relaxed">
          Ex-aspirants who found their path. Unfiltered stories of what the transition actually looks like.
        </p>
      </div>

      {/* Filters */}
      {!loading && stories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {savedIds.size > 0 && (
            <button
              onClick={() => setActiveFilter('Saved')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeFilter === 'Saved'
                  ? 'bg-[#E11D48] text-white'
                  : 'bg-[#FEE2E2] text-[#E11D48] hover:bg-[#E11D48] hover:text-white'
              }`}
            >
              <BookmarkCheck size={13} /> Saved ({savedIds.size})
            </button>
          )}
          {careerTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeFilter === type
                  ? 'bg-[#2A1F14] text-white'
                  : 'bg-white border-2 border-[#EDDFCC] text-[#5C4E3D] hover:border-[#D97706]'
              }`}
            >
              {type === 'All' ? `All (${stories.length})` : type}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-[#EDDFCC] h-80 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-[#EDDFCC] rounded-2xl">
          <BookOpen size={40} className="text-[#EDDFCC] mx-auto mb-4" />
          <p className="font-semibold text-lg mb-2">
            {activeFilter === 'Saved' ? 'No saved stories yet' : 'No stories yet'}
          </p>
          <p className="text-[#9A8B78] text-sm">
            {activeFilter === 'Saved'
              ? 'Bookmark stories that inspire you.'
              : 'Be the first to share your transition story.'}
          </p>
          {activeFilter === 'Saved' && (
            <button
              onClick={() => setActiveFilter('All')}
              className="mt-4 text-sm text-[#D97706] font-semibold hover:underline"
            >
              Browse all stories
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((story) => (
            <div
              key={story.id}
              className="bg-white border-2 border-[#EDDFCC] rounded-2xl overflow-hidden hover:border-[#D97706] transition-colors relative group"
            >
              {story.photo_url && (
                <div className="h-52 overflow-hidden">
                  <img
                    src={story.photo_url}
                    alt={story.is_anonymous ? 'Anonymous' : story.person_name ?? ''}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {!story.photo_url && (
                    <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] font-bold text-lg flex-shrink-0">
                      {story.is_anonymous ? '?' : (story.person_name?.[0] ?? '?')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2A1F14] text-lg" style={{ fontFamily: 'var(--font-lora)' }}>
                      {story.is_anonymous ? 'Anonymous' : story.person_name}
                    </h3>
                    <p className="text-sm text-[#9A8B78]">
                      {story.current_role}{story.company && ` · ${story.company}`}
                    </p>
                  </div>
                  {/* Save button */}
                  <button
                    onClick={(e) => toggleSave(e, story.id)}
                    title={savedIds.has(story.id) ? 'Unsave story' : 'Save story'}
                    className={`flex-shrink-0 p-2 rounded-xl transition-colors ${
                      savedIds.has(story.id)
                        ? 'bg-[#FEE2E2] text-[#E11D48]'
                        : 'text-[#CDBFA8] hover:bg-[#FEE2E2] hover:text-[#E11D48]'
                    }`}
                  >
                    {savedIds.has(story.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                  </button>
                </div>

                {story.career_paths?.title && (
                  <span className="inline-block text-xs font-bold bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full mb-3">
                    {story.career_paths.title}
                  </span>
                )}

                <blockquote className="text-[#5C4E3D] leading-relaxed border-l-4 border-[#D97706] pl-4 italic">
                  &ldquo;{story.story_text}&rdquo;
                </blockquote>

                {(story.num_attempts || story.optional_subject) && (
                  <div className="flex gap-4 mt-4 pt-4 border-t border-[#EDDFCC] text-xs text-[#9A8B78]">
                    {story.optional_subject && <span>Optional: <strong className="text-[#5C4E3D]">{story.optional_subject}</strong></span>}
                    {story.num_attempts && <span>Attempts: <strong className="text-[#5C4E3D]">{story.num_attempts}</strong></span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share your story CTA */}
      <div className="mt-10 bg-[#FFFBEB] border-2 border-[#D97706]/30 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Have a story to share?
        </h3>
        <p className="text-[#5C4E3D] mb-5 max-w-md mx-auto">
          Your transition story could be the turning point for someone still figuring it out.
        </p>
        <button className="bg-[#D97706] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#B45309] transition-colors">
          Share Your Story
        </button>
      </div>
    </div>
  )
}
