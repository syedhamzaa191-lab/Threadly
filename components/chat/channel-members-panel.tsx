'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'

interface MemberInfo {
  user_id: string
  full_name: string
  avatar_url: string | null
}

interface ChannelMembersPanelProps {
  channelId: string
  channelName: string
  workspaceId: string
  isAdmin: boolean
  onClose: () => void
  onUserClick?: (userId: string) => void
}

export function ChannelMembersPanel({ channelId, channelName, workspaceId, isAdmin, onClose, onUserClick }: ChannelMembersPanelProps) {
  const [channelMembers, setChannelMembers] = useState<MemberInfo[]>([])
  const [allMembers, setAllMembers] = useState<MemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    async function load() {
      // Parallel: fetch channel members + workspace members at same time
      const [chRes, wsRes] = await Promise.all([
        fetch(`/api/channels/members?channel_id=${channelId}`).then(r => r.json()),
        fetch(`/api/channels/workspace-members?workspace_id=${workspaceId}`).then(r => r.json()),
      ])

      setChannelMembers((chRes.members || []).map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name || 'Unknown',
        avatar_url: m.profiles?.avatar_url || null,
      })))
      setAllMembers(wsRes.members || [])
      setLoading(false)
    }
    load()
  }, [channelId, workspaceId])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const handleAdd = async (userId: string, name: string) => {
    setActionLoading(userId)
    const res = await fetch('/api/channels/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, user_ids: [userId] }),
    })
    if (res.ok) {
      const member = allMembers.find(m => m.user_id === userId)
      if (member) setChannelMembers(prev => [...prev, member])

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, content: `${name} was added to #${channelName}` }),
      })
    }
    setActionLoading(null)
  }

  const handleRemove = async (userId: string, name: string) => {
    setActionLoading(userId)
    // Instant UI remove
    setChannelMembers(prev => prev.filter(m => m.user_id !== userId))

    await fetch('/api/channels/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, user_id: userId }),
    })

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, content: `${name} was removed from #${channelName}` }),
    })
    setActionLoading(null)
  }

  const channelMemberIds = channelMembers.map(m => m.user_id)
  const notInChannel = allMembers.filter(m => !channelMemberIds.includes(m.user_id) && m.full_name.toLowerCase().includes(search.toLowerCase()))
  const inChannel = channelMembers.filter(m => m.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`w-full sm:w-[340px] fixed sm:relative inset-0 sm:inset-auto z-[50] sm:z-auto h-full flex flex-col border-l border-white/[0.06] bg-[#1e1a2b] transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/[0.06] bg-[#252133]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[14px] text-white">#{channelName}</h3>
            <p className="text-[11px] text-white/30">{channelMembers.length} members</p>
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      {isAdmin && (
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full px-3 py-2 bg-white/[0.06] rounded-lg text-[12px] text-white/70 placeholder:text-white/20 border border-white/[0.06] focus:border-violet-500/30 outline-none transition-colors"
          />
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 overflow-y-auto scrollbar-dark py-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_400ms]" />
            </div>
          </div>
        ) : (
          <>
            {/* In channel */}
            {inChannel.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-5 mb-2">In channel ({inChannel.length})</p>
                {inChannel.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <button onClick={() => onUserClick?.(m.user_id)} className="shrink-0 cursor-pointer">
                      <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                    </button>
                    <button onClick={() => onUserClick?.(m.user_id)} className="flex-1 text-[13px] text-white/70 font-medium truncate text-left hover:text-violet-300 transition-colors cursor-pointer">{m.full_name}</button>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemove(m.user_id, m.full_name)}
                        disabled={actionLoading === m.user_id}
                        className="px-2.5 py-1 text-[10px] font-bold text-red-400 bg-white/[0.03] hover:bg-red-500/10 rounded-lg border border-white/[0.06] transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}

            {inChannel.length === 0 && (
              <p className="text-center text-white/20 text-[12px] py-6">No members in this channel</p>
            )}

            {/* Not in channel — admin only */}
            {isAdmin && notInChannel.length > 0 && (
              <>
                <div className="h-px bg-white/[0.06] mx-5 my-3" />
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-5 mb-2">Add to channel</p>
                {notInChannel.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <button onClick={() => onUserClick?.(m.user_id)} className="shrink-0 cursor-pointer">
                      <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                    </button>
                    <button onClick={() => onUserClick?.(m.user_id)} className="flex-1 text-[13px] text-white/50 font-medium truncate text-left hover:text-violet-300 transition-colors cursor-pointer">{m.full_name}</button>
                    <button
                      onClick={() => handleAdd(m.user_id, m.full_name)}
                      disabled={actionLoading === m.user_id}
                      className="px-3 py-1 text-[10px] font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === m.user_id ? '...' : 'Add'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
