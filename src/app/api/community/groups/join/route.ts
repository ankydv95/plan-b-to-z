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

    // Enforce max 5 groups per user
    const { count } = await supabase
      .from('community_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'You can join a maximum of 5 groups.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('community_group_members')
      .insert({ group_id, user_id: user.id })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already a member.' }, { status: 400 })
      }
      throw error
    }

    // Increment member_count
    const { error: rpcError } = await supabase.rpc('increment_group_member_count', { gid: group_id })
    if (rpcError) throw rpcError

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to join group.' }, { status: 500 })
  }
}
