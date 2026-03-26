'use client'

import { useState } from 'react'
import { EmojiPicker } from './emoji-picker'

export interface ReactionGroup {
  emoji: string
  count: number
  userIds: string[]
  reacted: boolean
}

interface ReactionDisplayProps {
  reactions: ReactionGroup[]
  onToggle: (emoji: string) => void
}

export function ReactionDisplay({ reactions, onToggle }: ReactionDisplayProps) {
  const [showPicker, setShowPicker] = useState(false)

  if (reactions.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap relative">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium border transition-all duration-150 ${
            r.reacted
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-200'
              : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
          }`}
        >
          <span className="text-[14px]">{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.08] text-white/25 hover:bg-white/[0.08] hover:text-white/50 transition-all duration-150 text-[13px]"
        >
          +
        </button>
        {showPicker && (
          <EmojiPicker onSelect={(emoji) => onToggle(emoji)} onClose={() => setShowPicker(false)} />
        )}
      </div>
    </div>
  )
}
