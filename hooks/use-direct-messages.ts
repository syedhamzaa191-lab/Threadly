'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DmConversation {
  id: string
  otherUser: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  lastMessage?: string
  lastMessageAt?: string
}

export function useDirectMessages(workspaceId: string, currentUserId: string | undefined) {
  const [conversations, setConversations] = useState<DmConversation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    if (!workspaceId || !currentUserId) return

    async function load() {
      const { data: dmChannels } = await supabase
        .from('channels')
        .select('id, dm_user_ids')
        .eq('workspace_id', workspaceId)
        .eq('is_dm', true)
        .contains('dm_user_ids', [currentUserId])

      if (!dmChannels || dmChannels.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Get other user IDs and channel IDs
      const otherUserIds = dmChannels.map((ch: any) => {
        const ids = ch.dm_user_ids as string[]
        return ids.find((id: string) => id !== currentUserId) || ids[0]
      })
      const channelIds = dmChannels.map((ch: any) => ch.id)

      // Parallel fetch: profiles + all last messages at once
      const [profilesResult, messagesResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url, is_deleted').in('id', otherUserIds),
        supabase.from('messages').select('channel_id, content, created_at')
          .in('channel_id', channelIds)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false })
          .limit(channelIds.length * 2),
      ])

      const profiles = profilesResult.data || []
      const allMessages = messagesResult.data || []

      // Group last message per channel
      const lastMessageMap: Record<string, { content: string; created_at: string }> = {}
      for (const msg of allMessages) {
        if (!lastMessageMap[msg.channel_id]) {
          lastMessageMap[msg.channel_id] = { content: msg.content, created_at: msg.created_at }
        }
      }

      const convos: DmConversation[] = dmChannels
        .map((ch: any) => {
          const otherId = (ch.dm_user_ids as string[]).find((id: string) => id !== currentUserId) || (ch.dm_user_ids as string[])[0]
          const profile = profiles.find((p: any) => p.id === otherId)

          // Skip deleted/deactivated users (no profile = permanently deleted)
          if (!profile || profile.is_deleted) return null

          const lastMsg = lastMessageMap[ch.id]

          return {
            id: ch.id,
            otherUser: {
              id: otherId,
              full_name: profile?.full_name || 'Unknown',
              avatar_url: profile?.avatar_url || null,
            },
            lastMessage: lastMsg?.content,
            lastMessageAt: lastMsg?.created_at,
          }
        })
        .filter(Boolean) as DmConversation[]

      convos.sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })

      setConversations(convos)
      setLoading(false)
    }

    load()

    // Realtime: update last message
    const channel = supabase
      .channel(`dm-updates-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any
          if (msg.parent_message_id) return

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === msg.channel_id)
            if (idx === -1) return prev

            const conv = { ...prev[idx], lastMessage: msg.content, lastMessageAt: msg.created_at }

            // If already at top, just update in place (no sort needed)
            if (idx === 0) {
              return [conv, ...prev.slice(1)]
            }

            // Move this conversation to top (it has the newest message)
            const without = prev.filter((_, i) => i !== idx)
            return [conv, ...without]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, currentUserId])

  const startDm = async (otherUserId: string) => {
    const res = await fetch('/api/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, other_user_id: otherUserId }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/workspace/${workspaceId}/dm/${data.channel_id}`)
    }
  }

  return { conversations, loading, startDm }
}
