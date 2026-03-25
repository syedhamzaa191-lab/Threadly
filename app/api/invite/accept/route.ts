import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/invite/accept — User accepts invite after creating account
// 1. Verify user is authenticated
// 2. Validate token (not used, not expired)
// 3. Add user to workspace
// 4. Mark token as used
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

  // Fetch invite with admin client (to bypass RLS for validation)
  const { data: invite, error: invError } = await adminClient
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (invError || !invite) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
  }

  // Check 1: Token must not be used
  if (invite.is_used) {
    return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  }

  // Check 2: Token must not be expired
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  // Check 3: Email must match (security - invite is for specific email)
  if (invite.email !== user.email) {
    return NextResponse.json({ error: 'This invite was sent to a different email' }, { status: 403 })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    // Add user to workspace
    const { error: joinError } = await supabase
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

  // Mark token as used (admin client to bypass RLS)
  await adminClient
    .from('invites')
    .update({
      is_used: true,
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  return NextResponse.json({
    success: true,
    workspace_id: invite.workspace_id,
  })
}
