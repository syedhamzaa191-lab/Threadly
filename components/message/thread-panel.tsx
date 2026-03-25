'use client'

import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import MessageItem from './message-item'
import MessageInput from './message-input'
import { useEffect, useRef } from 'react'

export default function ThreadPanel({
  channelId,
  threadId,
  onClose,
}: {
  channelId: string
  threadId: string
  onClose: () => void
}) {
  const { messages: parentMessages } = useRealtimeMessages(channelId)
  const { messages: replies, isLoading } = useRealtimeMessages(channelId, threadId)
  const bottomRef = useRef<HTMLDivElement>(null)

  const parentMessage = parentMessages.find((m) => m.id === threadId)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [replies])

  return (
    <div className="w-96 border-l border-gray-200 flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Thread</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Parent message */}
      {parentMessage && (
        <div className="border-b border-gray-100">
          <MessageItem message={parentMessage} showThreadButton={false} />
        </div>
      )}

      {/* Replies */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {isLoading ? (
          <div className="text-center text-gray-400 text-sm py-4">Loading...</div>
        ) : replies.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-4">No replies yet</div>
        ) : (
          <>
            <div className="px-5 py-2">
              <p className="text-xs text-gray-400">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </p>
            </div>
            {replies.map((reply) => (
              <MessageItem key={reply.id} message={reply} showThreadButton={false} />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <MessageInput
        channelId={channelId}
        threadId={threadId}
        placeholder="Reply in thread..."
      />
    </div>
  )
}
