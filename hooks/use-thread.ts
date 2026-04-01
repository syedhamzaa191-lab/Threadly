'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { profileCache } from './use-messages'

interface ReactionData {
  emoji: string
  user_id: string
}

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
  reactions: ReactionData[]
}

export function useThread(threadId: string | null, channelId: string) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const enrichWithProfiles = useCallback(async (msgs: any[]) => {
    if (msgs.length === 0) return []
    const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)))

    // Check which profiles need fetching
    const uncachedIds = senderIds.filter((id) => !profileCache[id])

    if (uncachedIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uncachedIds)

      for (const p of profiles || []) {
        profileCache[p.id] = p
      }
    }

    return msgs.map((m) => ({
      ...m,
      profiles: profileCache[m.sender_id] || null,
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

      // Fetch reactions for replies
      const replyIds = enriched.map((r: any) => r.id)
      let reactionsMap: Record<string, ReactionData[]> = {}
      if (replyIds.length > 0) {
        const { data: reactions } = await supabase
          .from('reactions')
          .select('message_id, emoji, user_id')
          .in('message_id', replyIds)
        for (const r of reactions || []) {
          if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = []
          reactionsMap[r.message_id].push({ emoji: r.emoji, user_id: r.user_id })
        }
      }

      const withReactions = enriched.map((r: any) => ({ ...r, reactions: reactionsMap[r.id] || [] }))
      setReplies(withReactions)
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
              // Remove temp optimistic reply from same sender
              const tempIdx = prev.findIndex((r) => r.id.startsWith('temp-') && r.sender_id === enriched[0].sender_id)
              const withoutTemp = tempIdx >= 0 ? [...prev.slice(0, tempIdx), ...prev.slice(tempIdx + 1)] : prev
              return [...withoutTemp, { ...enriched[0], reactions: [] }]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [threadId, enrichWithProfiles])

  const sendReply = async (content: string, currentUser?: { id: string; full_name: string; avatar_url: string | null }) => {
    if (!threadId) return { error: new Error('No thread selected') }

    // Optimistic: show reply instantly
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    if (currentUser) {
      setReplies((prev) => [...prev, {
        id: tempId,
        content,
        channel_id: channelId,
        sender_id: currentUser.id,
        parent_message_id: threadId,
        created_at: new Date().toISOString(),
        profiles: { id: currentUser.id, full_name: currentUser.full_name, avatar_url: currentUser.avatar_url },
        reactions: [],
      }])
    }

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
      // Remove optimistic reply on failure
      setReplies((prev) => prev.filter((r) => r.id !== tempId))
      const data = await res.json()
      return { error: new Error(data.error) }
    }
    return { error: null }
  }

  return { replies, loading, sendReply }
}
