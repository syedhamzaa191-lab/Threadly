import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Temporary debug route — shows all approval requests
export async function GET() {
  const admin = createAdminClient()

  const { data: requests, error } = await admin
    .from('approval_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: workspaces } = await admin
    .from('workspaces')
    .select('id, name')

  return NextResponse.json({
    table_error: error?.message || null,
    requests: requests || [],
    workspaces: workspaces || [],
  })
}
