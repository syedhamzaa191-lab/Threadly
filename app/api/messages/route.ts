import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/messages — Send a message (all validation server-side)
// 1. Verify user is authenticated
// 2. Verify user is active (not deactivated)
// 3. Verify user is a member of the channel's workspace
// 4. Validate content is not empty
// 5. Save message to DB
// 6. Supabase Realtime broadcasts automatically
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check user is active
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, is_deleted')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active' || profile.is_deleted) {
    return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { channel_id, content, parent_message_id } = body

  // Validate content
  if (!channel_id || !content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'channel_id and content are required' }, { status: 400 })
  }

  // Content length limit (prevent abuse)
  if (content.trim().length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  // Verify user is member of the channel's workspace
  const adminClient = createAdminClient()
  const { data: channel } = await adminClient
    .from('channels')
    .select('id, workspace_id')
    .eq('id', channel_id)
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
    return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
  }

  // If it's a thread reply, verify parent message exists and is in same channel
  if (parent_message_id) {
    const { data: parentMsg } = await adminClient
      .from('messages')
      .select('id, channel_id, sender_id, reply_count')
      .eq('id', parent_message_id)
      .single()

    if (!parentMsg) {
      return NextResponse.json({ error: 'Parent message not found' }, { status: 404 })
    }
    if (parentMsg.channel_id !== channel_id) {
      return NextResponse.json({ error: 'Parent message is in a different channel' }, { status: 400 })
    }

    // Increment reply_count on parent message
    await adminClient
      .from('messages')
      .update({ reply_count: ((parentMsg as any).reply_count || 0) + 1 })
      .eq('id', parent_message_id)
  }

  // Save message — Supabase Realtime will broadcast automatically
  const { data: message, error } = await adminClient
    .from('messages')
    .insert({
      channel_id,
      sender_id: user.id,
      content: content.trim(),
      parent_message_id: parent_message_id || null,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Thread reply notification — notify parent message sender
  if (message && parent_message_id) {
    const parentSenderId = (await adminClient.from('messages').select('sender_id').eq('id', parent_message_id).single()).data?.sender_id
    if (parentSenderId && parentSenderId !== user.id) {
      await adminClient.from('mentions').insert({
        message_id: message.id,
        channel_id,
        sender_id: user.id,
        mentioned_user_id: parentSenderId,
        content: content.replace(/<@[a-f0-9-]+\|([^>]+)>/g, '@$1').trim(),
        type: 'thread',
        parent_message_id,
      })
    }
  }

  // Detect @mentions in format <@userId|name> and save to mentions table
  if (message) {
    const mentionRegex = /<@([a-f0-9-]+)\|([^>]+)>/g
    let mentionMatch
    while ((mentionMatch = mentionRegex.exec(content)) !== null) {
      const mentionedUserId = mentionMatch[1]
      if (mentionedUserId !== user.id) {
        await adminClient.from('mentions').insert({
          message_id: message.id,
          channel_id,
          sender_id: user.id,
          mentioned_user_id: mentionedUserId,
          content: content.replace(/<@[a-f0-9-]+\|([^>]+)>/g, '@$1').trim(),
        })
      }
    }
  }

  return NextResponse.json({ message })
}

// DELETE /api/messages — Delete own message
export async function DELETE(request: Request) {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('id')

  if (!messageId) {
    return NextResponse.json({ error: 'Message id is required' }, { status: 400 })
  }

  const { data: msg } = await adminClient
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single()

  if (!msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  if (msg.sender_id !== user.id) {
    return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
  }

  const { error } = await adminClient
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
