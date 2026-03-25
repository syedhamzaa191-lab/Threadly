import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function WorkspacePage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const supabase = createClient()

  // Find first channel
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('workspace_id', params.workspaceId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (channel) {
    redirect(`/workspace/${params.workspaceId}/channel/${channel.id}`)
  }

  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <p>No channels yet. Create one from the sidebar.</p>
    </div>
  )
}
