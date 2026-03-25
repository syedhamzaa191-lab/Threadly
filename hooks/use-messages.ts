'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  channel_id: string
  sender_id: string
  parent_message_id: string | null
  reply_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    if (!channelId) return

    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(id, full_name, avatar_url)')
      .eq('channel_id', channelId)
      .is('parent_message_id', null) // Only top-level messages
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    fetchMessages()

    // Real-time subscription for messages in this channel
    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any
            // Only add top-level messages to the list
            if (newMsg.parent_message_id) {
              // It's a reply - update parent's reply_count
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMsg.parent_message_id
                    ? { ...m, reply_count: m.reply_count + 1 }
                    : m
                )
              )
              return
            }
            // Fetch with profile info
            const { data } = await supabase
              .from('messages')
              .select('*, profiles:sender_id(id, full_name, avatar_url)')
              .eq('id', newMsg.id)
              .single()

            if (data) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev
                return [...prev, data]
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id ? { ...m, ...payload.new } : m
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channelId, fetchMessages])

  // Send via API route (all validation happens server-side)
  const sendMessage = async (content: string) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, content }),
    })
    if (!res.ok) {
      const data = await res.json()
      return { error: new Error(data.error) }
    }
    return { error: null }
  }

  return { messages, loading, sendMessage }
}
