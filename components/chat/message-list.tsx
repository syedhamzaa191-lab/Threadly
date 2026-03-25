'use client'

import { useEffect, useRef } from 'react'
import { MessageItem } from './message-item'

interface Message {
  id: string
  content: string
  sender_name: string
  sender_avatar?: string | null
  created_at: string
  thread_count?: number
}

interface MessageListProps {
  messages: Message[]
  onThreadClick?: (messageId: string) => void
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageList({ messages, onThreadClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">No messages yet</p>
          <p className="text-xs text-gray-900 mt-1">Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin py-3">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          id={msg.id}
          content={msg.content}
          senderName={msg.sender_name}
          senderAvatar={msg.sender_avatar}
          timestamp={formatTime(msg.created_at)}
          threadCount={msg.thread_count}
          onThreadClick={onThreadClick}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
