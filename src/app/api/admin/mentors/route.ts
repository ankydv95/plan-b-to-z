import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'editor'].includes(profile.role ?? '')) return { user: null, supabase }
  return { user, supabase }
}

// GET /api/admin/mentors?careerId=xxx
export async function GET(request: Request) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const careerId = searchParams.get('careerId')
  if (!careerId) return NextResponse.json({ error: 'careerId is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('career_mentors')
    .select('*')
    .eq('career_id', careerId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/admin/mentors
export async function POST(request: Request) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { career_id, name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active } = body

  if (!career_id || !name?.trim() || !role?.trim()) {
    return NextResponse.json({ error: 'career_id, name, and role are required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_mentors')
    .insert({ career_id, name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active: is_active ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
