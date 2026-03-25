'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ThreadPanel } from '@/components/chat/thread-panel'
import { InviteModal } from '@/components/invite/invite-modal'
import { ManageMembersModal } from '@/components/channel/manage-members-modal'
import { ProfileModal } from '@/components/profile/profile-modal'

// Simulated workspace members (will come from Supabase when auth is active)
const workspaceMembers = [
  { id: 'u1', name: 'Syed Hamza', email: 'syedhamzaa191@gmail.com', avatar: null },
  { id: 'u2', name: 'Sarah Ahmed', email: 'sarah@threadly.com', avatar: null },
  { id: 'u3', name: 'Ali Hassan', email: 'ali@threadly.com', avatar: null },
  { id: 'u4', name: 'Fatima Khan', email: 'fatima@threadly.com', avatar: null },
  { id: 'u5', name: 'Omar Sheikh', email: 'omar@threadly.com', avatar: null },
]

export default function Home() {
  const [channels, setChannels] = useState([
    { id: '1', name: 'general', unread_count: 0 },
  ])
  const [activeChannel, setActiveChannel] = useState('1')
  const [threadMessage, setThreadMessage] = useState<string | null>(null)
  const [messagesMap, setMessagesMap] = useState<Record<string, any[]>>({})
  const [replies, setReplies] = useState<any[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Channel members tracking: channelId -> userId[]
  const [channelMembersMap, setChannelMembersMap] = useState<Record<string, string[]>>({
    '1': ['u1'], // Admin is in general by default
  })

  // Current user profile
  const currentUserRole = 'admin'
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner'
  const [myProfile, setMyProfile] = useState({
    name: 'Syed Hamza',
    email: 'syedhamzaa191@gmail.com',
    role: currentUserRole,
    avatar: null as string | null,
    bio: '',
    phone: '',
    location: '',
    department: '',
  })

  const activeChannelData = channels.find((c) => c.id === activeChannel)
  const messages = messagesMap[activeChannel] || []
  const parentMsg = messages.find((m: any) => m.id === threadMessage)
  const channelMemberIds = channelMembersMap[activeChannel] || []

  const handleSend = (content: string) => {
    const newMsg = {
      id: `m${Date.now()}`,
      content,
      sender_name: 'Syed Hamza',
      created_at: new Date().toISOString(),
      thread_count: 0,
    }
    setMessagesMap((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }))
  }

  const handleReply = (content: string) => {
    const newReply = {
      id: `r${Date.now()}`,
      content,
      sender_name: 'Syed Hamza',
      created_at: new Date().toISOString(),
    }
    setReplies((prev) => [...prev, newReply])
    setMessagesMap((prev) => ({
      ...prev,
      [activeChannel]: (prev[activeChannel] || []).map((m) =>
        m.id === threadMessage ? { ...m, thread_count: (m.thread_count || 0) + 1 } : m
      ),
    }))
  }

  const handleCreateChannel = (name: string) => {
    const id = `ch${Date.now()}`
    setChannels((prev) => [
      ...prev,
      { id, name: name.toLowerCase().replace(/\s+/g, '-'), unread_count: 0 },
    ])
    // Admin auto-added to new channel
    setChannelMembersMap((prev) => ({ ...prev, [id]: ['u1'] }))
    setActiveChannel(id)
    setThreadMessage(null)
  }

  const handleAddToChannel = (userId: string, channelId: string) => {
    setChannelMembersMap((prev) => ({
      ...prev,
      [channelId]: Array.from(new Set([...(prev[channelId] || []), userId])),
    }))
  }

  const handleRemoveFromChannel = (userId: string, channelId: string) => {
    setChannelMembersMap((prev) => ({
      ...prev,
      [channelId]: (prev[channelId] || []).filter((id) => id !== userId),
    }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar
        workspaceName="Threadly"
        channels={channels}
        activeChannelId={activeChannel}
        userName={myProfile.name}
        userAvatar={myProfile.avatar}
        userRole={currentUserRole}
        onChannelSelect={(id) => {
          setActiveChannel(id)
          setThreadMessage(null)
          setReplies([])
        }}
        onInviteClick={isAdmin ? () => setShowInvite(true) : undefined}
        onCreateChannel={isAdmin ? handleCreateChannel : undefined}
        onProfileClick={() => setShowProfile(true)}
        memberCount={workspaceMembers.length}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <ChatHeader
          channelName={activeChannelData?.name || 'general'}
          memberCount={channelMemberIds.length}
          isAdmin={isAdmin}
          onManageMembers={() => setShowManageMembers(true)}
        />
        <MessageList
          messages={messages}
          onThreadClick={setThreadMessage}
        />
        <MessageInput
          placeholder={`Message #${activeChannelData?.name || 'general'}`}
          onSend={handleSend}
        />
      </main>

      {threadMessage && parentMsg && (
        <ThreadPanel
          parentMessage={parentMsg}
          replies={replies}
          onClose={() => {
            setThreadMessage(null)
            setReplies([])
          }}
          onSendReply={handleReply}
        />
      )}

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} />
      )}

      {showManageMembers && (
        <ManageMembersModal
          members={workspaceMembers}
          channels={channels}
          channelMembers={channelMembersMap}
          onClose={() => setShowManageMembers(false)}
          onAddToChannel={handleAddToChannel}
          onRemoveFromChannel={handleRemoveFromChannel}
        />
      )}

      {showProfile && (
        <ProfileModal
          profile={myProfile}
          onClose={() => setShowProfile(false)}
          onSave={(updatedProfile) => setMyProfile(updatedProfile)}
        />
      )}
    </div>
  )
}
