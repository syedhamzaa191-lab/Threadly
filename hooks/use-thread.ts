'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Reply {
  id: string
  content: string
  channel_id: string
  sender_id: string
  parent_message_id: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function useThread(threadId: string | null, channelId: string) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchReplies = useCallback(async () => {
    if (!threadId) return

    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(id, full_name, avatar_url)')
      .eq('parent_message_id', threadId)
      .order('created_at', { ascending: true })

    setReplies(data || [])
    setLoading(false)
  }, [threadId])

  useEffect(() => {
    if (!threadId) {
      setReplies([])
      return
    }

    fetchReplies()

    // Real-time for thread replies
    const subscription = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `parent_message_id=eq.${threadId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles:sender_id(id, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setReplies((prev) => {
              if (prev.some((r) => r.id === data.id)) return prev
              return [...prev, data]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [threadId, fetchReplies])

  // Send via API route (all validation server-side)
  const sendReply = async (content: string) => {
    if (!threadId) return { error: new Error('No thread selected') }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_id: channelId,
        content,
        parent_message_id: threadId,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      return { error: new Error(data.error) }
    }
    return { error: null }
  }

  return { replies, loading, sendReply }
}
