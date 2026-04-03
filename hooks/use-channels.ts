'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Channel {
  id: string
  name: string
  description: string
  workspace_id: string
  created_at: string
}

export function useChannels(workspaceId: string, userId?: string) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    if (!workspaceId) return

    async function fetchChannels() {
      // Get all non-DM channels
      const { data: allChannels } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_dm', false)
        .order('created_at', { ascending: true })

      if (!allChannels || allChannels.length === 0) {
        setChannels([])
        setLoading(false)
        return
      }

      if (!userId) {
        setLoading(false)
        return
      }

      // Get channels where user is a member via API (bypasses RLS)
      const res = await fetch(`/api/channels/my-channels?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        const memberChannelIds = (data.channel_ids || []) as string[]
        const filtered = allChannels.filter((ch: any) => memberChannelIds.includes(ch.id))
        setChannels(filtered)
      } else {
        // Fallback — show all channels if API fails
        setChannels(allChannels)
      }
      setLoading(false)
    }

    fetchChannels()

    // Real-time subscription for new channels
    const subscription = supabase
      .channel(`channels:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCh = payload.new as any
            if (newCh.is_dm) return // Skip DM channels
            setChannels((prev) => {
              if (prev.some(c => c.id === newCh.id)) return prev
              return [...prev, newCh as Channel]
            })
          } else if (payload.eventType === 'DELETE') {
            setChannels((prev) => prev.filter((c) => c.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setChannels((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Channel) : c))
            )
          }
        }
      )
      .subscribe()

    // Listen for channel_members changes — when user is added/removed, refresh channels
    const memberSub = supabase
      .channel(`channel-members:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_members' },
        (payload) => {
          const row = (payload.new || payload.old) as any
          if (row?.user_id === userId) {
            // User was added or removed — refetch channels
            fetchChannels()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
      supabase.removeChannel(memberSub)
    }
  }, [workspaceId, userId])

  const createChannel = async (name: string, userId: string) => {
    const { data, error } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspaceId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        created_by: userId,
        is_dm: false,
      })
      .select()
      .single()

    // Auto-add creator to channel
    if (data) {
      await supabase.from('channel_members').upsert({
        channel_id: data.id,
        user_id: userId,
      }, { onConflict: 'channel_id,user_id' })
    }

    return { data, error }
  }

  const deleteChannel = async (channelId: string) => {
    const res = await fetch(`/api/channels?id=${channelId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) return { error: new Error(data.error) }
    return { error: null }
  }

  return { channels, loading, createChannel, deleteChannel }
}
