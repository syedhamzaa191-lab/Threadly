import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/cron — Auto-delete messages older than 100 days
// Called by Vercel Cron (daily at 3:00 AM UTC)
// Uses admin client to bypass RLS
//
// Why auto-delete?
// 1. Reduces storage costs
// 2. Keeps queries fast
// 3. Prevents scaling issues as messages grow
export async function GET(request: Request) {
  // Verify cron secret (prevent unauthorized access)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 100)

  // Delete messages older than 100 days
  // Thread replies are cascade-deleted when parent is deleted
  const { data, error } = await supabase
    .from('messages')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message, deleted: 0 }, { status: 500 })
  }

  const deletedCount = data?.length || 0

  return NextResponse.json({
    success: true,
    deleted: deletedCount,
    cutoff_date: cutoffDate.toISOString(),
    ran_at: new Date().toISOString(),
  })
}
