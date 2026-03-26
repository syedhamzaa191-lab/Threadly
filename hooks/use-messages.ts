'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  channel_id: string
  sender_id: string
  parent_message_id: string | null
  reply_count: number
  created_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const enrichWithProfiles = useCallback(async (msgs: any[]) => {
    if (msgs.length === 0) return []
    const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds)

    return msgs.map((m) => ({
      ...m,
      profiles: profiles?.find((p: any) => p.id === m.sender_id) || null,
    }))
  }, [supabase])

  const fetchMessages = useCallback(async () => {
    if (!channelId) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .is('parent_message_id', null)
      .order('created_at', { ascending: true })

    const enriched = await enrichWithProfiles(data || [])
    setMessages(enriched)
    setLoading(false)
  }, [channelId, enrichWithProfiles, supabase])

  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    fetchMessages()

    // Realtime subscription using Broadcast + Postgres Changes
    const channel = supabase
      .channel(`realtime-messages-${channelId}`, {
        config: { broadcast: { self: true } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          if (newMsg.parent_message_id) {
            // Thread reply - update parent reply count
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newMsg.parent_message_id
                  ? { ...m, reply_count: (m.reply_count || 0) + 1 }
                  : m
              )
            )
            return
          }
          // New top-level message
          const enriched = await enrichWithProfiles([newMsg])
          if (enriched[0]) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === enriched[0].id)) return prev
              return [...prev, enriched[0]]
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
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...payload.new } : m
            )
          )
        }
      )
      .subscribe((status) => {
        console.log(`Realtime messages subscription: ${status}`)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

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
