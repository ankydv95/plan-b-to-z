import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: post_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if already liked
    const { data: existing } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Unlike: delete the row and decrement
      await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', post_id)
        .eq('user_id', user.id)

      await supabase.rpc('decrement_likes_count', { pid: post_id })

      return NextResponse.json({ liked: false })
    } else {
      // Like: insert and increment
      await supabase
        .from('community_post_likes')
        .insert({ post_id, user_id: user.id })

      await supabase.rpc('increment_likes_count', { pid: post_id })

      return NextResponse.json({ liked: true })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to toggle like.' }, { status: 500 })
  }
}
