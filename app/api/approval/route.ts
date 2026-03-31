import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Ensure approval_requests table exists
async function ensureTable(admin: ReturnType<typeof createAdminClient>) {
  await admin.rpc('exec_sql', {
    query: `
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
      DO $$ BEGIN
        CREATE POLICY "Anyone can view approval_requests" ON public.approval_requests FOR SELECT USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
      DO $$ BEGIN
        CREATE POLICY "Anyone can insert approval_requests" ON public.approval_requests FOR INSERT WITH CHECK (true);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
      DO $$ BEGIN
        CREATE POLICY "Anyone can update approval_requests" ON public.approval_requests FOR UPDATE USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `,
  }).catch(() => {
    // rpc might not exist, try raw SQL via admin
  })
}

// GET — list pending approval requests (admin only)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if admin/owner
  const { data: member } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { data: requests, error: tableError } = await admin
    .from('approval_requests')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Table might not exist yet — return empty
  if (tableError) return NextResponse.json({ requests: [] })

  return NextResponse.json({ requests: requests || [] })
}

// POST — create approval request (called from auth callback)
export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, email, full_name, avatar_url, workspace_id } = body

  if (!user_id || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check if there's already a pending request
  const { data: existing } = await admin
    .from('approval_requests')
    .select('id, status')
    .eq('user_id', user_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ message: 'Already pending' })
  }

  // Check if previously rejected — allow re-request
  const { data: rejected } = await admin
    .from('approval_requests')
    .select('id')
    .eq('user_id', user_id)
    .eq('status', 'rejected')
    .maybeSingle()

  if (rejected) {
    await admin
      .from('approval_requests')
      .update({ status: 'pending', reviewed_at: null, reviewed_by: null })
      .eq('id', rejected.id)
    return NextResponse.json({ message: 'Re-requested' })
  }

  const { error } = await admin.from('approval_requests').insert({
    user_id,
    email,
    full_name: full_name || email.split('@')[0],
    avatar_url,
    workspace_id,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Request created' })
}

// PATCH — approve or reject (admin only)
export async function PATCH(request: Request) {
  const body = await request.json()
  const { request_id, action, workspace_id } = body

  if (!request_id || !action || !workspace_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin
  const { data: member } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  // Get the approval request
  const { data: req } = await admin
    .from('approval_requests')
    .select('*')
    .eq('id', request_id)
    .single()

  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  if (action === 'approve') {
    // Create/update profile
    await admin.from('profiles').upsert({
      id: req.user_id,
      email: req.email,
      full_name: req.full_name,
      avatar_url: req.avatar_url,
      status: 'active',
      is_deleted: false,
    })

    // Add to workspace
    await admin.from('workspace_members').upsert({
      workspace_id,
      user_id: req.user_id,
      role: 'member',
    })

    // Mark approved
    await admin
      .from('approval_requests')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', request_id)

    return NextResponse.json({ message: 'User approved and added to workspace' })
  }

  if (action === 'reject') {
    await admin
      .from('approval_requests')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', request_id)

    // Sign out the rejected user and delete their auth account
    await admin.auth.admin.deleteUser(req.user_id).catch(() => {})

    return NextResponse.json({ message: 'User rejected' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
