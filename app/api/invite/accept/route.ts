import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await request.json()
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const { data: invite, error: invError } = await adminClient
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (invError || !invite) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  if (invite.email !== user.email) {
    return NextResponse.json({ error: 'This invite was sent to a different email' }, { status: 403 })
  }

  // Create profile if not exists
  await adminClient.from('profiles').upsert({
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
    avatar_url: user.user_metadata?.avatar_url || null,
    status: 'active',
    is_deleted: false,
  })

  // Add to workspace if not already member
  const { data: existing } = await adminClient
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: joinError } = await adminClient
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: 'member',
      })

    if (joinError) {
      return NextResponse.json({ error: 'Failed to join workspace' }, { status: 500 })
    }
  }

  // Mark invite as accepted
  await adminClient
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({
    success: true,
    workspace_id: invite.workspace_id,
  })
}
