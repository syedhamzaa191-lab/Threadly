'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useWorkspace } from '@/hooks/use-workspace'
import { useChannels } from '@/hooks/use-channels'
import { Sidebar } from '@/components/layout/sidebar'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = params.workspaceId as string

  // Extract channelId from pathname like /workspace/xxx/channel/yyy
  const channelMatch = pathname.match(/\/channel\/([^/]+)/)
  const activeChannelId = channelMatch ? channelMatch[1] : undefined

  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { workspace, members, myRole, loading: wsLoading } = useWorkspace(workspaceId)
  const { channels, createChannel } = useChannels(workspaceId)

  if (authLoading || wsLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-extrabold text-xl">T</span>
          </div>
          <p className="text-sm font-bold text-gray-900">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const channelList = channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    unread_count: 0,
  }))

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar
        workspaceName={workspace?.name || 'Workspace'}
        channels={channelList}
        activeChannelId={activeChannelId}
        userName={profile?.full_name || 'User'}
        userAvatar={profile?.avatar_url}
        userRole={myRole}
        onChannelSelect={(channelId) =>
          router.push(`/workspace/${workspaceId}/channel/${channelId}`)
        }
        onSignOut={signOut}
        onCreateChannel={async (name: string) => {
          if (user) await createChannel(name, user.id)
        }}
        memberCount={members.length}
      />
      {children}
    </div>
  )
}
