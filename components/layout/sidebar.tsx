'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'


interface Channel {
  id: string
  name: string
  unread_count?: number
}

interface DmItem {
  id: string
  name: string
  avatar: string | null
  lastMessage?: string
  unread_count?: number
}

interface MemberItem {
  id: string
  full_name: string
  avatar_url: string | null
}

interface SidebarProps {
  workspaceName: string
  channels: Channel[]
  activeChannelId?: string
  activeDmId?: string
  userName: string
  userAvatar?: string | null
  userRole?: string
  onChannelSelect: (channelId: string) => void
  onSettingsClick?: () => void
  onSignOut?: () => void
  onCreateChannel?: (name: string) => void
  onApprovalsClick?: () => void
  pendingApprovalCount?: number
  onProfileClick?: () => void
  onMembersClick?: () => void
  onHomeClick?: () => void
  onDeleteChannel?: (channelId: string) => void
  memberCount?: number
  dmConversations?: DmItem[]
  onDmSelect?: (channelId: string) => void
  onStartDm?: (userId: string) => void
  members?: MemberItem[]
  currentUserId?: string
}

export function Sidebar({
  workspaceName,
  channels,
  activeChannelId,
  activeDmId,
  userName,
  userAvatar,
  userRole,
  onChannelSelect,
  onSignOut,
  onCreateChannel,
  onApprovalsClick,
  pendingApprovalCount,
  onProfileClick,
  onMembersClick,
  onHomeClick,
  onDeleteChannel,
  memberCount,
  dmConversations,
  onDmSelect,
  onStartDm,
  members,
  currentUserId,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [showNewDm, setShowNewDm] = useState(false)
  const [dmSearch, setDmSearch] = useState('')

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateChannel = () => {
    if (newChannelName.trim() && onCreateChannel) {
      onCreateChannel(newChannelName.trim())
      setNewChannelName('')
      setShowNewChannel(false)
    }
  }

  return (
    <aside className="w-[280px] h-full bg-gradient-sidebar flex flex-col relative overflow-hidden shrink-0">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-glow">
            <span className="text-white font-extrabold text-base">T</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-[15px] text-white tracking-tight">{workspaceName}</h1>
            <p className="text-[11px] text-white/40 font-medium">
              {memberCount ? `${memberCount} members` : 'Team workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative px-4 pb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/[0.06] rounded-xl text-[13px] text-white/80 placeholder:text-white/25 border border-white/[0.08] focus:border-white/[0.15] focus:bg-white/[0.08] transition-all duration-200"
          />
        </div>
      </div>

      {/* Nav Items */}
      <nav className="relative px-3 pb-2 flex flex-col gap-0.5">
        <NavItem icon={<HomeIcon />} label="Home" onClick={onHomeClick} />
        <NavItem icon={<PeopleIcon />} label={`Members${memberCount ? ` (${memberCount})` : ''}`} onClick={onMembersClick} />
        {onApprovalsClick && (
          <button
            onClick={onApprovalsClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-accent hover:opacity-90 transition-all duration-200 shadow-glow mt-1 relative"
          >
            <ApprovalIcon />
            <span>Approvals</span>
            {(pendingApprovalCount ?? 0) > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingApprovalCount}
              </span>
            )}
          </button>
        )}
      </nav>

      <div className="h-px bg-white/[0.08] mx-4 my-1" />

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto scrollbar-dark px-3 py-3">
        {/* Channels */}
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">
            Channels
          </span>
          {onCreateChannel && (
            <button
              onClick={() => setShowNewChannel(!showNewChannel)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {showNewChannel && (
          <div className="px-2 mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                placeholder="channel-name"
                className="flex-1 px-3 py-2 bg-white/[0.08] rounded-lg text-[13px] text-white border border-white/[0.1] focus:border-violet-400/50 placeholder:text-white/25 transition-colors"
                autoFocus
              />
              <button
                onClick={handleCreateChannel}
                className="px-3 py-2 bg-gradient-accent text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {filteredChannels.map((channel) => (
            <div key={channel.id} className="group/ch relative flex items-center">
              <button
                onClick={() => onChannelSelect(channel.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-150 ${
                  activeChannelId === channel.id
                    ? 'bg-white/[0.12] text-white font-semibold shadow-sm backdrop-blur-sm'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80 font-medium'
                }`}
              >
                <span className={`text-sm ${activeChannelId === channel.id ? 'text-violet-300' : 'text-white/30'}`}>#</span>
                <span className="flex-1 text-left truncate">{channel.name}</span>
                {channel.unread_count ? (
                  <Badge count={channel.unread_count} variant={activeChannelId === channel.id ? 'muted' : 'primary'} />
                ) : null}
              </button>
              {onDeleteChannel && channel.name !== 'general' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete #${channel.name}? All messages will be lost.`)) {
                      onDeleteChannel(channel.id)
                    }
                  }}
                  className="absolute right-2 hidden group-hover/ch:flex w-6 h-6 items-center justify-center rounded-md bg-white/[0.06] hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all duration-150"
                  title={`Delete #${channel.name}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Direct Messages */}
        {members && members.length > 0 && (
          <>
            <div className="flex items-center justify-between px-3 mb-2 mt-5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">
                Direct Messages
              </span>
              {onStartDm && (
                <button
                  onClick={() => setShowNewDm(!showNewDm)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-150"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {showNewDm && members && onStartDm && (
              <div className="px-2 mb-3">
                <input
                  type="text"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full px-3 py-2 bg-white/[0.08] rounded-lg text-[13px] text-white border border-white/[0.1] focus:border-violet-400/50 placeholder:text-white/25 mb-2 transition-colors"
                  autoFocus
                />
                <div className="max-h-[160px] overflow-y-auto scrollbar-dark space-y-0.5">
                  {members
                    .filter((m) => m.id !== currentUserId)
                    .filter((m) => m.full_name.toLowerCase().includes(dmSearch.toLowerCase()))
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onStartDm(m.id)
                          setShowNewDm(false)
                          setDmSearch('')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                      >
                        <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                        <span className="text-[13px] font-medium text-white/70 truncate">{m.full_name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {dmConversations?.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => onDmSelect?.(dm.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-150 ${
                    activeDmId === dm.id
                      ? 'bg-white/[0.12] text-white font-semibold shadow-sm backdrop-blur-sm'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80 font-medium'
                  }`}
                >
                  <Avatar name={dm.name} src={dm.avatar} size="sm" />
                  <div className="flex-1 text-left min-w-0">
                    <span className="truncate block">{dm.name}</span>
                    {dm.lastMessage && (
                      <span className={`text-[11px] truncate block ${activeDmId === dm.id ? 'text-white/40' : 'text-white/25'}`}>
                        {dm.lastMessage.slice(0, 30)}{dm.lastMessage.length > 30 ? '...' : ''}
                      </span>
                    )}
                  </div>
                  {dm.unread_count ? (
                    <Badge count={dm.unread_count} variant={activeDmId === dm.id ? 'muted' : 'primary'} />
                  ) : null}
                </button>
              ))}
              {onStartDm && members
                .filter((m) => m.id !== currentUserId)
                .filter((m) => !dmConversations?.some((dm) => dm.name === m.full_name))
                .slice(0, Math.max(0, 8 - (dmConversations?.length || 0)))
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onStartDm(m.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-150 text-white/60 hover:bg-white/[0.06] hover:text-white/80 font-medium"
                  >
                    <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <span className="truncate block">{m.full_name}</span>
                    </div>
                  </button>
                ))}
            </div>
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="relative p-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={onProfileClick}
            className="flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left"
          >
            <Avatar name={userName} src={userAvatar} size="md" online />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-white/35 font-medium truncate">{userRole || 'Member'}</p>
            </div>
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Logout"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 shrink-0"
            >
              <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-150">
      {icon}
      <span>{label}</span>
    </button>
  )
}

function HomeIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ApprovalIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
