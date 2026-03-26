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
      } else {
        // New user - check if they have a pending invite OR are workspace owner
        const { data: invite } = await adminClient
          .from('invites')
          .select('id, workspace_id')
          .eq('email', user.email || '')
          .is('accepted_at', null)
          .limit(1)
          .maybeSingle()

        const { data: isOwner } = await adminClient
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!invite && !isOwner) {
          // Not invited and not owner - block access
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=not_invited`)
        }

        // Create profile for new invited user
        await adminClient.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          status: 'active',
          is_deleted: false,
        })

        // If they have an invite, auto-add them to the workspace
        if (invite) {
          // Add to workspace as member
          await adminClient.from('workspace_members').upsert({
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: 'member',
          })

          // Mark invite as accepted
          await adminClient
            .from('invites')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invite.id)

          return NextResponse.redirect(`${origin}/workspace/${invite.workspace_id}/channel`)
        }
      }
    }

    if (redirect) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }

    return NextResponse.redirect(`${origin}/workspace`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
