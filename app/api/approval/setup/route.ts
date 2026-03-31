import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/approval/setup — creates the approval_requests table
// Hit this once to set up the table
export async function GET() {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Try to insert a test row to check if table exists
  const { error: checkError } = await admin
    .from('approval_requests')
    .select('id')
    .limit(1)

  if (checkError?.code === '42P01') {
    // Table doesn't exist — need to run SQL in Supabase dashboard
    return NextResponse.json({
      error: 'Table does not exist',
      sql: `
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approval_requests" ON public.approval_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert approval_requests" ON public.approval_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update approval_requests" ON public.approval_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete approval_requests" ON public.approval_requests FOR DELETE USING (true);
      `,
      message: 'Please run this SQL in your Supabase Dashboard > SQL Editor',
    })
  }

  return NextResponse.json({ message: 'Table already exists! Approval system is ready.' })
}
