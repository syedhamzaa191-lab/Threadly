'use client'

import { useState, FormEvent } from 'react'
import { IconButton } from '@/components/ui/icon-button'

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
      <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-gray-400 focus-within:bg-white transition-all duration-200">
        <IconButton type="button" size="sm" variant="ghost">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </IconButton>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none py-1.5 max-h-32 font-medium"
        />

        <IconButton type="button" size="sm" variant="ghost">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </IconButton>

        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
            content.trim()
              ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
              : 'text-gray-300'
          }`}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </form>
  )
}
