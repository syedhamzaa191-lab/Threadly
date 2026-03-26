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
import { createClient } from '@/lib/supabase/client'

export default function DmPage() {
  const params = useParams()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const { user } = useAuth()
  const { messages, loading, sendMessage } = useMessages(channelId)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<{ full_name: string; avatar_url: string | null } | null>(null)

  const threadParent = messages.find((m) => m.id === threadMessageId)
  const { replies, sendReply } = useThread(threadMessageId, channelId)

  // Fetch other user info
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
          .select('full_name, avatar_url')
          .eq('id', otherId)
          .single()
        setOtherUser(profile)
      }
    }
    loadOtherUser()
  }, [channelId, user])

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
        {/* DM Header */}
        <div className="px-6 py-4 flex items-center gap-3 bg-white border-b border-gray-100">
          <Avatar name={otherUser?.full_name || '?'} src={otherUser?.avatar_url} size="md" online />
          <div>
            <h2 className="font-bold text-lg text-gray-900 tracking-tight">
              {otherUser?.full_name || 'Loading...'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Direct Message</p>
          </div>
        </div>

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
          placeholder={`Message ${otherUser?.full_name || '...'}`}
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
