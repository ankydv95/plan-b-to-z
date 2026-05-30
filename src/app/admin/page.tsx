import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Briefcase, BookOpen, Plus } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalCareers },
    { count: publishedCareers },
    { count: draftCareers },
    { count: totalJobs },
    { count: pendingJobs },
    { count: pendingStories },
  ] = await Promise.all([
    supabase.from('career_paths').select('*', { count: 'exact', head: true }),
    supabase.from('career_paths').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('career_paths').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('job_listings').select('*', { count: 'exact', head: true }),
    supabase.from('job_listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('is_approved', false),
  ])

  const stats = [
    {
      label: 'Career Paths',
      value: totalCareers ?? 0,
      sub: `${publishedCareers ?? 0} published · ${draftCareers ?? 0} draft`,
      icon: MapPin,
      href: '/admin/careers',
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      label: 'Job Listings',
      value: totalJobs ?? 0,
      sub: `${pendingJobs ?? 0} pending review`,
      icon: Briefcase,
      href: '/admin/jobs',
      color: '#0284C7',
      bg: '#E0F2FE',
    },
    {
      label: 'Stories',
      value: pendingStories ?? 0,
      sub: 'pending approval',
      icon: BookOpen,
      href: '/admin/stories',
      color: '#059669',
      bg: '#DCFCE7',
    },
  ]

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>
          Admin Dashboard
        </h1>
        <p className="text-[#64748b]">Manage all content for Plan B to Z.</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, sub, icon: Icon, href, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-6 hover:border-[#D97706] transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-jetbrains-mono)', color }}>
                {value}
              </span>
            </div>
            <p className="font-bold text-[#1e293b] mb-1">{label}</p>
            <p className="text-xs text-[#64748b]">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/careers/new"
            className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#B45309] transition-colors"
          >
            <Plus size={16} /> New Career Path
          </Link>
          <Link
            href="/admin/jobs/new"
            className="flex items-center gap-2 bg-white border-2 border-[#e2e8f0] text-[#475569] px-5 py-2.5 rounded-xl font-semibold text-sm hover:border-[#D97706] transition-colors"
          >
            <Plus size={16} /> Add Job Listing
          </Link>
        </div>
      </div>
    </div>
  )
}
