'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMessages } from '@/hooks/use-messages'
import { useThread } from '@/hooks/use-thread'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ThreadPanel } from '@/components/chat/thread-panel'
import { Avatar } from '@/components/ui/avatar'
import { ReactionGroup } from '@/components/chat/reaction-display'
import { createClient } from '@/lib/supabase/client'
import { UserProfilePanel } from '@/components/profile/user-profile-panel'
import { ForwardModal } from '@/components/chat/forward-modal'
import { useCallContext } from '../../layout'

export default function DmPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const { user } = useAuth()
  const { startCall } = useCallContext()
  const { messages, loading, sendMessage, deleteMessage, toggleReaction } = useMessages(channelId)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<{ id: string; full_name: string; avatar_url: string | null } | null>(null)
  const [forwardMsg, setForwardMsg] = useState<{ content: string; senderName: string } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [, setHighlightMsgId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return messages.filter((m) => m.content.toLowerCase().includes(q)).slice(0, 10)
  }, [searchQuery, messages])

  const scrollToMessage = (msgId: string) => {
    setShowSearch(false)
    setSearchQuery('')
    setHighlightMsgId(msgId)
    setTimeout(() => {
      const el = document.getElementById(`msg-${msgId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('bg-violet-500/10')
        setTimeout(() => { el.classList.remove('bg-violet-500/10'); setHighlightMsgId(null) }, 2000)
      }
    }, 100)
  }

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  const threadParent = messages.find((m) => m.id === threadMessageId)
  const { replies, sendReply } = useThread(threadMessageId, channelId)

  useEffect(() => {
    async function loadOtherUser() {
      if (!user) return
      const { data: channel } = await supabase
        .from('channels')
        .select('dm_user_ids')
        .eq('id', channelId)
        .single()

      if (!channel) {
        // Invalid DM channel — redirect back
        router.push(`/workspace/${workspaceId}`)
        return
      }

      if (channel.dm_user_ids) {
        const otherId = (channel.dm_user_ids as string[]).find((id: string) => id !== user.id) || (channel.dm_user_ids as string[])[0]
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherId)
          .single()
        setOtherUser(profile)
      }
    }
    loadOtherUser()
  }, [channelId, user])

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
        {/* DM Header */}
        <div className="px-4 md:px-6 py-3 md:py-3.5 flex items-center justify-between bg-[#252133] border-b border-white/[0.06]">
          <button onClick={() => otherUser && setProfileUserId(otherUser.id)} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
            <div className="hidden sm:block">
              <Avatar name={otherUser?.full_name || '?'} src={otherUser?.avatar_url} size="lg" online />
            </div>
            <div className="sm:hidden">
              <Avatar name={otherUser?.full_name || '?'} src={otherUser?.avatar_url} size="md" online />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-[16px] text-white tracking-tight hover:text-violet-300 transition-colors">
                {otherUser?.full_name || 'Loading...'}
              </h2>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">Direct Message</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${showSearch ? 'text-violet-400 bg-violet-500/10' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'}`}
              title="Search messages"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {/* Voice Call */}
            <button
              onClick={() => otherUser && startCall(otherUser.id, otherUser.full_name, otherUser.avatar_url, 'voice')}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-all duration-150"
              title="Voice Call"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            {/* Video Call */}
            <button
              onClick={() => otherUser && startCall(otherUser.id, otherUser.full_name, otherUser.avatar_url, 'video')}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
              title="Video Call"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

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
                placeholder="Search in conversation..."
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
            {/* Results */}
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
          placeholder={`Message ${otherUser?.full_name || '...'}`}
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
