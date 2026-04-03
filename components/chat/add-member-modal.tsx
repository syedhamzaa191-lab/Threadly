'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
}

interface AddMemberModalProps {
  channelId: string
  channelName: string
  workspaceId: string
  onClose: () => void
}

export function AddMemberModal({ channelId, channelName, workspaceId, onClose }: AddMemberModalProps) {
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [channelMemberIds, setChannelMemberIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    async function load() {
      // Get workspace members via profiles (RLS allows viewing all profiles)
      const [profilesRes, memsRes, chRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').eq('is_deleted', false),
        supabase.from('workspace_members').select('user_id').eq('workspace_id', workspaceId),
        fetch(`/api/channels/members?channel_id=${channelId}`).then(r => r.json()),
      ])

      const memberIds = (memsRes.data || []).map((m: any) => m.user_id)
      const profiles = (profilesRes.data || []).filter((p: any) => memberIds.includes(p.id))

      const ws = profiles.map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        avatar_url: p.avatar_url || null,
      }))

      const chIds = (chRes.members || []).map((m: any) => m.user_id)

      setAllMembers(ws)
      setChannelMemberIds(chIds)
      setLoading(false)
    }
    load()
  }, [channelId, workspaceId, supabase])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  const handleAdd = async (userId: string) => {
    setAdding(userId)
    const res = await fetch('/api/channels/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, user_ids: [userId] }),
    })

    if (res.ok) {
      setAdded((prev) => [...prev, userId])
      setChannelMemberIds((prev) => [...prev, userId])

      // Send notification in channel
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          content: `${allMembers.find(m => m.id === userId)?.full_name || 'Someone'} was added to #${channelName}`,
        }),
      })
    }
    setAdding(null)
  }

  const handleRemove = async (userId: string) => {
    setAdding(userId)
    const res = await fetch('/api/channels/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, user_id: userId }),
    })

    if (res.ok) {
      setChannelMemberIds((prev) => prev.filter((id) => id !== userId))
      setAdded((prev) => prev.filter((id) => id !== userId))

      // Send removal notification in channel
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          content: `${allMembers.find(m => m.id === userId)?.full_name || 'Someone'} was removed from #${channelName}`,
        }),
      })
    }
    setAdding(null)
  }

  const filtered = allMembers.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const notInChannel = filtered.filter((m) => !channelMemberIds.includes(m.id))
  const inChannel = filtered.filter((m) => channelMemberIds.includes(m.id))

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="absolute inset-0" onClick={handleClose} />
      <div className={`relative bg-[#2a2540] rounded-2xl w-full max-w-[420px] shadow-2xl border border-white/[0.1] overflow-hidden transition-all duration-200 max-h-[80vh] flex flex-col ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-white">Manage #{channelName}</h3>
            <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full px-3.5 py-2.5 bg-white/[0.06] rounded-xl text-[13px] text-white/70 placeholder:text-white/20 border border-white/[0.06] focus:border-violet-500/30 outline-none transition-colors"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-dark px-3 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_400ms]" />
              </div>
            </div>
          ) : (
            <>
              {/* Not in channel */}
              {notInChannel.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-2 mb-2">Add to channel</p>
                  {notInChannel.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                      <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                      <span className="flex-1 text-[13px] text-white/70 font-medium truncate">{m.full_name}</span>
                      {added.includes(m.id) ? (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdd(m.id)}
                          disabled={adding === m.id}
                          className="px-3.5 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-bold hover:bg-violet-500 transition-colors disabled:opacity-50"
                        >
                          {adding === m.id ? '...' : 'Add'}
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* In channel */}
              {inChannel.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-2 mb-2 mt-4">In channel ({inChannel.length})</p>
                  {inChannel.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                      <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                      <span className="flex-1 text-[13px] text-white/70 font-medium truncate">{m.full_name}</span>
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={adding === m.id}
                        className="px-3 py-1.5 bg-white/[0.04] text-red-400 rounded-lg text-[11px] font-bold hover:bg-red-500/10 border border-white/[0.06] transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </>
              )}

              {filtered.length === 0 && (
                <p className="text-center text-white/25 text-[13px] py-6">No members found</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
