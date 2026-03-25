'use client'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Conversation {
  id: string
  name: string
  avatar?: string | null
  lastMessage: string
  timestamp: string
  unreadCount: number
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-900 font-medium">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 ${
            activeId === conv.id
              ? 'bg-gray-50'
              : 'hover:bg-gray-50/60'
          }`}
        >
          <Avatar name={conv.name} src={conv.avatar} size="lg" />
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-gray-900 truncate">
                {conv.name}
              </span>
              <span className="text-[11px] text-gray-900 font-medium shrink-0 ml-2">
                {conv.timestamp}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[12px] text-gray-900 truncate font-medium">
                {conv.lastMessage}
              </p>
              <Badge count={conv.unreadCount} />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
