'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ReactionData {
  emoji: string
  user_id: string
}

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
  reactions: ReactionData[]
}

// Global profile cache — shared across all useMessages instances
const profileCache: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const enrichWithProfiles = useCallback(async (msgs: any[]) => {
    if (msgs.length === 0) return []
    const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)))

    // Check which profiles we need to fetch (not in cache)
    const uncachedIds = senderIds.filter((id) => !profileCache[id])

    if (uncachedIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uncachedIds)

      // Add to cache
      for (const p of profiles || []) {
        profileCache[p.id] = p
      }
    }

    return msgs.map((m) => ({
      ...m,
      profiles: profileCache[m.sender_id] || null,
    }))
  }, [supabase])

  const fetchReactions = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return {}
    const { data } = await supabase
      .from('reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds)

    const map: Record<string, ReactionData[]> = {}
    for (const r of data || []) {
      if (!map[r.message_id]) map[r.message_id] = []
      map[r.message_id].push({ emoji: r.emoji, user_id: r.user_id })
    }
    return map
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
    const messageIds = enriched.map((m: any) => m.id)
    const reactionsMap = await fetchReactions(messageIds)

    const withReactions = enriched.map((m: any) => ({
      ...m,
      reactions: reactionsMap[m.id] || [],
    }))

    setMessages(withReactions)
    setLoading(false)
  }, [channelId, enrichWithProfiles, fetchReactions, supabase])

  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    fetchMessages()

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
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newMsg.parent_message_id
                  ? { ...m, reply_count: (m.reply_count || 0) + 1 }
                  : m
              )
            )
            return
          }
          const enriched = await enrichWithProfiles([newMsg])
          if (enriched[0]) {
            setMessages((prev) => {
              // Check if this exact message already exists
              if (prev.some((m) => m.id === enriched[0].id)) return prev
              // Remove any temp optimistic message with same content/sender
              const withoutTemp = prev.filter((m) =>
                !(m.id.startsWith('temp-') && m.sender_id === enriched[0].sender_id && m.content === enriched[0].content)
              )
              return [...withoutTemp, { ...enriched[0], reactions: [] }]
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
      .subscribe()

    // Reactions realtime — listen globally and filter in handler
    const reactionsChannel = supabase
      .channel(`realtime-reactions-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new as any
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== r.message_id) return m
                const exists = m.reactions.some(
                  (er) => er.emoji === r.emoji && er.user_id === r.user_id
                )
                if (exists) return m
                return { ...m, reactions: [...m.reactions, { emoji: r.emoji, user_id: r.user_id }] }
              })
            )
          } else if (payload.eventType === 'DELETE') {
            const r = payload.old as any
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== r.message_id) return m
                return {
                  ...m,
                  reactions: m.reactions.filter(
                    (er) => !(er.emoji === r.emoji && er.user_id === r.user_id)
                  ),
                }
              })
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(reactionsChannel)
    }
  }, [channelId])

  const sendMessage = async (content: string, currentUser?: { id: string; full_name: string; avatar_url: string | null }) => {
    // Optimistic: show message instantly in UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    if (currentUser) {
      const optimisticMsg: Message = {
        id: tempId,
        content,
        channel_id: channelId,
        sender_id: currentUser.id,
        parent_message_id: null,
        reply_count: 0,
        created_at: new Date().toISOString(),
        profiles: {
          id: currentUser.id,
          full_name: currentUser.full_name,
          avatar_url: currentUser.avatar_url,
        },
        reactions: [],
      }
      setMessages((prev) => [...prev, optimisticMsg])
    }

    // Send to server in background
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, content }),
    })
    if (!res.ok) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      const data = await res.json()
      return { error: new Error(data.error) }
    }
    // Real message will arrive via realtime subscription and replace/deduplicate
    return { error: null }
  }

  const deleteMessage = async (messageId: string) => {
    const res = await fetch(`/api/messages?id=${messageId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      return { error: new Error(data.error) }
    }
    return { error: null }
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    const res = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, emoji }),
    })
    if (!res.ok) {
      const data = await res.json()
      return { error: new Error(data.error) }
    }
    return { error: null }
  }

  return { messages, loading, sendMessage, deleteMessage, toggleReaction }
}
