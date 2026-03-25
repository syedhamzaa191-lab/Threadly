'use client'

import { Avatar } from '@/components/ui/avatar'

interface MessageItemProps {
  id: string
  content: string
  senderName: string
  senderAvatar?: string | null
  timestamp: string
  threadCount?: number
  onThreadClick?: (messageId: string) => void
}

export function MessageItem({
  id,
  content,
  senderName,
  senderAvatar,
  timestamp,
  threadCount,
  onThreadClick,
}: MessageItemProps) {
  return (
    <div className="group px-6">
      <div className="flex gap-3.5 py-4 border-b border-gray-100 group-last:border-b-0">
        <Avatar name={senderName} src={senderAvatar} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[13px] font-bold text-gray-900">{senderName}</span>
            <span className="text-[11px] text-gray-900 font-medium">{timestamp}</span>
          </div>
          <p className="text-[13px] text-gray-900 mt-1 whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </p>
          {threadCount !== undefined && threadCount > 0 && (
            <button
              onClick={() => onThreadClick?.(id)}
              className="mt-2.5 flex items-center gap-1.5 text-[12px] text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-semibold transition-colors duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
