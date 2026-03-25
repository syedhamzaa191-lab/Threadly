import { createClient } from '@/lib/supabase/server'
import ChannelView from './channel-view'

export default async function ChannelPage({
  params,
}: {
  params: { workspaceId: string; channelId: string }
}) {
  const supabase = createClient()

  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', params.channelId)
    .single()

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Channel not found
      </div>
    )
  }

  return <ChannelView channel={channel} />
}
