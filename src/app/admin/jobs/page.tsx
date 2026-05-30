import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*, career_paths(title, slug)')
    .order('posted_at', { ascending: false })
    .limit(100)

  const pending = jobs?.filter(j => j.status === 'pending').length ?? 0

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>Job Listings</h1>
          <p className="text-[#64748b]">
            {jobs?.length ?? 0} total
            {pending > 0 && <> · <span className="text-[#D97706] font-semibold">{pending} pending review</span></>}
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#B45309] transition-colors flex-shrink-0"
        >
          <Plus size={16} /> Add Job
        </Link>
      </div>

      {/* Scraper notice */}
      <div className="bg-[#FEF3C7] border-2 border-[#D97706]/30 rounded-2xl p-5 mb-8">
        <p className="font-semibold text-[#D97706] mb-1">Job Scraper — Coming Soon</p>
        <p className="text-sm text-[#475569]">
          Automated scraping from LinkedIn, Naukri, government portals, and company sites will be configured here.
          Scraped jobs will appear with status &ldquo;pending&rdquo; for your review before going live.
        </p>
      </div>

      <div className="bg-white border-2 border-[#e2e8f0] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e2e8f0] text-left">
              <th className="px-6 py-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Career Path</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).map((job, i) => (
              <tr key={job.id} className={`border-b border-[#e2e8f0] last:border-0 hover:bg-[#ffffff] transition-colors ${i % 2 === 0 ? '' : 'bg-[#ffffff]'}`}>
                <td className="px-6 py-4">
                  <span className="font-semibold text-sm text-[#1e293b]">{job.role_title}</span>
                  {job.location && <div className="text-xs text-[#64748b] mt-0.5">{job.location}</div>}
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-sm text-[#475569]">{job.company_name}</span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-xs text-[#64748b]">
                    {(job as { career_paths?: { title?: string } }).career_paths?.title ?? '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: job.status === 'active' ? '#DCFCE7' : job.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                      color: job.status === 'active' ? '#059669' : job.status === 'pending' ? '#D97706' : '#E11D48',
                    }}
                  >
                    {job.status ?? 'active'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/jobs/${job.id}`} className="text-sm font-semibold text-[#D97706] hover:underline">
                      Edit
                    </Link>
                    {job.apply_url && (
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="text-[#64748b] hover:text-[#1e293b]">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!jobs || jobs.length === 0) && (
          <div className="text-center py-16 text-[#64748b]">
            No job listings yet.{' '}
            <Link href="/admin/jobs/new" className="text-[#D97706] font-semibold hover:underline">Add the first one.</Link>
          </div>
        )}
      </div>
    </div>
  )
}
