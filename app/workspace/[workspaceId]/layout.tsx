import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspaceId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Verify membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', params.workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/')

  // Fetch current workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', params.workspaceId)
    .single()

  if (!workspace) redirect('/')

  // Fetch channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', params.workspaceId)
    .order('created_at', { ascending: true })

  // Fetch all user's workspaces
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)

  const workspaceIds = memberships?.map((m) => m.workspace_id) || []

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspace={workspace}
        channels={channels || []}
        profile={profile}
        workspaces={workspaces || []}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
