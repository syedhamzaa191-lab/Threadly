'use client'

import { Avatar } from '@/components/ui/avatar'
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

export function ThreadPanel({ parentMessage, replies, onClose, onSendReply }: ThreadPanelProps) {
  return (
    <div className="w-full sm:w-[400px] fixed sm:relative inset-0 sm:inset-auto z-[50] sm:z-auto h-full flex flex-col border-l border-white/[0.06] bg-[#1e1a2b] animate-slide-in">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/[0.06] bg-[#252133]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-white">Thread</h3>
            <p className="text-[11px] text-white/30 font-medium">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 bg-[#252133] border-b border-white/[0.06]">
        <div className="flex items-start gap-3">
          <Avatar name={parentMessage.sender_name} src={parentMessage.sender_avatar} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-bold text-white">{parentMessage.sender_name}</span>
              <span className="text-[11px] text-white/25 font-medium">
                {new Date(parentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-[14px] text-white/80 mt-1 whitespace-pre-wrap leading-relaxed">{parentMessage.content}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[11px] font-semibold text-white/25">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      </div>

      <MessageList messages={replies} />
      <MessageInput placeholder="Reply in thread..." onSend={onSendReply} />
    </div>
  )
}
