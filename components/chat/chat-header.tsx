'use client'

import { IconButton } from '@/components/ui/icon-button'

interface ChatHeaderProps {
  channelName: string
  memberCount?: number
  isAdmin?: boolean
  onManageMembers?: () => void
}

export function ChatHeader({ channelName, memberCount, isAdmin, onManageMembers }: ChatHeaderProps) {
  return (
    <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
      <div>
        <h2 className="font-bold text-lg text-gray-900 tracking-tight flex items-center gap-2">
          <span className="text-gray-900 font-normal">#</span> {channelName}
        </h2>
        {memberCount !== undefined && (
          <p className="text-xs text-gray-900 font-medium mt-0.5">{memberCount} members</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isAdmin && onManageMembers && (
          <button
            onClick={onManageMembers}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Manage
          </button>
        )}
        <IconButton size="sm">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </IconButton>
        <IconButton size="sm">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </IconButton>
      </div>
    </div>
  )
}
