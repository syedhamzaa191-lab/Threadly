'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePresence(workspaceId: string, userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({})
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Load last seen from profiles on mount
  useEffect(() => {
    if (!workspaceId) return
    async function loadLastSeen() {
      const { data } = await supabase
        .from('profiles')
        .select('id, updated_at')
      if (data) {
        const map: Record<string, string> = {}
        for (const p of data) {
          if (p.updated_at) map[p.id] = p.updated_at
        }
        setLastSeen(prev => ({ ...map, ...prev }))
      }
    }
    loadLastSeen()
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId || !userId) return

    const channel = supabase.channel(`presence:${workspaceId}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const ids = new Set<string>(Object.keys(state))
        setOnlineUsers(ids)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        // User went offline — save last seen time
        if (key) {
          setLastSeen(prev => ({ ...prev, [key]: new Date().toISOString() }))
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() })
        }
      })

    // Update last_seen in profiles every 60s
    const interval = setInterval(async () => {
      await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', userId)
    }, 60000)

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [workspaceId, userId])

  const isOnline = (uid: string) => onlineUsers.has(uid)

  const getLastSeen = (uid: string): string => {
    if (isOnline(uid)) return 'Online'
    const time = lastSeen[uid]
    if (!time) return 'Offline'
    return formatLastSeen(time)
  }

  return { onlineUsers, isOnline, getLastSeen }
}

function formatLastSeen(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Last seen just now'
  if (mins < 60) return `Last seen ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Last seen ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Last seen yesterday'
  return `Last seen ${days}d ago`
}
