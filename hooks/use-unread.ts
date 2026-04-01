'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Request notification permission once
let permissionRequested = false
function requestNotificationPermission() {
  if (permissionRequested) return
  permissionRequested = true
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// Send browser push notification (works even when tab is not focused)
function sendBrowserNotification(senderName: string, content: string, channelId: string, workspaceId: string, avatarUrl?: string | null) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.hasFocus()) return // Don't show if app is focused

  const notification = new Notification(senderName, {
    body: content,
    icon: avatarUrl || '/favicon.ico',
    badge: '/favicon.ico',
    tag: `msg-${channelId}`,
    silent: false,
    requireInteraction: false,
  })

  notification.onclick = () => {
    window.focus()
    const path = `/workspace/${workspaceId}/dm/${channelId}`
    window.location.href = path
    notification.close()
  }

  setTimeout(() => notification.close(), 8000)
}

interface UnreadState {
  [channelId: string]: number
}

// Cache channel->workspace mapping to avoid repeated DB lookups
const channelWorkspaceCache: Record<string, string> = {}
// Cache sender profiles for notifications
const senderProfileCache: Record<string, { full_name: string; avatar_url: string | null }> = {}

export function useUnread(workspaceId: string, activeChannelId: string | undefined, currentUserId: string | undefined) {
  // Request permission on first use
  useEffect(() => { requestNotificationPermission() }, [])
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

  // Pre-load cache THEN subscribe to realtime (fixes race condition)
  useEffect(() => {
    if (!workspaceId || !currentUserId) return

    let channel: any = null

    async function setup() {
      // Load cache first
      const { data } = await supabase
        .from('channels')
        .select('id, workspace_id')
        .eq('workspace_id', workspaceId)

      if (data) {
        for (const ch of data) {
          channelWorkspaceCache[ch.id] = ch.workspace_id
        }
      }

      // NOW subscribe — cache is ready
      channel = supabase
        .channel(`unread-${workspaceId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            const msg = payload.new as any
            if (msg.sender_id === currentUserId) return
            if (msg.parent_message_id) return
            if (msg.channel_id === activeRef.current) return

            // Check cache (already loaded)
            let wsId = channelWorkspaceCache[msg.channel_id]
            if (!wsId) {
              // New channel created after cache load — fetch once
              const { data: ch } = await supabase
                .from('channels')
                .select('workspace_id')
                .eq('id', msg.channel_id)
                .single()
              if (ch) {
                wsId = ch.workspace_id
                channelWorkspaceCache[msg.channel_id] = wsId
              }
            }

            // Skip if different workspace
            if (wsId && wsId !== workspaceId) return

            // Increment unread
            setUnread((prev) => ({
              ...prev,
              [msg.channel_id]: (prev[msg.channel_id] || 0) + 1,
            }))

            // Get sender info (cached to avoid DB hit per message)
            if (!senderProfileCache[msg.sender_id]) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', msg.sender_id)
                .single()
              if (profile) senderProfileCache[msg.sender_id] = profile
            }
            const cachedProfile = senderProfileCache[msg.sender_id]
            const senderName = cachedProfile?.full_name || 'Someone'
            const truncatedContent = msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : '')

            setNewMessageAlert({
              channelId: msg.channel_id,
              senderName,
              content: truncatedContent,
            })

            // Browser push notification (works when tab not focused)
            sendBrowserNotification(senderName, truncatedContent, msg.channel_id, workspaceId, cachedProfile?.avatar_url)
          }
        )
        .subscribe()
    }

    setup()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [workspaceId, currentUserId])

  const dismissAlert = useCallback(() => {
    setNewMessageAlert(null)
  }, [])

  return { unread, newMessageAlert, dismissAlert }
}
