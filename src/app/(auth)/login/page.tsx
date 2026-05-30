'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
          Plan <em className="text-[#D97706] not-italic">B</em> to Z
        </span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-[#e2e8f0] p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Welcome back
        </h1>
        <p className="text-[#64748b] mb-8">Continue your journey.</p>

        {error && (
          <div className="bg-[#FEE2E2] text-[#E11D48] text-sm px-4 py-3 rounded-xl mb-6 border border-[#FECACA]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#475569]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="text-center text-sm text-[#64748b] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#D97706] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
