'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import CareerBrowser from './CareerBrowser'

export default function CareersPage() {
  const [careers, setCareers] = useState<Parameters<typeof CareerBrowser>[0]['careers']>([])
  const [domains, setDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [{ data: careerPaths }, { data: dbMatches }] = await Promise.all([
        supabase
          .from('career_paths')
          .select('id, title, slug, domain, description, salary_entry, salary_senior, difficulty_rating')
          .eq('is_active', true)
          .order('title'),
        supabase
          .from('user_career_matches')
          .select('career_path_id, match_percentage')
          .eq('user_id', user.id),
      ])

      let matchMap = new Map((dbMatches || []).map(m => [m.career_path_id, m.match_percentage]))

      // If no DB matches, fall back to localStorage (saved by assessment page)
      if ((!dbMatches || dbMatches.length === 0)) {
        try {
          const saved = JSON.parse(localStorage.getItem('planbz_assessment') || '{}')
          if (saved.done && Array.isArray(saved.careerMatches) && saved.careerMatches.length > 0) {
            matchMap = new Map(
              saved.careerMatches.map((m: { career_path_id: string; match_percentage: number }) =>
                [m.career_path_id, m.match_percentage]
              )
            )
          }
        } catch { /* ignore */ }
      }

      const careersWithMatch = (careerPaths || []).map(cp => ({
        ...cp,
        match_percentage: matchMap.get(cp.id) ?? null,
      }))
      const uniqueDomains = [...new Set((careerPaths || []).map(cp => cp.domain))].sort()

      setCareers(careersWithMatch)
      setDomains(uniqueDomains)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-[#e2e8f0] rounded-xl w-48 mb-2" />
        <div className="h-4 bg-[#e2e8f0] rounded-xl w-72 mb-8" />
        <div className="flex gap-2 flex-wrap mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#e2e8f0] rounded-full w-24" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border-2 border-[#e2e8f0] h-48" />
          ))}
        </div>
      </div>
    )
  }

  return <CareerBrowser careers={careers} domains={domains} />
}
