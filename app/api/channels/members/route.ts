import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper: verify caller is admin/owner of workspace
async function verifyAdmin(supabase: any, userId: string, workspaceId: string) {
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()
  return data && ['owner', 'admin'].includes(data.role)
}

// GET /api/channels/members?channel_id=xxx — List members of a channel
export async function GET(request: Request) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channel_id')
  if (!channelId) return NextResponse.json({ error: 'channel_id required' }, { status: 400 })

  const { data: members } = await admin
    .from('channel_members')
    .select('user_id, created_at')
    .eq('channel_id', channelId)

  if (!members || members.length === 0) return NextResponse.json({ members: [] })

  const userIds = members.map((m: any) => m.user_id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', userIds)

  const result = members.map((m: any) => ({
    user_id: m.user_id,
    profiles: profiles?.find((p: any) => p.id === m.user_id) || null,
  }))

  return NextResponse.json({ members: result })
}

// POST /api/channels/members — Admin adds user(s) to a channel
// Body: { channel_id, user_ids: string[] }
export async function POST(request: Request) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel_id, user_ids } = await request.json()

  if (!channel_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: 'channel_id and user_ids[] required' }, { status: 400 })
  }

  // Get the channel's workspace
  const { data: channel } = await admin
    .from('channels')
    .select('workspace_id')
    .eq('id', channel_id)
    .single()

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  // Verify caller is admin/owner
  const isAdmin = await verifyAdmin(admin, user.id, channel.workspace_id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can add members to channels' }, { status: 403 })
  }

  // Verify all target users are workspace members
  const { data: wsMembers } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', channel.workspace_id)
    .in('user_id', user_ids)

  const validUserIds = (wsMembers || []).map((m: any) => m.user_id)
  const invalidIds = user_ids.filter((id: string) => !validUserIds.includes(id))

  if (invalidIds.length > 0) {
    return NextResponse.json({
      error: `Some users are not workspace members: ${invalidIds.join(', ')}`,
    }, { status: 400 })
  }

  // Add members (ignore duplicates)
  const inserts = validUserIds.map((uid: string) => ({
    channel_id,
    user_id: uid,
  }))

  const { error } = await admin
    .from('channel_members')
    .upsert(inserts, { onConflict: 'channel_id,user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, added: validUserIds.length })
}

// DELETE /api/channels/members — Admin removes user from a channel
// Body: { channel_id, user_id }
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel_id, user_id: targetUserId } = await request.json()

  if (!channel_id || !targetUserId) {
    return NextResponse.json({ error: 'channel_id and user_id required' }, { status: 400 })
  }

  // Get channel's workspace
  const adminDel = createAdminClient()
  const { data: channel } = await adminDel
    .from('channels')
    .select('workspace_id')
    .eq('id', channel_id)
    .single()

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  // Verify caller is admin/owner
  const isAdmin = await verifyAdmin(adminDel, user.id, channel.workspace_id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can remove members from channels' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('channel_members')
    .delete()
    .eq('channel_id', channel_id)
    .eq('user_id', targetUserId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
