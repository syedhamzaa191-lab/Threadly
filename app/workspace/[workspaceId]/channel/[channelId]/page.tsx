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

export default function ChannelPage() {
  const params = useParams()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string

  const { user } = useAuth()
  const { channels } = useChannels(workspaceId)
  const { members } = useWorkspace(workspaceId)
  const { messages, loading, sendMessage } = useMessages(channelId)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)

  const threadParent = messages.find((m) => m.id === threadMessageId)
  const { replies, sendReply } = useThread(threadMessageId, channelId)

  const channel = channels.find((c) => c.id === channelId)

  const formattedMessages = messages.map((m) => ({
    id: m.id,
    content: m.content,
    sender_name: m.profiles?.full_name || 'Unknown',
    sender_avatar: m.profiles?.avatar_url || null,
    created_at: m.created_at,
    thread_count: m.reply_count,
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
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <ChatHeader
          channelName={channel?.name || 'channel'}
          memberCount={members.length}
        />
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-bold text-gray-900">Loading messages...</p>
          </div>
        ) : (
          <MessageList
            messages={formattedMessages}
            onThreadClick={setThreadMessageId}
          />
        )}
        <MessageInput
          placeholder={`Message #${channel?.name || 'channel'}`}
          onSend={async (content) => {
            await sendMessage(content)
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
