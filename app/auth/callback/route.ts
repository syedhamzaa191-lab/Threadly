import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const origin = requestOrigin
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')

  if (code) {
    const supabase = createClient()
    const adminClient = createAdminClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if user already has a profile (existing user)
      const { data: profile } = await adminClient
        .from('profiles')
        .select('status, is_deleted')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Existing user - check if deactivated
        if (profile.status !== 'active' || profile.is_deleted) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=account_deactivated`)
        }
        // Update email, name, and avatar on every login (syncs Google profile changes)
        const updates: Record<string, string> = { email: user.email || '' }
        if (user.user_metadata?.full_name || user.user_metadata?.name) {
          updates.full_name = user.user_metadata.full_name || user.user_metadata.name
        }
        if (user.user_metadata?.avatar_url) {
          updates.avatar_url = user.user_metadata.avatar_url
        }
        await adminClient
          .from('profiles')
          .update(updates)
          .eq('id', user.id)

        // Check if they're a workspace member
        const { data: membership } = await adminClient
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (membership) {
          if (redirect) return NextResponse.redirect(`${origin}${redirect}`)
          return NextResponse.redirect(`${origin}/workspace/${membership.workspace_id}/channel`)
        }

        // Profile exists but no workspace membership — create approval request
        const { data: workspace } = await adminClient
          .from('workspaces')
          .select('id')
          .limit(1)
          .maybeSingle()

        if (workspace) {
          // Check if approval request already exists
          const { data: existingRequest, error: checkErr } = await adminClient
            .from('approval_requests')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .maybeSingle()

          // Only create if no pending request exists (ignore query errors like table missing)
          if (!existingRequest && !checkErr) {
            await adminClient.from('approval_requests').insert({
              user_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              workspace_id: workspace.id,
              status: 'pending',
            })
          }

          // If table doesn't exist yet, still try to insert
          if (checkErr) {
            await adminClient.from('approval_requests').insert({
              user_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              workspace_id: workspace.id,
              status: 'pending',
            })
          }
        }

        return NextResponse.redirect(`${origin}/pending-approval`)
      } else {
        // New user — check if workspace owner
        const { data: isOwner } = await adminClient
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle()

        if (isOwner) {
          // Owner — create profile and let them in
          await adminClient.from('profiles').upsert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            status: 'active',
            is_deleted: false,
          })
          return NextResponse.redirect(`${origin}/workspace`)
        }

        // New user — create approval request and redirect to pending page
        // Get the first workspace (main workspace) to request access to
        const { data: workspace } = await adminClient
          .from('workspaces')
          .select('id')
          .limit(1)
          .maybeSingle()

        // Create approval request via internal API call
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
        const avatarUrl = user.user_metadata?.avatar_url || null

        await adminClient.from('approval_requests').insert({
          user_id: user.id,
          email: user.email || '',
          full_name: fullName,
          avatar_url: avatarUrl,
          workspace_id: workspace?.id || null,
          status: 'pending',
        }).catch(() => {
          // Table might not exist yet, will be created on first admin access
        })

        return NextResponse.redirect(`${origin}/pending-approval`)
      }
    }

    if (redirect) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }

    return NextResponse.redirect(`${origin}/workspace`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
