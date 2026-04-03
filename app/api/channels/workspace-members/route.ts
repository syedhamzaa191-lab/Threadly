import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const { data: wsMembers } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)

  if (!wsMembers || wsMembers.length === 0) return NextResponse.json({ members: [] })

  const userIds = wsMembers.map((m: any) => m.user_id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)
    .eq('is_deleted', false)

  const members = (profiles || []).map((p: any) => ({
    user_id: p.id,
    full_name: p.full_name || 'Unknown',
    avatar_url: p.avatar_url || null,
  }))

  return NextResponse.json({ members })
}
