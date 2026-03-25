import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AcceptInvite from './accept-invite'

export default async function InvitePage({
  params,
}: {
  params: { code: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch invite using admin-free approach (invite policy allows auth'd users to view)
  if (!user) {
    // Redirect to signup, then they come back
    redirect(`/signup?redirect=/invite/${params.code}`)
  }

  const { data: invite } = await supabase
    .from('invites')
    .select('*, workspaces(id, name)')
    .eq('code', params.code)
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
          <p className="text-gray-500">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const isExpired = new Date(invite.expires_at) < new Date()
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Invite Expired</h2>
          <p className="text-gray-500">This invite link has expired.</p>
        </div>
      </div>
    )
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    redirect(`/workspace/${invite.workspace_id}`)
  }

  const workspace = invite.workspaces as { id: string; name: string }

  return <AcceptInvite workspaceId={invite.workspace_id} workspaceName={workspace.name} />
}
