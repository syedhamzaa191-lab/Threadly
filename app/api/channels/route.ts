import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// DELETE /api/channels?id=xxx — Admin/owner deletes a channel
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('id')
  if (!channelId) return NextResponse.json({ error: 'Channel id required' }, { status: 400 })

  // Get the channel and its workspace
  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, workspace_id')
    .eq('id', channelId)
    .single()

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  // Don't allow deleting #general
  if (channel.name === 'general') {
    return NextResponse.json({ error: 'Cannot delete the #general channel' }, { status: 400 })
  }

  // Verify caller is admin/owner
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', channel.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only admins can delete channels' }, { status: 403 })
  }

  // Delete channel (cascades to messages, channel_members)
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('channels')
    .delete()
    .eq('id', channelId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
