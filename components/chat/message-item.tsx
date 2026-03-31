'use client'

import { Avatar } from '@/components/ui/avatar'
import { MessageContent } from './message-content'
import { MessageToolbar } from './message-toolbar'
import { ReactionDisplay, ReactionGroup } from './reaction-display'

interface MessageItemProps {
  id: string
  content: string
  senderName: string
  senderAvatar?: string | null
  senderId?: string
  currentUserId?: string
  timestamp: string
  threadCount?: number
  isGrouped?: boolean
  reactions?: ReactionGroup[]
  onThreadClick?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onDelete?: (messageId: string) => void
  onUserClick?: (userId: string) => void
}

export function MessageItem({
  id,
  content,
  senderName,
  senderAvatar,
  senderId,
  currentUserId,
  timestamp,
  threadCount,
  isGrouped,
  reactions,
  onThreadClick,
  onReact,
  onDelete,
  onUserClick,
}: MessageItemProps) {
  const isOwnMessage = !!(senderId && currentUserId && senderId === currentUserId)

  if (isGrouped) {
    return (
      <div className="group relative px-4 md:px-8 hover:bg-white/[0.02] transition-colors duration-150">
        <div className="flex gap-3.5 py-[3px]">
          <div className="w-10 flex items-center justify-center shrink-0">
            <span className="hidden group-hover:block text-[10px] text-white/25 font-medium tabular-nums">
              {timestamp}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-white/80 leading-[1.65]">
              <MessageContent content={content} />
            </div>
            {reactions && reactions.length > 0 && onReact && (
              <ReactionDisplay reactions={reactions} onToggle={(emoji) => onReact(id, emoji)} />
            )}
          </div>
        </div>
        <MessageToolbar
          messageId={id}
          isOwnMessage={isOwnMessage}
          onReact={(emoji) => onReact?.(id, emoji)}
          onThreadClick={() => onThreadClick?.(id)}
          onDelete={isOwnMessage && onDelete ? () => onDelete(id) : undefined}
        />
      </div>
    )
  }

  return (
    <div className="group relative px-4 md:px-8 hover:bg-white/[0.02] transition-colors duration-150">
      <div className="flex gap-3.5 pt-5 pb-1">
        <button onClick={() => senderId && onUserClick?.(senderId)} className="shrink-0 mt-0.5 cursor-pointer">
          <Avatar name={senderName} src={senderAvatar} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <button onClick={() => senderId && onUserClick?.(senderId)} className="text-[14px] font-bold text-white hover:text-violet-300 transition-colors cursor-pointer">{senderName}</button>
            <span className="text-[11px] text-white/25 font-medium tabular-nums">{timestamp}</span>
          </div>
          <div className="text-[14px] text-white/80 mt-0.5 leading-[1.65]">
            <MessageContent content={content} />
          </div>
          {reactions && reactions.length > 0 && onReact && (
            <ReactionDisplay reactions={reactions} onToggle={(emoji) => onReact(id, emoji)} />
          )}
          {threadCount !== undefined && threadCount > 0 && (
            <button
              onClick={() => onThreadClick?.(id)}
              className="mt-2.5 group/thread flex items-center gap-2 text-[12px] text-purple-300 hover:text-purple-200 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 rounded-lg font-semibold transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>{threadCount} {threadCount === 1 ? 'reply' : 'replies'}</span>
              <span className="text-white/20 group-hover/thread:text-white/30 ml-0.5">View &rsaquo;</span>
            </button>
          )}
        </div>
      </div>
      <MessageToolbar
        messageId={id}
        isOwnMessage={isOwnMessage}
        onReact={(emoji) => onReact?.(id, emoji)}
        onThreadClick={() => onThreadClick?.(id)}
        onDelete={isOwnMessage && onDelete ? () => onDelete(id) : undefined}
      />
    </div>
  )
}
