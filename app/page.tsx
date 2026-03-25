import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Find user's first workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) {
    // Find first channel in that workspace
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('workspace_id', membership.workspace_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (channel) {
      redirect(`/workspace/${membership.workspace_id}/channel/${channel.id}`)
    }
    redirect(`/workspace/${membership.workspace_id}`)
  }

  // No workspaces — send to create one
  redirect('/workspace/new')
}
