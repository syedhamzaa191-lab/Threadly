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

  const { workspace_id, other_user_id } = await request.json()

  if (!workspace_id || !other_user_id) {
    return NextResponse.json({ error: 'workspace_id and other_user_id required' }, { status: 400 })
  }

  if (other_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 })
  }

  // Find or create DM channel
  const { data, error } = await adminClient.rpc('find_or_create_dm', {
    ws_id: workspace_id,
    user1: user.id,
    user2: other_user_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ channel_id: data })
}
