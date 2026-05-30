'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Sparkles, Bookmark, BookmarkCheck } from 'lucide-react'

interface Career {
  id: string
  title: string
  slug: string
  domain: string
  description: string | null
  salary_entry: string | null
  salary_senior: string | null
  difficulty_rating: number | null
  match_percentage: number | null
}

interface Props {
  careers: Career[]
  domains: string[]
}

const PINS_KEY = 'planbz_pinned_careers'

const domainColors: Record<string, { bg: string; color: string }> = {
  'Policy': { bg: '#E0F2FE', color: '#0284C7' },
  'Law': { bg: '#EDE9FE', color: '#7C3AED' },
  'Education': { bg: '#DCFCE7', color: '#059669' },
  'Media': { bg: '#FEE2E2', color: '#E11D48' },
  'Management': { bg: '#FEF3C7', color: '#D97706' },
  'Banking': { bg: '#CCFBF1', color: '#0D9488' },
  'Finance': { bg: '#CCFBF1', color: '#0D9488' },
  'International': { bg: '#E0F2FE', color: '#0284C7' },
  'Data': { bg: '#EDE9FE', color: '#7C3AED' },
  'Social': { bg: '#DCFCE7', color: '#059669' },
  'Communication': { bg: '#FFEDD5', color: '#EA580C' },
  'Environment': { bg: '#DCFCE7', color: '#059669' },
  'Entrepreneurship': { bg: '#FEF3C7', color: '#D97706' },
  'Armed': { bg: '#FEE2E2', color: '#E11D48' },
  'Psychology': { bg: '#EDE9FE', color: '#7C3AED' },
  'Creative': { bg: '#FFEDD5', color: '#EA580C' },
}

function getDomainColor(domain: string) {
  const key = Object.keys(domainColors).find(k => domain.includes(k))
  return key ? domainColors[key] : { bg: '#FEF3C7', color: '#D97706' }
}

