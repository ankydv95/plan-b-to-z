import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PostTag } from '@/types'

const VALID_TAGS: PostTag[] = [
  'career_doubts', 'transition_story', 'skill_building', 'emotional_support', 'general',
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, group_id, tag, is_anonymous, parent_id } = await request.json() as {
      content: string
      group_id?: string | null
      tag?: PostTag
      is_anonymous?: boolean
      parent_id?: string | null
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 })
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Content must be 2000 characters or fewer.' }, { status: 400 })
    }

    const resolvedTag: PostTag = VALID_TAGS.includes(tag as PostTag) ? (tag as PostTag) : 'general'

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        group_id: group_id ?? null,
        parent_id: parent_id ?? null,
        content: content.trim(),
        is_anonymous: is_anonymous ?? false,
        tag: resolvedTag,
      })
      .select('*, profiles(full_name, stage_reached)')
      .single()

    if (error) throw error

    // If reply, increment parent's replies_count
    if (parent_id) {
      await supabase.rpc('increment_replies_count', { pid: parent_id })
    }

    // Sanitize: strip author info for anonymous posts before returning
    const sanitized = {
      ...data,
      author_id: (is_anonymous ?? false) ? null : data.author_id,
      profiles: (is_anonymous ?? false) ? null : data.profiles,
    }

    return NextResponse.json({ data: sanitized })
  } catch {
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 })
  }
}
