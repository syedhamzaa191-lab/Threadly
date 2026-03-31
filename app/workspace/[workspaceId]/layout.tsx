'use client'

import { useState, useRef, useCallback, useMemo, useEffect, createContext, useContext } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useWorkspace } from '@/hooks/use-workspace'
import { useChannels } from '@/hooks/use-channels'
import { useDirectMessages } from '@/hooks/use-direct-messages'
import { useUnread } from '@/hooks/use-unread'
import { useCall, CallType } from '@/hooks/use-call'
import { Sidebar } from '@/components/layout/sidebar'
import { ApprovalPanel } from '@/components/approval/approval-panel'
import { ProfileModal } from '@/components/profile/profile-modal'
import { NotificationToast } from '@/components/ui/notification-toast'
import { CallModal } from '@/components/call/call-modal'
import { IncomingCall } from '@/components/call/incoming-call'
import { createClient } from '@/lib/supabase/client'

// Call context so child pages can trigger calls
interface CallContextType {
  startCall: (remoteUserId: string, remoteName: string, remoteAvatar: string | null, type: CallType) => void
}
const CallContext = createContext<CallContextType>({ startCall: () => {} })
export const useCallContext = () => useContext(CallContext)

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = params.workspaceId as string
  const [showApprovals, setShowApprovals] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const channelMatch = pathname.match(/\/channel\/([^/]+)/)
  const activeChannelId = channelMatch ? channelMatch[1] : undefined

  const dmMatch = pathname.match(/\/dm\/([^/]+)/)
  const activeDmId = dmMatch ? dmMatch[1] : undefined

  const currentActiveId = activeChannelId || activeDmId

  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { workspace, members, myRole, loading: wsLoading, reload } = useWorkspace(workspaceId)
  const { channels, createChannel, deleteChannel } = useChannels(workspaceId)
  const { conversations, startDm } = useDirectMessages(workspaceId, user?.id)

  const displayNameForCall = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const displayAvatarForCall = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  // Use ref so the callback always sees latest activeDmId
  const activeDmIdRef = useRef(activeDmId)
  activeDmIdRef.current = activeDmId

  // Send call log as a message in the active DM
  const handleCallLog = useCallback(async (type: CallType, duration: number, remoteName: string) => {
    const activeChannel = activeDmIdRef.current
    if (!activeChannel) return
    const mins = Math.floor(duration / 60)
    const secs = duration % 60
    const durationStr = duration > 0 ? (mins > 0 ? `${mins}m ${secs}s` : `${secs}s`) : 'No answer'
    const icon = type === 'video' ? '📹' : '📞'
    const label = type === 'video' ? 'Video call' : 'Voice call'
    const content = `${icon} ${label} with ${remoteName} — ${durationStr}`
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: activeChannel, content }),
    })
  }, [])

  const {
    callState, localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, rejectWithMessage, endCall,
    toggleMute, toggleVideo, toggleSpeaker,
  } = useCall(user?.id, displayNameForCall, displayAvatarForCall, handleCallLog)
  const { unread, newMessageAlert, dismissAlert } = useUnread(workspaceId, currentActiveId, user?.id)

  const channelList = useMemo(() => channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    unread_count: unread[ch.id] || 0,
  })), [channels, unread])

  const dmList = useMemo(() => conversations.map((c) => ({
    id: c.id,
    name: c.otherUser.full_name,
    avatar: c.otherUser.avatar_url,
    lastMessage: c.lastMessage,
    unread_count: unread[c.id] || 0,
  })), [conversations, unread])

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  const profileData = useMemo(() => ({
    name: displayName,
    email: user?.email || '',
    role: myRole,
    avatar: displayAvatar,
    bio: '',
    phone: '',
    location: '',
    department: '',
  }), [displayName, user?.email, myRole, displayAvatar])

  const handleProfileSave = useCallback(async (data: { name: string; email: string; role: string; avatar: string | null; bio: string; phone: string; location: string; department: string }) => {
    if (!user) return
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
    reload()
    setShowProfile(false)
  }, [user, supabase, reload])

  // Fetch pending approval count for admins
  useEffect(() => {
    if (!workspaceId) return
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/approval?workspace_id=${workspaceId}`)
        if (res.ok) {
          const data = await res.json()
          setPendingApprovalCount(data.requests?.length || 0)
        }
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [workspaceId])

  if (authLoading || wsLoading) {
    return (
      <div className="min-h-screen bg-[#1e1a2b] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-white/30">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const isAdmin = myRole === 'owner' || myRole === 'admin'

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
    <div className="flex h-screen overflow-hidden bg-[#1e1a2b] relative">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-xl bg-[#252133] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar wrapper */}
      <div className={`
        fixed md:relative z-[56] h-full
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      <Sidebar
        workspaceName={workspace?.name || 'Workspace'}
        channels={channelList}
        activeChannelId={activeChannelId}
        activeDmId={activeDmId}
        userName={displayName}
        userAvatar={displayAvatar}
        userRole={myRole}
        onChannelSelect={(channelId) => {
          router.push(`/workspace/${workspaceId}/channel/${channelId}`)
          setSidebarOpen(false)
        }}
        onSignOut={signOut}
        onCreateChannel={isAdmin ? async (name: string) => {
          if (user) await createChannel(name, user.id)
        } : undefined}
        onApprovalsClick={isAdmin ? () => setShowApprovals(true) : undefined}
        pendingApprovalCount={isAdmin ? pendingApprovalCount : 0}
        onProfileClick={() => setShowProfile(true)}
        onMembersClick={() => { router.push(`/workspace/${workspaceId}/members`); setSidebarOpen(false) }}
        onHomeClick={() => { router.push(`/workspace/${workspaceId}`); setSidebarOpen(false) }}
        onDeleteChannel={isAdmin ? async (channelId: string) => {
          await deleteChannel(channelId)
          // If deleted channel is active, navigate to first available channel
          if (activeChannelId === channelId) {
            const remaining = channels.filter(c => c.id !== channelId)
            if (remaining.length > 0) {
              router.push(`/workspace/${workspaceId}/channel/${remaining[0].id}`)
            } else {
              router.push(`/workspace/${workspaceId}`)
            }
          }
        } : undefined}
        memberCount={members.length}
        dmConversations={dmList}
        onDmSelect={(channelId) => {
          router.push(`/workspace/${workspaceId}/dm/${channelId}`)
          setSidebarOpen(false)
        }}
        onStartDm={startDm}
        members={members.map((m) => ({
          id: m.user_id,
          full_name: m.profiles?.full_name || 'Unknown',
          avatar_url: m.profiles?.avatar_url || null,
        }))}
        currentUserId={user.id}
      />
      </div>
      <CallContext.Provider value={{ startCall }}>
        {children}
      </CallContext.Provider>

      {/* Calling UI */}
      {callState.status === 'ringing' && (
        <IncomingCall
          callerName={callState.remoteUserName || 'Unknown'}
          callerAvatar={callState.remoteUserAvatar}
          type={callState.type}
          onAccept={acceptCall}
          onReject={rejectCall}
          onRejectWithMessage={(msg) => {
            // Reject IMMEDIATELY, send message in background
            rejectWithMessage(msg)
            const activeChannel = activeDmIdRef.current
            if (activeChannel) {
              fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel_id: activeChannel, content: msg }),
              })
            }
          }}
        />
      )}
      {(callState.status === 'calling' || callState.status === 'connected' || callState.status === 'ended') && (
        <CallModal
          status={callState.status}
          type={callState.type}
          remoteName={callState.remoteUserName || 'Unknown'}
          remoteAvatar={callState.remoteUserAvatar}
          isMuted={callState.isMuted}
          isVideoOff={callState.isVideoOff}
          isSpeaker={callState.isSpeaker}
          duration={callState.duration}
          iceState={callState.iceState}
          hasRemoteTrack={callState.hasRemoteTrack}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleSpeaker={toggleSpeaker}
        />
      )}

      {/* Notification Toast */}
      {newMessageAlert && (
        <NotificationToast
          senderName={newMessageAlert.senderName}
          content={newMessageAlert.content}
          onDismiss={dismissAlert}
          onClick={handleNotificationClick}
        />
      )}

      {showApprovals && <ApprovalPanel workspaceId={workspaceId} onClose={() => setShowApprovals(false)} />}
      {showProfile && (
        <ProfileModal
          profile={profileData}
          onClose={() => setShowProfile(false)}
          onSave={handleProfileSave}
        />
      )}
    </div>
  )
}