export default function CareerBrowser({ careers, domains }: Props) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())

  const hasMatches = careers.some(c => c.match_percentage !== null)

  // Load pins from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PINS_KEY) || '[]')
      setPinnedIds(new Set(saved))
    } catch { /* ignore */ }
  }, [])

  // Default to Recommended tab when matches load
  useEffect(() => {
    if (hasMatches) setActiveFilter('Recommended')
  }, [hasMatches])

  function togglePin(e: React.MouseEvent, careerId: string) {
    e.preventDefault()
    e.stopPropagation()
    setPinnedIds(prev => {
      const next = new Set(prev)
      if (next.has(careerId)) next.delete(careerId)
      else next.add(careerId)
      try { localStorage.setItem(PINS_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const filtered = useMemo(() => {
    const base = careers.filter(c => {
      const matchesSearch = !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.domain.toLowerCase().includes(search.toLowerCase()) ||
        (c.description?.toLowerCase().includes(search.toLowerCase()))
      if (activeFilter === 'Recommended') return matchesSearch && c.match_percentage !== null
      if (activeFilter === 'Pinned') return matchesSearch && pinnedIds.has(c.id)
      return matchesSearch && (activeFilter === 'All' || c.domain === activeFilter)
    })
    if (activeFilter === 'Recommended') {
      return [...base].sort((a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0))
    }
    return base
  }, [careers, search, activeFilter, pinnedIds])

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Browse Career Paths
        </h1>
        <p className="text-[#64748b]">75+ paths built for the UPSC-prepared mind.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search careers, domains..."
          className="input-field pl-11"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {hasMatches && (
          <button
            onClick={() => setActiveFilter('Recommended')}
            className={`flex items-center gap-1.5 tag px-4 py-2 cursor-pointer transition-all font-bold ${
              activeFilter === 'Recommended'
                ? 'bg-[#D97706] text-white'
                : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#D97706] hover:text-white'
            }`}
          >
            <Sparkles size={13} /> Recommended
          </button>
        )}
        {pinnedIds.size > 0 && (
          <button
            onClick={() => setActiveFilter('Pinned')}
            className={`flex items-center gap-1.5 tag px-4 py-2 cursor-pointer transition-all font-bold ${
              activeFilter === 'Pinned'
                ? 'bg-[#1e293b] text-white'
                : 'bg-[#F5F0EB] text-[#475569] hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <BookmarkCheck size={13} /> Pinned ({pinnedIds.size})
          </button>
        )}
        <button
          onClick={() => setActiveFilter('All')}
          className={`tag px-4 py-2 cursor-pointer transition-all ${
            activeFilter === 'All'
              ? 'bg-[#1e293b] text-white'
              : 'bg-[#e2e8f0] text-[#475569] hover:bg-[#1e293b] hover:text-white'
          }`}
        >
          All ({careers.length})
        </button>
        {domains.map(domain => {
          const { bg, color } = getDomainColor(domain)
          const count = careers.filter(c => c.domain === domain).length
          return (
            <button
              key={domain}
              onClick={() => setActiveFilter(domain)}
              className={`tag px-4 py-2 cursor-pointer transition-all`}
              style={{
                background: activeFilter === domain ? color : bg,
                color: activeFilter === domain ? 'white' : color,
                outline: activeFilter === domain ? `2px solid ${color}` : 'none',
                outlineOffset: '1px',
              }}
            >
              {domain.split(' ')[0]} ({count})
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-[#64748b] mb-5">
        Showing {filtered.length}{activeFilter !== 'All' ? '' : ` of ${careers.length}`} career paths
        {search && ` for "${search}"`}
      </p>

      {/* Career Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#64748b] text-lg">
            {activeFilter === 'Pinned' ? 'No pinned careers yet.' : 'No careers found matching your search.'}
          </p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('All') }}
            className="btn-secondary mt-4 text-sm py-2 px-5"
          >
            {activeFilter === 'Pinned' ? 'Browse all careers' : 'Clear filters'}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(career => {
            const { bg, color } = getDomainColor(career.domain)
            const isPinned = pinnedIds.has(career.id)
            return (
              <Link
                key={career.id}
                href={`/dashboard/careers/${career.slug}`}
                className="card bg-white p-6 rounded-2xl flex flex-col group relative"
              >
                {/* Domain tag */}
                <div className="mb-3">
                  <span className="tag" style={{ background: bg, color }}>
                    {career.domain.split(',')[0].split('&')[0].trim()}
                  </span>
                </div>

                <h3
                  className="font-bold text-lg mb-2 group-hover:text-[#D97706] transition-colors flex-1 leading-snug"
                  style={{ fontFamily: 'var(--font-lora)' }}
                >
                  {career.title}
                </h3>
                <p className="text-sm text-[#64748b] mb-4 line-clamp-2">{career.description}</p>

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-[#e2e8f0]">
                  {/* Salary row */}
                  <div className="text-xs text-[#475569] mb-3">
                    <span className="font-semibold" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                      {career.salary_entry}
                    </span>
                    {career.salary_senior && (
                      <span className="text-[#64748b]"> → {career.salary_senior}</span>
                    )}
                  </div>

                  {/* Bottom row: Explore + right-side markers */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-[#D97706] font-semibold">
                      Explore <ArrowRight size={14} />
                    </span>

                    {/* Bottom-right markers */}
                    <div className="flex items-center gap-2">
                      {career.match_percentage !== null && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{
                            background: career.match_percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
                            color: career.match_percentage >= 70 ? '#059669' : '#D97706',
                            fontFamily: 'var(--font-jetbrains-mono)',
                          }}
                        >
                          <Sparkles size={10} />
                          {career.match_percentage}%
                        </span>
                      )}
                      <button
                        onClick={(e) => togglePin(e, career.id)}
                        title={isPinned ? 'Unpin career' : 'Pin career'}
                        className={`p-1 rounded-lg transition-colors ${
                          isPinned
                            ? 'text-[#1e293b] bg-[#e2e8f0]'
                            : 'text-[#CDBFA8] hover:text-[#1e293b] hover:bg-[#e2e8f0]'
                        }`}
                      >
                        {isPinned
                          ? <BookmarkCheck size={16} />
                          : <Bookmark size={16} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
