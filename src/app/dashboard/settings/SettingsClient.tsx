'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { LogOut, Settings, User, Mail, BookOpen, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function SettingsClient({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>Settings</h1>
        <p className="text-[#9A8B78]">Manage your account</p>
      </div>

      {/* Profile Info */}
      <div className="card bg-white p-6 rounded-2xl mb-5">
        <h2 className="font-bold text-xl mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-lora)' }}>
          <User size={20} className="text-[#D97706]" />
          Profile
        </h2>
        <div className="space-y-4">
          {[
            { icon: User, label: 'Full Name', value: profile?.full_name ?? 'Not set' },
            { icon: Mail, label: 'Email', value: profile?.email ?? 'Not set' },
            { icon: BookOpen, label: 'Education', value: profile?.education ?? 'Not set' },
            { icon: Settings, label: 'Optional Subject', value: profile?.optional_subject ?? 'Not set' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-4 bg-[#FDF6EC] rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#EDDFCC] flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-[#D97706]" />
              </div>
              <div>
                <div className="text-xs text-[#9A8B78] font-semibold">{label}</div>
                <div className="font-semibold text-sm mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment */}
      <div className="card bg-white p-6 rounded-2xl mb-5">
        <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Assessment</h2>
        {profile?.assessment_completed ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#059669]">Assessment completed</p>
              <p className="text-sm text-[#9A8B78] mt-0.5">Your career matches are ready</p>
            </div>
            <Link
              href="/dashboard/assessment"
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Retake
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#9A8B78]">Not started</p>
              <p className="text-sm text-[#9A8B78] mt-0.5">Complete assessment to get career matches</p>
            </div>
            <Link href="/dashboard/assessment" className="btn-primary text-sm py-2 px-4">
              Start Now
            </Link>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="card bg-white p-6 rounded-2xl">
        <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Account</h2>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-[#E11D48] font-semibold hover:bg-[#FEE2E2] px-4 py-3 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  )
}
