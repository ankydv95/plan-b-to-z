import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Star } from 'lucide-react'

export default async function AdminCareersPage() {
  const supabase = await createClient()
  const { data: careers } = await supabase
    .from('career_paths')
    .select('id, title, slug, domain, status, difficulty_rating, created_at')
    .order('title')

  const domainColors: Record<string, string> = {
    'Policy': '#0284C7', 'Law': '#7C3AED', 'Education': '#059669',
    'Media': '#E11D48', 'Management': '#D97706', 'Banking': '#0D9488',
    'Finance': '#0D9488', 'International': '#0284C7', 'Data': '#7C3AED',
    'Social': '#059669', 'Communication': '#EA580C', 'Environment': '#059669',
    'Entrepreneurship': '#D97706', 'Armed': '#E11D48', 'Psychology': '#7C3AED',
    'Creative': '#EA580C',
  }

  function getDomainColor(domain: string) {
    const key = Object.keys(domainColors).find(k => domain.includes(k))
    return key ? domainColors[key] : '#D97706'
  }

  const published = careers?.filter(c => c.status === 'published').length ?? 0
  const drafts = careers?.filter(c => c.status !== 'published').length ?? 0

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>Career Paths</h1>
          <p className="text-[#9A8B78]">
            {careers?.length ?? 0} total &nbsp;·&nbsp;
            <span className="text-[#059669] font-semibold">{published} published</span> &nbsp;·&nbsp;
            <span className="text-[#D97706] font-semibold">{drafts} draft</span>
          </p>
        </div>
        <Link
          href="/admin/careers/new"
          className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#B45309] transition-colors flex-shrink-0"
        >
          <Plus size={16} /> New Career
        </Link>
      </div>

      <div className="bg-white border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EDDFCC] text-left">
              <th className="px-6 py-4 text-xs font-semibold text-[#9A8B78] uppercase tracking-wider">Title</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#9A8B78] uppercase tracking-wider hidden md:table-cell">Domain</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#9A8B78] uppercase tracking-wider hidden sm:table-cell">Difficulty</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#9A8B78] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#9A8B78] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(careers ?? []).map((career, i) => (
              <tr
                key={career.id}
                className={`border-b border-[#EDDFCC] last:border-0 hover:bg-[#FEFDFB] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FEFDFB]'}`}
              >
                <td className="px-6 py-4">
                  <span className="font-semibold text-sm text-[#2A1F14]">{career.title}</span>
                  <div className="text-xs text-[#9A8B78] mt-0.5 font-mono">{career.slug}</div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: getDomainColor(career.domain), background: getDomainColor(career.domain) + '20' }}
                  >
                    {career.domain.split(',')[0].split('&')[0].trim()}
                  </span>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        size={11}
                        fill={j < (career.difficulty_rating ?? 0) ? '#D97706' : 'none'}
                        stroke={j < (career.difficulty_rating ?? 0) ? '#D97706' : '#EDDFCC'}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: career.status === 'published' ? '#DCFCE7' : '#FEF3C7',
                      color: career.status === 'published' ? '#059669' : '#D97706',
                    }}
                  >
                    {career.status ?? 'draft'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/careers/${career.id}`}
                      className="text-sm font-semibold text-[#D97706] hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/careers/${career.slug}`}
                      target="_blank"
                      className="text-sm font-semibold text-[#9A8B78] hover:text-[#2A1F14]"
                    >
                      Preview
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!careers || careers.length === 0) && (
          <div className="text-center py-16 text-[#9A8B78]">
            No career paths yet.{' '}
            <Link href="/admin/careers/new" className="text-[#D97706] font-semibold hover:underline">
              Create the first one.
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
