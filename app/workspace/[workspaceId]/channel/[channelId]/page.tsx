'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMessages } from '@/hooks/use-messages'
import { useThread } from '@/hooks/use-thread'
import { useChannels } from '@/hooks/use-channels'
import { useWorkspace } from '@/hooks/use-workspace'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ThreadPanel } from '@/components/chat/thread-panel'
import { UserProfilePanel } from '@/components/profile/user-profile-panel'
import { ForwardModal } from '@/components/chat/forward-modal'
import { ReactionGroup } from '@/components/chat/reaction-display'

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string

  const { user } = useAuth()
  const { channels } = useChannels(workspaceId)
  const { members, myRole } = useWorkspace(workspaceId)
  const { messages, loading, sendMessage, deleteMessage, toggleReaction } = useMessages(channelId)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [forwardMsg, setForwardMsg] = useState<{ content: string; senderName: string } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return messages.filter((m) => m.content.toLowerCase().includes(q)).slice(0, 10)
  }, [searchQuery, messages])

  const scrollToMessage = (msgId: string) => {
    setShowSearch(false)
    setSearchQuery('')
    setTimeout(() => {
      const el = document.getElementById(`msg-${msgId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('bg-violet-500/10')
        setTimeout(() => el.classList.remove('bg-violet-500/10'), 2000)
      }
    }, 100)
  }

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  const threadParent = messages.find((m) => m.id === threadMessageId)
  const { replies, sendReply } = useThread(threadMessageId, channelId)

  const channel = channels.find((c) => c.id === channelId)

  // Redirect if channel doesn't exist (after channels loaded)
  useEffect(() => {
    if (channels.length > 0 && !channels.find((c) => c.id === channelId)) {
      router.push(`/workspace/${workspaceId}`)
    }
  }, [channels, channelId, workspaceId, router])

  function buildReactionGroups(reactions: { emoji: string; user_id: string }[]): ReactionGroup[] {
    const map = new Map<string, { count: number; userIds: string[] }>()
    for (const r of reactions) {
      const existing = map.get(r.emoji)
      if (existing) {
        existing.count++
        existing.userIds.push(r.user_id)
      } else {
        map.set(r.emoji, { count: 1, userIds: [r.user_id] })
      }
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userIds: data.userIds,
      reacted: user ? data.userIds.includes(user.id) : false,
    }))
  }

  const formattedMessages = useMemo(() => messages.map((m) => ({
    id: m.id,
    content: m.content,
    sender_id: m.sender_id,
    sender_name: m.profiles?.full_name || 'Unknown',
    sender_avatar: m.profiles?.avatar_url || null,
    created_at: m.created_at,
    thread_count: m.reply_count,
    reactions: buildReactionGroups(m.reactions || []),
  })), [messages, user])

  const formattedReplies = replies.map((r) => ({
    id: r.id,
    content: r.content,
    sender_name: r.profiles?.full_name || 'Unknown',
    sender_avatar: r.profiles?.avatar_url || null,
    created_at: r.created_at,
  }))

  const formattedParent = threadParent
    ? {
        id: threadParent.id,
        content: threadParent.content,
        sender_name: threadParent.profiles?.full_name || 'Unknown',
        sender_avatar: threadParent.profiles?.avatar_url || null,
        created_at: threadParent.created_at,
      }
    : null

  return (
    <>
      <main className="flex-1 flex flex-col min-w-0 bg-[#1e1a2b] page-enter overflow-x-hidden">
        <ChatHeader
          channelName={channel?.name || 'channel'}
          memberCount={members.length}
          isAdmin={myRole === 'owner' || myRole === 'admin'}
          showSearch={showSearch}
          onSearchToggle={() => setShowSearch(!showSearch)}
        />
        {/* Search bar */}
        {showSearch && (
          <div className="px-4 md:px-6 py-3 bg-[#252133] border-b border-white/[0.06] relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in channel..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] rounded-xl text-[13px] text-white/80 placeholder:text-white/25 border border-white/[0.08] focus:border-violet-500/30 focus:bg-white/[0.08] transition-all outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 max-h-[240px] overflow-y-auto scrollbar-dark rounded-xl border border-white/[0.06] bg-[#1e1a2b]">
                {searchResults.length === 0 ? (
                  <p className="text-center text-white/25 text-[13px] py-4">No messages found</p>
                ) : (
                  searchResults.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => scrollToMessage(msg.id)}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-white/60">{msg.profiles?.full_name || 'Unknown'}</span>
                        <span className="text-[10px] text-white/20">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[13px] text-white/40 truncate">{msg.content}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex-1 flex items-end justify-center pb-4">
            <div className="flex gap-1.5 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_400ms]" />
            </div>
          </div>
        ) : (
          <MessageList
            messages={formattedMessages}
            currentUserId={user?.id}
            onThreadClick={setThreadMessageId}
            onReact={async (messageId, emoji) => {
              await toggleReaction(messageId, emoji)
            }}
            onDelete={async (messageId) => {
              await deleteMessage(messageId)
            }}
            onUserClick={(uid) => { setThreadMessageId(null); setProfileUserId(uid) }}
            onForward={(_id, content, senderName) => setForwardMsg({ content, senderName })}
          />
        )}
        <MessageInput
          placeholder={`Message #${channel?.name || 'channel'}`}
          onSend={async (content) => {
            const profile = user ? { id: user.id, full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You', avatar_url: user.user_metadata?.avatar_url || null } : undefined
            await sendMessage(content, profile)
          }}
        />
      </main>

      {forwardMsg && user && (
        <ForwardModal
          messageContent={forwardMsg.content}
          senderName={forwardMsg.senderName}
          workspaceId={workspaceId}
          currentUserId={user.id}
          excludeChannelId={channelId}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {profileUserId && (
        <UserProfilePanel userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      {!profileUserId && threadMessageId && formattedParent && (
        <ThreadPanel
          parentMessage={formattedParent}
          replies={formattedReplies}
          onClose={() => setThreadMessageId(null)}
          onSendReply={async (content) => {
            await sendReply(content)
          }}
        />
      )}
    </>
  )
}
