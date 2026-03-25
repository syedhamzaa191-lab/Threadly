'use client'

import { useEffect, useRef } from 'react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import MessageItem from './message-item'

export default function MessageList({
  channelId,
  onThreadClick,
}: {
  channelId: string
  onThreadClick: (messageId: string) => void
}) {
  const { messages, isLoading } = useRealtimeMessages(channelId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading messages...</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">No messages yet</p>
          <p className="text-gray-300 text-xs mt-1">Be the first to send a message!</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin py-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onThreadClick={onThreadClick}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
