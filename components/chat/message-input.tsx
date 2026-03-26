'use client'

import { useState, useRef, FormEvent } from 'react'
import { FormattingToolbar } from './formatting-toolbar'

interface MessageInputProps {
  placeholder?: string
  onSend: (content: string) => void
  disabled?: boolean
}

export function MessageInput({
  placeholder = 'Type a message...',
  onSend,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 md:px-6 pb-3 md:pb-5 pt-2 bg-[#1e1a2b]">
      <div className={`rounded-xl border transition-all duration-200 overflow-hidden bg-[#2a2540] ${
        isFocused
          ? 'border-purple-500/40 shadow-[0_0_0_2px_rgba(168,85,247,0.1)]'
          : 'border-white/[0.08] hover:border-white/[0.12]'
      }`}>
        <FormattingToolbar
          textareaRef={textareaRef}
          content={content}
          onContentChange={setContent}
        />
        <div className="flex items-end gap-2 px-3 py-2.5">
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all duration-150 shrink-0"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/25 resize-none focus:outline-none py-1 max-h-32 leading-relaxed"
          />

          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all duration-150 shrink-0"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            type="submit"
            disabled={disabled || !content.trim()}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
              content.trim()
                ? 'bg-purple-600 text-white hover:bg-purple-500 active:scale-95'
                : 'text-white/15 bg-white/[0.04]'
            }`}
          >
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  )
}
