import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { group_id } = await request.json() as { group_id: string }
    if (!group_id?.trim()) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('community_group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', user.id)

    if (error) throw error

    // Decrement member_count
    await supabase.rpc('decrement_group_member_count', { gid: group_id })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to leave group.' }, { status: 500 })
  }
}
