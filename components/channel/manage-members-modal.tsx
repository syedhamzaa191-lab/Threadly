'use client'

import { useState } from 'react'
import { IconButton } from '@/components/ui/icon-button'
import { Avatar } from '@/components/ui/avatar'

interface Member {
  id: string
  name: string
  email?: string
  avatar?: string | null
}

interface Channel {
  id: string
  name: string
}

interface ChannelMembership {
  [channelId: string]: string[] // channelId -> userId[]
}

interface ManageMembersModalProps {
  members: Member[]
  channels: Channel[]
  channelMembers: ChannelMembership
  onClose: () => void
  onAddToChannel: (userId: string, channelId: string) => void
  onRemoveFromChannel: (userId: string, channelId: string) => void
}

export function ManageMembersModal({
  members,
  channels,
  channelMembers,
  onClose,
  onAddToChannel,
  onRemoveFromChannel,
}: ManageMembersModalProps) {
  const [search, setSearch] = useState('')
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()))
  )

  // Get channels a user is in
  const getUserChannels = (userId: string) => {
    return channels.filter((ch) => (channelMembers[ch.id] || []).includes(userId))
  }

  // Get channels a user is NOT in
  const getAvailableChannels = (userId: string) => {
    return channels.filter((ch) => !(channelMembers[ch.id] || []).includes(userId))
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-[520px] shadow-card-hover overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Manage Employees</h2>
            <p className="text-[13px] text-gray-900 mt-0.5">Add or remove employees from channels</p>
          </div>
          <IconButton size="sm" onClick={onClose}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {/* Search */}
        <div className="px-6 pb-4 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Employees List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-6">
          <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3">
            All Employees ({filtered.length})
          </p>

          <div className="space-y-2">
            {filtered.map((m) => {
              const userChannels = getUserChannels(m.id)
              const availableChannels = getAvailableChannels(m.id)
              const isExpanded = expandedUserId === m.id
              const isAssigning = assigningUserId === m.id

              return (
                <div key={m.id} className="bg-gray-50 rounded-2xl overflow-hidden">
                  {/* Employee Row */}
                  <div className="flex items-center gap-3 p-3.5">
                    <Avatar name={m.name} src={m.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{m.name}</p>
                      {m.email && <p className="text-[11px] text-gray-900 truncate">{m.email}</p>}
                    </div>

                    {/* Show assigned channels count */}
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : m.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors shrink-0"
                    >
                      {userChannels.length} channel{userChannels.length !== 1 ? 's' : ''}
                    </button>

                    {/* Add to channel button */}
                    <button
                      onClick={() => setAssigningUserId(isAssigning ? null : m.id)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors shrink-0"
                    >
                      {isAssigning ? 'Cancel' : 'Add'}
                    </button>
                  </div>

                  {/* Channel Picker Dropdown - shows when Add is clicked */}
                  {isAssigning && (
                    <div className="px-3.5 pb-3.5">
                      <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2 px-1">
                        Select Channel
                      </p>
                      {availableChannels.length === 0 ? (
                        <p className="text-[12px] text-gray-900 px-1 pb-1">Already in all channels</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {availableChannels.map((ch) => (
                            <button
                              key={ch.id}
                              onClick={() => {
                                onAddToChannel(m.id, ch.id)
                                setAssigningUserId(null)
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                            >
                              <span className="text-[11px] font-normal">#</span>
                              {ch.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded: show current channels with remove option */}
                  {isExpanded && !isAssigning && (
                    <div className="px-3.5 pb-3.5">
                      <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2 px-1">
                        Assigned Channels
                      </p>
                      {userChannels.length === 0 ? (
                        <p className="text-[12px] text-gray-900 px-1 pb-1">Not in any channel</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {userChannels.map((ch) => (
                            <div
                              key={ch.id}
                              className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-white border border-gray-200 rounded-xl"
                            >
                              <span className="text-[12px] font-bold text-gray-900">
                                <span className="font-normal text-[11px]">#</span> {ch.name}
                              </span>
                              <button
                                onClick={() => onRemoveFromChannel(m.id, ch.id)}
                                className="w-5 h-5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-gray-900 text-center py-8">No employees found</p>
          )}
        </div>
      </div>
    </div>
  )
}
