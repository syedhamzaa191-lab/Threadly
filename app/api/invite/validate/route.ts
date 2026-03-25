import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/invite/validate?token=xxx
// Checks if invite token is valid (exists, not used, not expired)
// Uses admin client to bypass RLS (unauthenticated users need to validate)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, email, workspace_id, is_used, expires_at, workspaces(name)')
    .eq('token', token)
    .single()

  if (error || !invite) {
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

  return NextResponse.json({
    valid: true,
    email: invite.email,
    workspace_name: (invite.workspaces as any)?.name || 'Workspace',
    workspace_id: invite.workspace_id,
  })
}
