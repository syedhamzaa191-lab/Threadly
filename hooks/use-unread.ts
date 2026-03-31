'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UnreadState {
  [channelId: string]: number
}

// Cache channel->workspace mapping to avoid repeated DB lookups
const channelWorkspaceCache: Record<string, string> = {}

export function useUnread(workspaceId: string, activeChannelId: string | undefined, currentUserId: string | undefined) {
  const [unread, setUnread] = useState<UnreadState>({})
  const [newMessageAlert, setNewMessageAlert] = useState<{ channelId: string; senderName: string; content: string } | null>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const activeRef = useRef(activeChannelId)
  activeRef.current = activeChannelId

  // Clear unread when user views a channel
  useEffect(() => {
    if (activeChannelId) {
      setUnread((prev) => {
        if (!prev[activeChannelId]) return prev
        const next = { ...prev }
        delete next[activeChannelId]
        return next
      })
    }
  }, [activeChannelId])

  // Auto-dismiss alert
  useEffect(() => {
    if (newMessageAlert) {
      const timer = setTimeout(() => setNewMessageAlert(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [newMessageAlert])

  // Pre-load channel cache for this workspace
  useEffect(() => {
    if (!workspaceId) return
    supabase
      .from('channels')
      .select('id, workspace_id')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => {
        if (data) {
          for (const ch of data) {
            channelWorkspaceCache[ch.id] = ch.workspace_id
          }
        }
      })
  }, [workspaceId, supabase])

  useEffect(() => {
    if (!workspaceId || !currentUserId) return

    const channel = supabase
      .channel(`unread-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new as any
          if (msg.sender_id === currentUserId) return
          if (msg.parent_message_id) return
          if (msg.channel_id === activeRef.current) return

          // Check cache first, only query DB if not cached
          let wsId = channelWorkspaceCache[msg.channel_id]
          if (!wsId) {
            const { data: ch } = await supabase
              .from('channels')
              .select('workspace_id')
              .eq('id', msg.channel_id)
              .single()
            if (!ch) return
            wsId = ch.workspace_id
            channelWorkspaceCache[msg.channel_id] = wsId
          }

          if (wsId !== workspaceId) return

          // Increment unread immediately (don't wait for profile fetch)
          setUnread((prev) => ({
            ...prev,
            [msg.channel_id]: (prev[msg.channel_id] || 0) + 1,
          }))

          // Get sender name for notification toast
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single()

          setNewMessageAlert({
            channelId: msg.channel_id,
            senderName: profile?.full_name || 'Someone',
            content: msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : ''),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, currentUserId, supabase])

  const dismissAlert = useCallback(() => {
    setNewMessageAlert(null)
  }, [])

  return { unread, newMessageAlert, dismissAlert }
}
