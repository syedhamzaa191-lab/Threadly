'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  } | null
}

export function useThread(threadId: string | null, channelId: string) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (!threadId) {
      setReplies([])
      return
    }

    setLoading(true)
    async function fetchReplies() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('parent_message_id', threadId)
        .order('created_at', { ascending: true })

      const enriched = await enrichWithProfiles(data || [])
      setReplies(enriched)
      setLoading(false)
    }

    fetchReplies()

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
          const enriched = await enrichWithProfiles([payload.new])
          if (enriched[0]) {
            setReplies((prev) => {
              if (prev.some((r) => r.id === enriched[0].id)) return prev
              return [...prev, enriched[0]]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [threadId, enrichWithProfiles, supabase])

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
