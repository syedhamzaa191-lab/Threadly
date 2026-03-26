import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { workspace_id, email } = body

  if (!workspace_id || !email) {
    return NextResponse.json({ error: 'workspace_id and email are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  // Check: is user an admin/owner?
  const { data: membership } = await adminClient
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only admins can send invites' }, { status: 403 })
  }

  // Check: already a member?
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    const { data: existingMember } = await adminClient
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', existingProfile.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }
  }

  // Check: pending invite exists?
  const { data: existingInvite } = await adminClient
    .from('invites')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'A pending invite already exists for this email' }, { status: 409 })
  }

  // Generate token and code
  const token = crypto.randomBytes(32).toString('hex')
  const code = crypto.randomBytes(6).toString('hex').toUpperCase()
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  const { data: invite, error } = await adminClient
    .from('invites')
    .insert({
      workspace_id,
      email,
      token,
      code,
      invited_by: user.id,
      expires_at,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      token: invite.token,
      expires_at: invite.expires_at,
    },
  })
}
