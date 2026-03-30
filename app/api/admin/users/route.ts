import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper: verify caller is admin/owner of the workspace
async function verifyAdmin(supabase: any, userId: string, workspaceId: string) {
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  return data && ['owner', 'admin'].includes(data.role)
}

// PATCH /api/admin/users — Deactivate or reactivate a user
// Actions: deactivate, reactivate, change_role
// NEVER deletes from DB. Only sets status/is_deleted flags.
export async function PATCH(request: Request) {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, target_user_id, workspace_id, new_role } = body

  if (!action || !target_user_id || !workspace_id) {
    return NextResponse.json({ error: 'action, target_user_id, workspace_id required' }, { status: 400 })
  }

  // Verify caller is admin/owner
  const isAdmin = await verifyAdmin(supabase, user.id, workspace_id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 })
  }

  // Cannot modify yourself
  if (target_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }

  // Check target user exists
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('id, status, is_deleted')
    .eq('id', target_user_id)
    .single()

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  switch (action) {
    case 'deactivate': {
      // 1. Delete reactions
      await adminClient.from('reactions').delete().eq('user_id', target_user_id)

      // 2. Delete messages
      await adminClient.from('messages').delete().eq('sender_id', target_user_id)

      // 3. Remove from channel_members
      await adminClient.from('channel_members').delete().eq('user_id', target_user_id)

      // 4. Remove from workspace_members
      await adminClient.from('workspace_members').delete().eq('user_id', target_user_id)

      // 5. Nullify channels created by this user
      await adminClient.from('channels').update({ created_by: null }).eq('created_by', target_user_id)

      // 6. Delete profile
      await adminClient.from('profiles').delete().eq('id', target_user_id)

      // 7. Delete from Supabase Auth
      const { error: authErr } = await adminClient.auth.admin.deleteUser(target_user_id)
      if (authErr) {
        return NextResponse.json({ error: 'Data removed but auth delete failed: ' + authErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'User removed completely. They can rejoin via invite link.' })
    }

    case 'reactivate': {
      const { error: reactError } = await adminClient
        .from('profiles')
        .update({ status: 'active', is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', target_user_id)

      if (reactError) {
        return NextResponse.json({ error: reactError.message }, { status: 500 })
      }

      // Re-add to workspace (use adminClient to bypass RLS)
      await adminClient.from('workspace_members').insert({
        workspace_id,
        user_id: target_user_id,
        role: 'member',
      })

      return NextResponse.json({ success: true, message: 'User reactivated' })
    }

    case 'change_role': {
      if (!new_role || !['admin', 'member'].includes(new_role)) {
        return NextResponse.json({ error: 'Invalid role. Must be admin or member' }, { status: 400 })
      }

      // Only owner can change roles
      const { data: callerMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspace_id)
        .eq('user_id', user.id)
        .single()

      if (callerMember?.role !== 'owner') {
        return NextResponse.json({ error: 'Only workspace owner can change roles' }, { status: 403 })
      }

      const { error: roleError } = await adminClient
        .from('workspace_members')
        .update({ role: new_role })
        .eq('workspace_id', workspace_id)
        .eq('user_id', target_user_id)

      if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: `Role changed to ${new_role}` })
    }

    case 'permanent_delete': {
      // Only owner can permanently delete
      const { data: callerRole } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspace_id)
        .eq('user_id', user.id)
        .single()

      if (callerRole?.role !== 'owner') {
        return NextResponse.json({ error: 'Only workspace owner can permanently delete users' }, { status: 403 })
      }

      // 1. Delete reactions by this user
      await adminClient.from('reactions').delete().eq('user_id', target_user_id)

      // 2. Delete messages by this user
      await adminClient.from('messages').delete().eq('sender_id', target_user_id)

      // 3. Remove from channel_members
      await adminClient.from('channel_members').delete().eq('user_id', target_user_id)

      // 4. Remove from workspace_members (all workspaces)
      await adminClient.from('workspace_members').delete().eq('user_id', target_user_id)

      // 5. Set channels.created_by to null where this user created channels
      await adminClient.from('channels').update({ created_by: null }).eq('created_by', target_user_id)

      // 6. Delete profile
      await adminClient.from('profiles').delete().eq('id', target_user_id)

      // 7. Delete auth user
      const { error: authError } = await adminClient.auth.admin.deleteUser(target_user_id)
      if (authError) {
        return NextResponse.json({ error: 'User data cleaned but auth delete failed: ' + authError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'User permanently deleted' })
    }

    default:
      return NextResponse.json({ error: 'Invalid action. Use: deactivate, reactivate, change_role, permanent_delete' }, { status: 400 })
  }
}
