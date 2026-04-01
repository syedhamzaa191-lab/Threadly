'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface ThreadNotification {
  id: string
  message_id: string
  content: string
  sender_name: string
  sender_avatar: string | null
  channel_id: string
  channel_name: string
  is_dm: boolean
  is_read: boolean
  parent_message_id: string
  created_at: string
}

interface ThreadsPanelProps {
  currentUserId: string
  onClose: () => void
  onNavigate: (channelId: string, isDm: boolean, parentMessageId: string) => void
}

export function ThreadsPanel({ currentUserId, onClose, onNavigate }: ThreadsPanelProps) {
  const [threads, setThreads] = useState<ThreadNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    async function loadThreads() {
      const { data: rows } = await supabase
        .from('mentions')
        .select('*')
        .eq('mentioned_user_id', currentUserId)
        .eq('type', 'thread')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!rows || rows.length === 0) { setThreads([]); setLoading(false); return }

      const senderIds = Array.from(new Set(rows.map((r: any) => r.sender_id)))
      const channelIds = Array.from(new Set(rows.map((r: any) => r.channel_id)))

      const [profilesRes, channelsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').in('id', senderIds),
        supabase.from('channels').select('id, name, is_dm').in('id', channelIds),
      ])

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]))
      const channelMap = new Map((channelsRes.data || []).map((c: any) => [c.id, c]))

      const result: ThreadNotification[] = rows.map((r: any) => {
        const profile = profileMap.get(r.sender_id)
        const channel = channelMap.get(r.channel_id)
        return {
          id: r.id,
          message_id: r.message_id,
          content: r.content,
          sender_name: profile?.full_name || 'Unknown',
          sender_avatar: profile?.avatar_url || null,
          channel_id: r.channel_id,
          channel_name: channel?.name || 'DM',
          is_dm: channel?.is_dm || false,
          is_read: r.is_read,
          parent_message_id: r.parent_message_id,
          created_at: r.created_at,
        }
      })

      setThreads(result)
      setLoading(false)
    }

    loadThreads()
  }, [currentUserId, supabase])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const handleClick = async (t: ThreadNotification) => {
    if (!t.is_read) {
      await supabase.from('mentions').update({ is_read: true }).eq('id', t.id)
    }
    handleClose()
    setTimeout(() => onNavigate(t.channel_id, t.is_dm, t.parent_message_id), 300)
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
    return `${Math.floor(hours / 24)}d ago`
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-white">Threads</h3>
              <p className="text-[11px] text-white/30">Replies to your messages</p>
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
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <p className="text-[14px] text-white/40 font-medium">No thread replies yet</p>
              <p className="text-[12px] text-white/20 mt-1">When someone replies to your message, it'll show here</p>
            </div>
          ) : (
            <div className="py-2">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleClick(t)}
                  className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors text-left ${!t.is_read ? 'bg-purple-500/5' : ''}`}
                >
                  <Avatar name={t.sender_name} src={t.sender_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-white">{t.sender_name}</span>
                      <span className="text-[10px] text-white/20">{formatTime(t.created_at)}</span>
                      {!t.is_read && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                    </div>
                    <p className="text-[11px] text-white/25 mb-0.5">replied to your message</p>
                    <p className="text-[12px] text-white/40 truncate">{t.content}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-purple-300/60 font-medium">
                        {t.is_dm ? 'Direct Message' : `#${t.channel_name}`}
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
