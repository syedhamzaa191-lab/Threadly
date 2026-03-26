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

export function useChannels(workspaceId: string) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    if (!workspaceId) return

    async function fetchChannels() {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_dm', false)
        .order('created_at', { ascending: true })

      setChannels(data || [])
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
            setChannels((prev) => [...prev, payload.new as Channel])
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

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [workspaceId])

  const createChannel = async (name: string, userId: string) => {
    const { data, error } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspaceId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        created_by: userId,
      })
      .select()
      .single()

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
