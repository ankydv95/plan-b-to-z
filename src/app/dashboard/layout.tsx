'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Home,
  MapPin,
  Users,
  Briefcase,
  Heart,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react'

const MAIN_TABS = [
  { href: '/dashboard',            icon: Home,      label: 'Home' },
  { href: '/dashboard/careers',    icon: MapPin,    label: 'Careers' },
  { href: '/dashboard/community',  icon: Users,     label: 'Community' },
  { href: '/dashboard/jobs',       icon: Briefcase, label: 'Jobs' },
  { href: '/dashboard/wellbeing',  icon: Heart,     label: 'Wellbeing' },
  { href: '/dashboard/stories',    icon: BookOpen,  label: 'Stories' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userInitial, setUserInitial] = useState('U')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const user = data?.user
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setUserInitial(profile.full_name[0]?.toUpperCase() ?? 'U')
        }

        // First visit → dashboard, return visits → community
        if (pathname === '/dashboard') {
          const visited = localStorage.getItem('pb2z_visited')
          if (visited) {
            router.replace('/dashboard/community')
          } else {
            localStorage.setItem('pb2z_visited', '1')
          }
        }
      } catch { /* ignore */ }
    }
    load()
  }, [pathname, router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('pb2z_visited')
    router.push('/')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* Top Nav */}
      <header className="flex-shrink-0 bg-white border-b border-[#e2e8f0] h-14 flex items-center px-4 md:px-6 z-30">

        {/* Logo */}
        <Link href="/dashboard" className="flex-shrink-0 mr-4 md:mr-6">
          <span className="text-base font-bold text-[#1e293b]" style={{ fontFamily: 'var(--font-lora)' }}>
            Plan <em className="text-[#EA580C] not-italic">B</em> to Z
          </span>
        </Link>

        {/* Desktop center tabs */}
        <nav className="hidden md:flex flex-1 items-end justify-center h-full gap-1">
          {MAIN_TABS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 h-full text-sm font-semibold border-b-2 transition-colors ${
                isActive(href)
                  ? 'text-[#EA580C] border-[#EA580C]'
                  : 'text-[#64748b] border-transparent hover:text-[#1e293b]'
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <Link
            href="/dashboard/settings"
            className="w-8 h-8 rounded-full bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            <Settings size={15} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EA580C] to-[#D97706] flex items-center justify-center text-white text-sm font-bold"
            >
              {userInitial}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 w-36">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#475569] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors"
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#475569] hover:bg-[#FEE2E2] hover:text-[#E11D48] w-full transition-colors"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden flex-shrink-0 bg-white border-t border-[#e2e8f0] flex items-stretch fixed bottom-0 left-0 right-0 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MAIN_TABS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive(href) ? 'text-[#EA580C]' : 'text-[#cbd5e1]'
            }`}
          >
            <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />
            <span className="text-[9px] font-semibold leading-none">{label}</span>
            {isActive(href) && <div className="w-1 h-1 rounded-full bg-[#EA580C] mt-0.5" />}
          </Link>
        ))}
      </nav>

    </div>
  )
}
