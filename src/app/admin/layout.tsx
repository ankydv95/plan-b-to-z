import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, MapPin, Briefcase, BookOpen, Library, Users, ArrowLeft } from 'lucide-react'

const navLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/careers', icon: MapPin, label: 'Career Paths' },
  { href: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/admin/stories', icon: BookOpen, label: 'Stories' },
  { href: '/admin/content', icon: Library, label: 'Content Library' },
  { href: '/admin/team', icon: Users, label: 'Team' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role ?? '')) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#ffffff]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-[#e2e8f0] w-64">
        <div className="px-5 py-5 border-b border-[#e2e8f0]">
          <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
            Plan <em className="text-[#D97706] not-italic">B</em> to Z
          </span>
          <span className="ml-2 text-xs bg-[#FEE2E2] text-[#E11D48] font-bold px-2 py-0.5 rounded-full">
            ADMIN
          </span>
        </div>

        <div className="px-5 py-3 border-b border-[#e2e8f0]">
          <p className="text-xs text-[#64748b] font-semibold uppercase tracking-widest">Logged in as</p>
          <p className="text-sm font-bold text-[#1e293b] truncate">{profile.full_name ?? user.email}</p>
          <span className="text-xs bg-[#FEF3C7] text-[#D97706] font-semibold px-2 py-0.5 rounded-full capitalize">
            {profile.role}
          </span>
        </div>

        <nav className="flex-1 px-3 py-3">
          {navLinks.map(({ href, icon: Icon, label, exact }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-0.5 font-semibold text-sm text-[#475569] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-all"
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-[#e2e8f0]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] font-semibold text-sm transition-all"
          >
            <ArrowLeft size={17} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0] bg-white flex-shrink-0">
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
            Plan <em className="text-[#D97706] not-italic">B</em> to Z
          </span>
          <span className="text-xs bg-[#FEE2E2] text-[#E11D48] font-bold px-2 py-0.5 rounded-full">ADMIN</span>
          <Link href="/dashboard" className="ml-auto text-sm text-[#64748b] font-semibold">
            Back to App
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
