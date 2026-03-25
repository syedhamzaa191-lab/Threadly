'use client'

import { formatDate, getInitials } from '@/lib/utils'
import type { Message } from '@/hooks/use-realtime-messages'

export default function MessageItem({
  message,
  onThreadClick,
  showThreadButton = true,
}: {
  message: Message
  onThreadClick?: (messageId: string) => void
  showThreadButton?: boolean
}) {
  const profile = message.profiles
  const name = profile?.full_name || 'Unknown'

  return (
    <div className="group flex gap-3 px-5 py-1.5 hover:bg-gray-50">
      <div className="w-9 h-9 rounded-md bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-sm">{name}</span>
          <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
        {showThreadButton && message.reply_count > 0 && onThreadClick && (
          <button
            onClick={() => onThreadClick(message.id)}
            className="mt-1 text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
          >
            {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
        {showThreadButton && message.reply_count === 0 && onThreadClick && (
          <button
            onClick={() => onThreadClick(message.id)}
            className="mt-1 text-xs text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Reply in thread
          </button>
        )}
      </div>
    </div>
  )
}
