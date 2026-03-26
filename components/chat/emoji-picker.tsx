'use client'

import { useEffect, useRef, useState } from 'react'

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤩', '😇', '🤗', '🤔', '😏', '😢', '😮', '🥳'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '💪', '👋', '🙏', '✌️', '🤞', '👀', '🫡'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💗', '💖'],
  },
  {
    name: 'Symbols',
    emojis: ['🔥', '✨', '⭐', '💯', '🚀', '🎉', '🎯', '💡', '✅', '❌', '⚡', '💎'],
  },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 bg-[#2a2540] rounded-2xl shadow-2xl border border-white/[0.08] p-0 z-50 w-[280px] sm:w-[320px] animate-scale-in overflow-hidden"
    >
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] px-2 pt-2 gap-1">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
              activeTab === i
                ? 'text-purple-300 bg-white/[0.06]'
                : 'text-white/25 hover:text-white/40'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-2 max-h-[200px] overflow-y-auto scrollbar-dark">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.08] active:scale-90 transition-all text-xl"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
