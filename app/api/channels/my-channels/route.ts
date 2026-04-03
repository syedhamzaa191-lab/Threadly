import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('channel_members')
    .select('channel_id')
    .eq('user_id', userId)

  const channelIds = (data || []).map((m: any) => m.channel_id)
  return NextResponse.json({ channel_ids: channelIds })
}
