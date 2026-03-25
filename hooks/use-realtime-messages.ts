'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type Message = {
  id: string
  channel_id: string
  user_id: string
  content: string
  thread_id: string | null
  reply_count: number
  created_at: string
  updated_at: string
  profiles?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function useRealtimeMessages(channelId: string, threadId?: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    let query = supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })

    if (threadId) {
      // Fetch thread replies
      query = query.eq('thread_id', threadId)
    } else {
      // Fetch top-level messages only
      query = query.is('thread_id', null)
    }

    const { data } = await query
    setMessages(data || [])
    setIsLoading(false)
  }, [channelId, threadId, supabase])

  useEffect(() => {
    fetchMessages()

    let realtimeChannel: RealtimeChannel

    const setupRealtime = () => {
      realtimeChannel = supabase
        .channel(`messages:${channelId}:${threadId || 'main'}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          async (payload) => {
            const newMsg = payload.new as Message

            // Only add if it matches our view (thread or main)
            if (threadId && newMsg.thread_id !== threadId) return
            if (!threadId && newMsg.thread_id !== null) {
              // Update reply_count on parent message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMsg.thread_id
                    ? { ...m, reply_count: m.reply_count + 1 }
                    : m
                )
              )
              return
            }

            // Fetch the message with profile
            const { data } = await supabase
              .from('messages')
              .select('*, profiles(*)')
              .eq('id', newMsg.id)
              .single()

            if (data) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev
                return [...prev, data]
              })
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const oldMsg = payload.old as { id: string }
            setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id))
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [channelId, threadId, fetchMessages, supabase])

  return { messages, isLoading }
}
