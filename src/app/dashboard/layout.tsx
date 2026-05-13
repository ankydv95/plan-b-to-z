'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserCareerMatch } from '@/types'
import {
  Home,
  Briefcase,
  Users,
  BookOpen,
  Library,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Brain,
  MapPin,
} from 'lucide-react'

const SIDEBAR_WIDTH = 280

const navLinks = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/careers', icon: MapPin, label: 'Browse Careers' },
  { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/dashboard/community', icon: Users, label: 'Community' },
  { href: '/dashboard/stories', icon: BookOpen, label: 'Stories' },
  { href: '/dashboard/content', icon: Library, label: 'Content Library' },
  { href: '/dashboard/wellbeing', icon: Heart, label: 'Wellbeing' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<UserCareerMatch[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    async function load() {
      try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      if (profileData?.assessment_completed) {
        const { data: matchData } = await supabase
          .from('user_career_matches')
          .select('*, career_paths(id, title, slug, domain)')
          .eq('user_id', user.id)
          .order('match_percentage', { ascending: false })
          .limit(8)
        if (matchData) setMatches(matchData)
      }
      } catch { /* ignore */ }
    }
    load()
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  function SidebarContent({ inDrawer = false }: { inDrawer?: boolean }) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Logo + close button (drawer only) */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#EDDFCC] flex-shrink-0">
          <Link href="/dashboard">
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              Plan <em className="text-[#D97706] not-italic">B</em> to Z
            </span>
          </Link>
          {inDrawer && (
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#FDF6EC] text-[#9A8B78] hover:text-[#2A1F14] transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Greeting */}
        <div className="px-5 py-4 border-b border-[#EDDFCC] flex-shrink-0">
          <p className="text-[#9A8B78] text-xs font-semibold uppercase tracking-widest mb-0.5">Welcome back</p>
          <p className="text-[#2A1F14] font-bold text-lg">Hey, {firstName} 👋</p>
        </div>

        {/* Assessment CTA */}
        {!profile?.assessment_completed && (
          <div className="px-4 pt-4 pb-3 border-b border-[#EDDFCC] flex-shrink-0">
            <Link
              href="/dashboard/assessment"
              className="flex items-center gap-2.5 bg-gradient-to-r from-[#D97706] to-[#B45309] text-white px-4 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <Brain size={16} />
              Start Career Assessment
            </Link>
          </div>
        )}

        {/* My Career Paths */}
        {matches.length > 0 && (
          <div className="px-4 py-4 border-b border-[#EDDFCC] flex-shrink-0">
            <p className="text-[#9A8B78] text-xs font-semibold uppercase tracking-widest mb-3 px-1">My Matches</p>
            <div className="space-y-0.5">
              {matches.slice(0, 5).map((match) => (
                <Link
                  key={match.id}
                  href={`/dashboard/careers/${match.career_paths?.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#FDF6EC] group transition-colors"
                >
                  <span className="text-sm text-[#5C4E3D] group-hover:text-[#2A1F14] font-medium truncate leading-tight">
                    {match.career_paths?.title}
                  </span>
                  <span
                    className="text-xs font-bold flex-shrink-0 ml-2 px-1.5 py-0.5 rounded-md"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono)',
                      color: (match.match_percentage ?? 0) >= 80 ? '#059669' : '#D97706',
                      background: (match.match_percentage ?? 0) >= 80 ? '#DCFCE7' : '#FEF3C7',
                    }}
                  >
                    {match.match_percentage}%
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/dashboard/careers"
              className="flex items-center gap-1 text-xs text-[#D97706] font-semibold mt-3 px-3 hover:underline"
            >
              Browse All <ChevronRight size={11} />
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 min-h-0">
          {navLinks.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === href
                : pathname === href || pathname.startsWith(href + '/')
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-0.5 font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-[#FEF3C7] text-[#D97706]'
                    : 'text-[#5C4E3D] hover:bg-[#FDF6EC] hover:text-[#2A1F14]'
                }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
              </a>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[#EDDFCC] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#9A8B78] hover:bg-[#FEE2E2] hover:text-[#E11D48] w-full font-semibold text-sm transition-all"
          >
            <LogOut size={17} />
            Log Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FEFDFB]">

      {/* ── Desktop Sidebar (lg+, fixed 280px) ── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-[#EDDFCC]"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile / Tablet Drawer (< lg) ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-[#EDDFCC] lg:hidden flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: SIDEBAR_WIDTH,
          transform: drawerOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
        }}
        aria-label="Navigation drawer"
      >
        <SidebarContent inDrawer />
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar — tablet/mobile only */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#EDDFCC] bg-white flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-[#FDF6EC] text-[#5C4E3D] hover:text-[#2A1F14] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-bold flex-1 text-center mr-10" style={{ fontFamily: 'var(--font-lora)' }}>
            Plan <em className="text-[#D97706] not-italic">B</em> to Z
          </span>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
