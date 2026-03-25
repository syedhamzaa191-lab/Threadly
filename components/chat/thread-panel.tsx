'use client'

import { IconButton } from '@/components/ui/icon-button'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'

interface Message {
  id: string
  content: string
  sender_name: string
  sender_avatar?: string | null
  created_at: string
}

interface ThreadPanelProps {
  parentMessage: Message
  replies: Message[]
  onClose: () => void
  onSendReply: (content: string) => void
}

export function ThreadPanel({
  parentMessage,
  replies,
  onClose,
  onSendReply,
}: ThreadPanelProps) {
  return (
    <div className="w-[400px] h-full flex flex-col border-l border-gray-100 bg-white">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div>
          <h3 className="font-bold text-[15px] text-gray-900 tracking-tight">Thread</h3>
          <p className="text-[11px] text-gray-900 font-medium mt-0.5">{replies.length} replies</p>
        </div>
        <IconButton size="sm" onClick={onClose}>
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>
      </div>

      {/* Parent Message */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[13px] font-bold text-gray-900">
            {parentMessage.sender_name}
          </span>
          <span className="text-[11px] text-gray-900 font-medium">
            {new Date(parentMessage.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className="text-[13px] text-gray-900 mt-1.5 whitespace-pre-wrap leading-relaxed">
          {parentMessage.content}
        </p>
      </div>

      <div className="px-5 py-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-[11px] font-semibold text-gray-900">{replies.length} replies</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
      </div>

      {/* Replies */}
      <MessageList messages={replies} />

      {/* Reply Input */}
      <MessageInput placeholder="Reply in thread..." onSend={onSendReply} />
    </div>
  )
}
