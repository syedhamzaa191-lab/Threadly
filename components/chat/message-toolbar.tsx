'use client'

import { useState } from 'react'
import { EmojiPicker } from './emoji-picker'

interface MessageToolbarProps {
  messageId: string
  isOwnMessage: boolean
  onReact: (emoji: string) => void
  onThreadClick: () => void
  onDelete?: () => void
}

export function MessageToolbar({ isOwnMessage, onReact, onThreadClick, onDelete }: MessageToolbarProps) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMore, setShowMore] = useState(false)

  // Keep toolbar visible when emoji picker or more menu is open
  const forceVisible = showEmoji || showMore

  return (
    <div className={`absolute -top-3.5 right-6 items-center gap-0.5 bg-[#322d45] rounded-lg shadow-lg border border-white/[0.08] px-1 py-0.5 z-40 ${forceVisible ? 'flex' : 'hidden group-hover:flex'}`}>
      <div className="relative">
        <button
          onClick={() => { setShowEmoji(!showEmoji); setShowMore(false) }}
          className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-all duration-150 ${showEmoji ? 'text-violet-400 bg-white/[0.08]' : 'text-white/30 hover:text-white/70'}`}
          title="Add reaction"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {showEmoji && (
          <EmojiPicker
            onSelect={(emoji) => { onReact(emoji); setShowEmoji(false) }}
            onClose={() => setShowEmoji(false)}
          />
        )}
      </div>
      <button
        onClick={onThreadClick}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-all duration-150 text-white/30 hover:text-white/70"
        title="Reply in thread"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      {isOwnMessage && (
        <div className="relative">
          <button
            onClick={() => { setShowMore(!showMore); setShowEmoji(false) }}
            className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-all duration-150 ${showMore ? 'text-violet-400 bg-white/[0.08]' : 'text-white/30 hover:text-white/70'}`}
            title="More actions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showMore && (
            <div className="absolute top-full right-0 mt-1 bg-[#322d45] rounded-lg shadow-lg border border-white/[0.08] py-1 min-w-[150px] z-50">
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setShowMore(false) }}
                  className="w-full px-3.5 py-2 text-left text-[13px] font-medium text-red-400 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
