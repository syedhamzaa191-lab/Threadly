'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMessages } from '@/hooks/use-messages'
import { useThread } from '@/hooks/use-thread'
import { useChannels } from '@/hooks/use-channels'
import { useWorkspace } from '@/hooks/use-workspace'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ThreadPanel } from '@/components/chat/thread-panel'
import { ReactionGroup } from '@/components/chat/reaction-display'

export default function ChannelPage() {
  const params = useParams()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string

  const { user } = useAuth()
  const { channels } = useChannels(workspaceId)
  const { members, myRole } = useWorkspace(workspaceId)
  const { messages, loading, sendMessage, deleteMessage, toggleReaction } = useMessages(channelId)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)

  const threadParent = messages.find((m) => m.id === threadMessageId)
  const { replies, sendReply } = useThread(threadMessageId, channelId)

  const channel = channels.find((c) => c.id === channelId)

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
        <ChatHeader
          channelName={channel?.name || 'channel'}
          memberCount={members.length}
          isAdmin={myRole === 'owner' || myRole === 'admin'}
        />
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
