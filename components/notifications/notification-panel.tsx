'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface MentionNotification {
  id: string
  message_id: string
  content: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  channel_id: string
  channel_name: string
  is_dm: boolean
  is_read: boolean
  type: string
  parent_message_id: string | null
  created_at: string
}

interface NotificationPanelProps {
  workspaceId: string
  currentUserId: string
  onClose: () => void
  onNavigate: (channelId: string, isDm: boolean, parentMessageId?: string | null) => void
  onReadAll: () => void
}

export function NotificationPanel({ currentUserId, onClose, onNavigate, onReadAll }: NotificationPanelProps) {
  const [mentions, setMentions] = useState<MentionNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    async function loadMentions() {
      // Get mentions for current user
      const { data: mentionRows } = await supabase
        .from('mentions')
        .select('*')
        .eq('mentioned_user_id', currentUserId)
        .eq('type', 'mention')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!mentionRows || mentionRows.length === 0) { setMentions([]); setLoading(false); return }

      // Get sender profiles
      const senderIds = Array.from(new Set(mentionRows.map((m: any) => m.sender_id)))
      const channelIds = Array.from(new Set(mentionRows.map((m: any) => m.channel_id)))

      const [profilesRes, channelsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').in('id', senderIds),
        supabase.from('channels').select('id, name, is_dm').in('id', channelIds),
      ])

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]))
      const channelMap = new Map((channelsRes.data || []).map((c: any) => [c.id, c]))

      const result: MentionNotification[] = mentionRows.map((m: any) => {
        const profile = profileMap.get(m.sender_id)
        const channel = channelMap.get(m.channel_id)
        return {
          id: m.id,
          message_id: m.message_id,
          content: m.content,
          sender_id: m.sender_id,
          sender_name: profile?.full_name || 'Unknown',
          sender_avatar: profile?.avatar_url || null,
          channel_id: m.channel_id,
          channel_name: channel?.name || 'DM',
          is_dm: channel?.is_dm || false,
          is_read: m.is_read,
          type: m.type || 'mention',
          parent_message_id: m.parent_message_id || null,
          created_at: m.created_at,
        }
      })

      setMentions(result)
      setLoading(false)

      // Don't auto-read — user clicks to mark as read
    }

    loadMentions()
  }, [currentUserId, supabase, onReadAll])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const handleClick = async (mention: MentionNotification) => {
    if (!mention.is_read) {
      await supabase.from('mentions').update({ is_read: true }).eq('id', mention.id)
    }
    handleClose()
    setTimeout(() => onNavigate(mention.channel_id, mention.is_dm, mention.type === 'thread' ? mention.parent_message_id : null), 300)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className={`fixed inset-0 z-50 flex transition-all duration-250 ${visible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="absolute inset-0" onClick={handleClose} />

      <div className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-[#1e1a2b] shadow-xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06] bg-[#252133]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/[0.06] rounded-lg flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-white">Notifications</h3>
              <p className="text-[11px] text-white/30">Your @mentions</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-dark">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_400ms]" />
              </div>
            </div>
          ) : mentions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-[14px] text-white/40 font-medium">No mentions yet</p>
              <p className="text-[12px] text-white/20 mt-1">When someone @mentions you, it'll show here</p>
            </div>
          ) : (
            <div className="py-2">
              {mentions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleClick(m)}
                  className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors text-left ${!m.is_read ? 'bg-purple-500/5' : ''}`}
                >
                  <Avatar name={m.sender_name} src={m.sender_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-white">{m.sender_name}</span>
                      <span className="text-[10px] text-white/20">{formatTime(m.created_at)}</span>
                      {!m.is_read && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                    </div>
                    <p className="text-[11px] text-white/25 mb-0.5">
                      {m.type === 'thread' ? 'replied in a thread' : 'mentioned you'}
                    </p>
                    <p className="text-[12px] text-white/40 truncate">{m.content}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-purple-300/60 font-medium">
                        {m.is_dm ? 'Direct Message' : `#${m.channel_name}`}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
