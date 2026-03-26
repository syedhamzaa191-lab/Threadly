import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, email, workspace_id, accepted_at, expires_at, workspaces(name)')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
    workspace_name: (invite.workspaces as any)?.name || 'Workspace',
    workspace_id: invite.workspace_id,
  })
}
