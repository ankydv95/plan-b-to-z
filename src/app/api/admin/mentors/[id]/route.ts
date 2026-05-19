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

// PUT /api/admin/mentors/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active } = body

  const { data, error } = await supabase
    .from('career_mentors')
    .update({ name, role, company, upsc_background, bio, photo_url, linkedin_url, is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/admin/mentors/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('career_mentors').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
