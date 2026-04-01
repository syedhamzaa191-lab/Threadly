'use client'

import { useEffect, useRef } from 'react'
import { MessageItem } from './message-item'
import { ReactionGroup } from './reaction-display'

interface Message {
  id: string
  content: string
  sender_id?: string
  sender_name: string
  sender_avatar?: string | null
  created_at: string
  thread_count?: number
  reactions?: ReactionGroup[]
}

interface MessageListProps {
  messages: Message[]
  currentUserId?: string
  onThreadClick?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onDelete?: (messageId: string) => void
  onForward?: (messageId: string, content: string, senderName: string) => void
  onUserClick?: (userId: string) => void
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function shouldGroup(current: Message, previous: Message | null): boolean {
  if (!previous) return false
  if (current.sender_name !== previous.sender_name) return false
  const timeDiff = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime()
  return timeDiff < 5 * 60 * 1000
}

function isDifferentDay(a: string, b: string): boolean {
  return new Date(a).toDateString() !== new Date(b).toDateString()
}

function isSenderChange(current: Message, previous: Message | null): boolean {
  if (!previous) return false
  return current.sender_id !== previous.sender_id
}

export function MessageList({ messages, currentUserId, onThreadClick, onReact, onDelete, onForward, onUserClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-white/60">No messages yet</p>
          <p className="text-sm text-white/25 mt-1">Send the first message to start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-dark">
      <div className="py-2">
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null
          const isGrouped = shouldGroup(msg, prevMsg)
          const showDateSeparator = !prevMsg || isDifferentDay(msg.created_at, prevMsg.created_at)
          const showSenderDivider = !showDateSeparator && isSenderChange(msg, prevMsg) && !isGrouped
          const isCallMessage = msg.content.startsWith('[CALL]') || msg.content.startsWith('📞') || msg.content.startsWith('📹')

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center gap-4 px-4 md:px-8 py-3 my-1">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-4 py-1.5 bg-white/[0.04] rounded-full border border-white/[0.06]">
                    {formatDate(msg.created_at)}
                  </span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
              )}
              {showSenderDivider && (
                <div className="px-4 md:px-8 py-1.5">
                  <div className="h-px bg-white/[0.04]" />
                </div>
              )}
              {isCallMessage ? (
                <CallLogItem
                  content={msg.content}
                  timestamp={formatTime(msg.created_at)}
                />
              ) : (
                <MessageItem
                  id={msg.id}
                  content={msg.content}
                  senderName={msg.sender_name}
                  senderAvatar={msg.sender_avatar}
                  senderId={msg.sender_id}
                  currentUserId={currentUserId}
                  timestamp={formatTime(msg.created_at)}
                  threadCount={msg.thread_count}
                  isGrouped={isGrouped && !showDateSeparator}
                  reactions={msg.reactions}
                  onThreadClick={onThreadClick}
                  onReact={onReact}
                  onDelete={onDelete}
                  onForward={onForward}
                  onUserClick={onUserClick}
                />
              )}
            </div>
          )
        })}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  )
}

function CallLogItem({ content, timestamp }: {
  content: string
  timestamp: string
}) {
  const displayContent = content.replace('[CALL] ', '')
  const isVideo = content.includes('📹') || content.includes('Video call')
  return (
    <div className="px-4 md:px-8 py-2">
      <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isVideo ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'
        }`}>
          {isVideo ? (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white/60">{displayContent}</p>
        </div>
        <span className="text-[10px] text-white/20 tabular-nums shrink-0">{timestamp}</span>
      </div>
    </div>
  )
}
