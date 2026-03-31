'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface ForwardModalProps {
  messageContent: string
  senderName: string
  workspaceId: string
  currentUserId: string
  onClose: () => void
}

interface DmTarget {
  channelId: string
  userId: string
  name: string
  avatar: string | null
}

export function ForwardModal({ messageContent, senderName, workspaceId, currentUserId, onClose }: ForwardModalProps) {
  const [targets, setTargets] = useState<DmTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    async function loadTargets() {
      // Get all DM channels for this user
      const { data: dmChannels } = await supabase
        .from('channels')
        .select('id, dm_user_ids')
        .eq('workspace_id', workspaceId)
        .eq('is_dm', true)
        .contains('dm_user_ids', [currentUserId])

      if (!dmChannels || dmChannels.length === 0) { setLoading(false); return }

      const otherIds = dmChannels.map((ch: any) => {
        const ids = ch.dm_user_ids as string[]
        return ids.find((id: string) => id !== currentUserId) || ids[0]
      })

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, is_deleted')
        .in('id', otherIds)

      const list: DmTarget[] = dmChannels
        .map((ch: any) => {
          const otherId = (ch.dm_user_ids as string[]).find((id: string) => id !== currentUserId) || (ch.dm_user_ids as string[])[0]
          const profile = profiles?.find((p: any) => p.id === otherId)
          if (!profile || profile.is_deleted) return null
          return {
            channelId: ch.id,
            userId: otherId,
            name: profile.full_name,
            avatar: profile.avatar_url,
          }
        })
        .filter((t): t is DmTarget => t !== null)

      setTargets(list)
      setLoading(false)
    }
    loadTargets()
  }, [workspaceId, currentUserId])

  const handleForward = async (target: DmTarget) => {
    setSending(target.userId)
    const forwardedContent = `↪️ Forwarded from ${senderName}:\n${messageContent}`
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: target.channelId, content: forwardedContent }),
    })
    setSending(null)
    setSent((prev) => [...prev, target.userId])
  }

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  const filtered = targets.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="absolute inset-0" onClick={handleClose} />
      <div className={`relative bg-[#2a2540] rounded-2xl w-full max-w-[380px] shadow-2xl border border-white/[0.1] overflow-hidden transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-white">Forward Message</h3>
            <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Message preview */}
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
            <p className="text-[11px] text-white/30 font-semibold mb-1">{senderName}</p>
            <p className="text-[13px] text-white/60 truncate">{messageContent}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full px-3.5 py-2.5 bg-white/[0.06] rounded-xl text-[13px] text-white/70 placeholder:text-white/20 border border-white/[0.06] focus:border-violet-500/30 outline-none transition-colors"
            autoFocus
          />
        </div>

        {/* Targets */}
        <div className="px-3 pb-4 max-h-[250px] overflow-y-auto scrollbar-dark">
          {loading ? (
            <div className="text-center py-6">
              <div className="flex gap-1.5 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_400ms]" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-white/25 text-[13px] py-6">No conversations found</p>
          ) : (
            filtered.map((target) => (
              <div key={target.userId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                <Avatar name={target.name} src={target.avatar} size="sm" />
                <span className="flex-1 text-[13px] text-white/70 font-medium truncate">{target.name}</span>
                {sent.includes(target.userId) ? (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent
                  </span>
                ) : (
                  <button
                    onClick={() => handleForward(target)}
                    disabled={sending === target.userId}
                    className="px-3.5 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-bold hover:bg-violet-500 transition-colors disabled:opacity-50"
                  >
                    {sending === target.userId ? '...' : 'Send'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
