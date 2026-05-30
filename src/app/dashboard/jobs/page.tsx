'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, MapPin, ExternalLink, Wifi, Star, Bookmark, BookmarkCheck } from 'lucide-react'

interface Job {
  id: string
  company_name: string
  role_title: string
  location: string | null
  salary_range: string | null
  experience_level: string | null
  remote_available: boolean
  apply_url: string | null
  is_aspirant_friendly: boolean
  posted_at: string
  career_paths?: { title: string; slug: string; domain: string } | null
}

const SAVED_JOBS_KEY = 'planbz_saved_jobs'
const QUICK_FILTERS = ['All', 'Aspirant Friendly', 'Remote', 'Entry Level']

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeDomain, setActiveDomain] = useState('All')
  const [search, setSearch] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('job_listings')
        .select('*, career_paths(title, slug, domain)')
        .eq('status', 'active')
        .order('posted_at', { ascending: false })
      setJobs((data as Job[]) ?? [])
      setLoading(false)
    }
    load()
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]')
      setSavedIds(new Set(saved))
    } catch { /* ignore */ }
  }, [])

  function toggleSave(e: React.MouseEvent, jobId: string) {
    e.preventDefault()
    e.stopPropagation()
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      try { localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const domains = ['All', ...Array.from(new Set(jobs.map(j => j.career_paths?.title).filter(Boolean)))] as string[]

  const filtered = jobs.filter(job => {
    const matchesSearch = !search ||
      job.role_title.toLowerCase().includes(search.toLowerCase()) ||
      job.company_name.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase()) ||
      job.career_paths?.title.toLowerCase().includes(search.toLowerCase())

    if (activeFilter === 'Saved') return matchesSearch && savedIds.has(job.id)

    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Aspirant Friendly' && job.is_aspirant_friendly) ||
      (activeFilter === 'Remote' && job.remote_available) ||
      (activeFilter === 'Entry Level' && job.experience_level?.toLowerCase().includes('entry'))

    const matchesDomain =
      activeDomain === 'All' || job.career_paths?.title === activeDomain

    return matchesSearch && matchesFilter && matchesDomain
  })

  function timeAgo(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#059669] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
          <Briefcase size={12} /> Aspirant-Friendly Employers
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Job Board
        </h1>
        <p className="text-[#64748b] max-w-xl">
          Roles from organisations that actively value the UPSC background — discipline, analytical depth, and integrity.
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search roles, companies, locations..."
          className="w-full max-w-xl border-2 border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706] transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {savedIds.size > 0 && (
            <button
              onClick={() => setActiveFilter('Saved')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeFilter === 'Saved'
                  ? 'bg-[#1e293b] text-white'
                  : 'bg-white border-2 border-[#e2e8f0] text-[#475569] hover:border-[#D97706]'
              }`}
            >
              <BookmarkCheck size={13} /> Saved ({savedIds.size})
            </button>
          )}
          {QUICK_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeFilter === f
                  ? 'bg-[#1e293b] text-white'
                  : 'bg-white border-2 border-[#e2e8f0] text-[#475569] hover:border-[#D97706]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Career type filter */}
        {domains.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-2">Career Type</p>
            <div className="flex flex-wrap gap-2">
              {domains.map(d => (
                <button
                  key={d}
                  onClick={() => setActiveDomain(d)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    activeDomain === d
                      ? 'bg-[#D97706] text-white'
                      : 'bg-white border-2 border-[#e2e8f0] text-[#475569] hover:border-[#D97706]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-[#64748b] mb-5">
        Showing {filtered.length} of {jobs.length} listings
      </p>

      {/* Job listings */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#e2e8f0] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-[#e2e8f0] rounded-2xl">
          <Briefcase size={40} className="text-[#e2e8f0] mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">
            {activeFilter === 'Saved' ? 'No saved jobs yet' : 'No listings found'}
          </p>
          <p className="text-sm text-[#64748b]">
            {activeFilter === 'Saved' ? 'Bookmark jobs to save them here.' : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(job => (
            <div
              key={job.id}
              className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-6 hover:border-[#D97706] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {job.is_aspirant_friendly && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-[#DCFCE7] text-[#059669] px-2.5 py-1 rounded-full">
                        <Star size={10} fill="#059669" /> Aspirant Friendly
                      </span>
                    )}
                    {job.remote_available && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-[#E0F2FE] text-[#0284C7] px-2.5 py-1 rounded-full">
                        <Wifi size={10} /> Remote
                      </span>
                    )}
                    {job.career_paths?.title && (
                      <span className="text-xs font-semibold bg-[#FEF3C7] text-[#D97706] px-2.5 py-1 rounded-full">
                        {job.career_paths.title}
                      </span>
                    )}
                  </div>

                  {/* Title + company */}
                  <h3 className="font-bold text-lg text-[#1e293b] leading-snug mb-0.5" style={{ fontFamily: 'var(--font-lora)' }}>
                    {job.role_title}
                  </h3>
                  <p className="text-[#475569] font-semibold text-sm mb-3">{job.company_name}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-xs text-[#64748b]">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {job.location}
                      </span>
                    )}
                    {job.salary_range && (
                      <span className="font-semibold text-[#059669]">{job.salary_range}</span>
                    )}
                    {job.experience_level && (
                      <span>{job.experience_level}</span>
                    )}
                    <span>Posted {timeAgo(job.posted_at)}</span>
                  </div>
                </div>

                {/* Apply + Save */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => toggleSave(e, job.id)}
                    title={savedIds.has(job.id) ? 'Unsave job' : 'Save job'}
                    className={`p-2.5 rounded-xl border-2 transition-colors ${
                      savedIds.has(job.id)
                        ? 'bg-[#1e293b] border-[#1e293b] text-white'
                        : 'border-[#e2e8f0] text-[#64748b] hover:border-[#1e293b] hover:text-[#1e293b]'
                    }`}
                  >
                    {savedIds.has(job.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                  {job.apply_url ? (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#B45309] transition-colors"
                    >
                      Apply <ExternalLink size={14} />
                    </a>
                  ) : (
                    <button className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#B45309] transition-colors">
                      Apply <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post a job CTA */}
      <div className="mt-10 bg-[#FFFBEB] border-2 border-[#D97706]/30 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Are you an employer?
        </h3>
        <p className="text-[#475569] mb-5 text-sm max-w-md mx-auto">
          Post a role and reach thousands of ex-UPSC aspirants — disciplined, analytical, and mission-driven professionals.
        </p>
        <button className="bg-[#D97706] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#B45309] transition-colors">
          Post a Job — Free
        </button>
      </div>
    </div>
  )
}
