import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/reactions — Toggle a reaction (add if not present, remove if exists)
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message_id, emoji } = body

  if (!message_id || !emoji || typeof emoji !== 'string') {
    return NextResponse.json({ error: 'message_id and emoji are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Verify message exists and user is workspace member
  const { data: message } = await adminClient
    .from('messages')
    .select('id, channel_id')
    .eq('id', message_id)
    .single()

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  const { data: channel } = await adminClient
    .from('channels')
    .select('workspace_id')
    .eq('id', message.channel_id)
    .single()

  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  }

  const { data: membership } = await adminClient
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', channel.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 })
  }

  // Check if reaction already exists
  const { data: existing } = await adminClient
    .from('reactions')
    .select('id')
    .eq('message_id', message_id)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existing) {
    // Remove reaction
    await adminClient.from('reactions').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  } else {
    // Add reaction
    const { data: reaction, error } = await adminClient
      .from('reactions')
      .insert({ message_id, user_id: user.id, emoji })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ action: 'added', reaction })
  }
}
