'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMessages } from '@/hooks/use-messages'
import { useThread } from '@/hooks/use-thread'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ThreadPanel } from '@/components/chat/thread-panel'
import { Avatar } from '@/components/ui/avatar'
import { ReactionGroup } from '@/components/chat/reaction-display'
import { createClient } from '@/lib/supabase/client'
import { useCallContext } from '../../layout'

export default function DmPage() {
  const params = useParams()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const { user } = useAuth()
  const { startCall } = useCallContext()
  const { messages, loading, sendMessage, deleteMessage, toggleReaction } = useMessages(channelId)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<{ id: string; full_name: string; avatar_url: string | null } | null>(null)

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

      if (channel?.dm_user_ids) {
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

  const formattedMessages = messages.map((m) => ({
    id: m.id,
    content: m.content,
    sender_id: m.sender_id,
    sender_name: m.profiles?.full_name || 'Unknown',
    sender_avatar: m.profiles?.avatar_url || null,
    created_at: m.created_at,
    thread_count: m.reply_count,
    reactions: buildReactionGroups(m.reactions || []),
  }))

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
      <main className="flex-1 flex flex-col min-w-0 bg-[#1e1a2b] page-enter">
        {/* DM Header */}
        <div className="px-4 md:px-6 py-3 md:py-3.5 flex items-center justify-between bg-[#252133] border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:block">
              <Avatar name={otherUser?.full_name || '?'} src={otherUser?.avatar_url} size="lg" online />
            </div>
            <div className="sm:hidden">
              <Avatar name={otherUser?.full_name || '?'} src={otherUser?.avatar_url} size="md" online />
            </div>
            <div>
              <h2 className="font-bold text-[16px] text-white tracking-tight">
                {otherUser?.full_name || 'Loading...'}
              </h2>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">Direct Message</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
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

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-white/30">Loading messages...</p>
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

      {threadMessageId && formattedParent && (
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
