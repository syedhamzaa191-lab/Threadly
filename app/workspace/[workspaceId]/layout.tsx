'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useWorkspace } from '@/hooks/use-workspace'
import { useChannels } from '@/hooks/use-channels'
import { useDirectMessages } from '@/hooks/use-direct-messages'
import { useUnread } from '@/hooks/use-unread'
import { Sidebar } from '@/components/layout/sidebar'
import { InviteModal } from '@/components/invite/invite-modal'
import { ProfileModal } from '@/components/profile/profile-modal'
import { ManageUsersModal } from '@/components/admin/manage-users-modal'
import { NotificationToast } from '@/components/ui/notification-toast'
import { createClient } from '@/lib/supabase/client'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = params.workspaceId as string
  const [showInvite, setShowInvite] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showManageUsers, setShowManageUsers] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const channelMatch = pathname.match(/\/channel\/([^/]+)/)
  const activeChannelId = channelMatch ? channelMatch[1] : undefined

  const dmMatch = pathname.match(/\/dm\/([^/]+)/)
  const activeDmId = dmMatch ? dmMatch[1] : undefined

  const currentActiveId = activeChannelId || activeDmId

  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { workspace, members, myRole, loading: wsLoading, reload } = useWorkspace(workspaceId)
  const { channels, createChannel } = useChannels(workspaceId)
  const { conversations, startDm } = useDirectMessages(workspaceId, user?.id)
  const { unread, newMessageAlert, dismissAlert } = useUnread(workspaceId, currentActiveId, user?.id)

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
    unread_count: unread[ch.id] || 0,
  }))

  const dmList = conversations.map((c) => ({
    id: c.id,
    name: c.otherUser.full_name,
    avatar: c.otherUser.avatar_url,
    lastMessage: c.lastMessage,
    unread_count: unread[c.id] || 0,
  }))

  const isAdmin = myRole === 'owner' || myRole === 'admin'

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const displayAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || null

  const profileData = {
    name: displayName,
    email: user.email || '',
    role: myRole,
    avatar: displayAvatar,
    bio: '',
    phone: '',
    location: '',
    department: '',
  }

  const handleProfileSave = async (data: typeof profileData) => {
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: data.name,
      avatar_url: data.avatar,
      email: user.email || '',
      bio: data.bio,
      phone: data.phone,
      location: data.location,
      department: data.department,
    })
    window.location.reload()
  }

  const handleNotificationClick = () => {
    if (newMessageAlert) {
      // Check if it's a DM or channel
      const isDm = conversations.some((c) => c.id === newMessageAlert.channelId)
      if (isDm) {
        router.push(`/workspace/${workspaceId}/dm/${newMessageAlert.channelId}`)
      } else {
        router.push(`/workspace/${workspaceId}/channel/${newMessageAlert.channelId}`)
      }
      dismissAlert()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar
        workspaceName={workspace?.name || 'Workspace'}
        channels={channelList}
        activeChannelId={activeChannelId}
        activeDmId={activeDmId}
        userName={displayName}
        userAvatar={displayAvatar}
        userRole={myRole}
        onChannelSelect={(channelId) =>
          router.push(`/workspace/${workspaceId}/channel/${channelId}`)
        }
        onSignOut={signOut}
        onCreateChannel={isAdmin ? async (name: string) => {
          if (user) await createChannel(name, user.id)
        } : undefined}
        onInviteClick={isAdmin ? () => setShowInvite(true) : undefined}
        onProfileClick={() => setShowProfile(true)}
        onMembersClick={isAdmin ? () => setShowManageUsers(true) : undefined}
        memberCount={members.length}
        dmConversations={dmList}
        onDmSelect={(channelId) =>
          router.push(`/workspace/${workspaceId}/dm/${channelId}`)
        }
        onStartDm={startDm}
        members={members.map((m) => ({
          id: m.user_id,
          full_name: m.profiles?.full_name || 'Unknown',
          avatar_url: m.profiles?.avatar_url || null,
        }))}
        currentUserId={user.id}
      />
      {children}

      {/* Notification Toast */}
      {newMessageAlert && (
        <NotificationToast
          senderName={newMessageAlert.senderName}
          content={newMessageAlert.content}
          onDismiss={dismissAlert}
          onClick={handleNotificationClick}
        />
      )}

      {showInvite && <InviteModal workspaceId={workspaceId} onClose={() => setShowInvite(false)} />}
      {showProfile && (
        <ProfileModal
          profile={profileData}
          onClose={() => setShowProfile(false)}
          onSave={handleProfileSave}
        />
      )}
      {showManageUsers && (
        <ManageUsersModal
          members={members}
          workspaceId={workspaceId}
          currentUserId={user.id}
          onClose={() => setShowManageUsers(false)}
          onAction={reload}
          onStartDm={startDm}
        />
      )}
    </div>
  )
}
