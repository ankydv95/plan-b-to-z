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

export async function POST(request: Request) {
  const { user, supabase } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('career_paths')
      .insert({
        ...body,
        is_active: body.status === 'published',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Create career error:', error)
    return NextResponse.json({ error: 'Failed to create career' }, { status: 500 })
  }
}
