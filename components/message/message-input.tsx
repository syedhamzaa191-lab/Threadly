'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MessageInput({
  channelId,
  threadId,
  placeholder = 'Type a message...',
}: {
  channelId: string
  threadId?: string | null
  placeholder?: string
}) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  async function handleSubmit() {
    if (!content.trim() || sending) return

    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSending(false)
      return
    }

    await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: user.id,
      content: content.trim(),
      thread_id: threadId || null,
    })

    setContent('')
    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-5 pb-4">
      <div className="border border-gray-300 rounded-lg focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full px-3 py-2.5 resize-none focus:outline-none rounded-lg text-sm"
          style={{ minHeight: '44px', maxHeight: '200px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 200) + 'px'
          }}
        />
        <div className="flex items-center justify-end px-3 pb-2">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || sending}
            className="bg-brand-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
