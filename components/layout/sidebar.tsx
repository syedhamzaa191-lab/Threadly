'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { SearchInput } from '@/components/ui/search-input'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'

interface Channel {
  id: string
  name: string
  unread_count?: number
}

interface SidebarProps {
  workspaceName: string
  channels: Channel[]
  activeChannelId?: string
  userName: string
  userAvatar?: string | null
  userRole?: string
  onChannelSelect: (channelId: string) => void
  onSettingsClick?: () => void
  onSignOut?: () => void
  onCreateChannel?: (name: string) => void
  onInviteClick?: () => void
  onProfileClick?: () => void
  memberCount?: number
}

export function Sidebar({
  workspaceName,
  channels,
  activeChannelId,
  userName,
  userAvatar,
  userRole,
  onChannelSelect,
  onSignOut,
  onCreateChannel,
  onInviteClick,
  onProfileClick,
  memberCount,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

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
    <aside className="w-[300px] h-full bg-white flex flex-col border-r border-gray-100">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-lg">T</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-[17px] text-gray-900 tracking-tight">{workspaceName}</h1>
            <p className="text-xs text-gray-900 font-medium">
              {memberCount ? `${memberCount} members` : 'Team workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <SearchInput
          placeholder="Search channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Nav Items */}
      <nav className="px-3 pb-3 flex flex-col gap-0.5">
        <NavItem icon={<HomeIcon />} label="Home" />
        <NavItem icon={<MessageIcon />} label="Messages" />
        <NavItem icon={<PeopleIcon />} label={`Members${memberCount ? ` (${memberCount})` : ''}`} />
        {onInviteClick && (
          <button
            onClick={onInviteClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-150"
          >
            <InviteIcon />
            <span>Invite Members</span>
          </button>
        )}
      </nav>

      <div className="h-px bg-gray-100 mx-5" />

      {/* Channels */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <div className="flex items-center justify-between px-3 mb-3">
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">
            Channels
          </span>
          {onCreateChannel && (
            <IconButton size="sm" onClick={() => setShowNewChannel(!showNewChannel)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </IconButton>
          )}
        </div>

        {showNewChannel && (
          <div className="px-3 mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                placeholder="channel-name"
                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-[13px] text-gray-900 border border-gray-200 focus:outline-none focus:border-gray-400"
                autoFocus
              />
              <button
                onClick={handleCreateChannel}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg text-[12px] font-bold"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {filteredChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 ${
                activeChannelId === channel.id
                  ? 'bg-gray-900 text-white font-semibold shadow-sm'
                  : 'text-gray-900 hover:bg-gray-50 font-medium'
              }`}
            >
              <span className={`text-base ${activeChannelId === channel.id ? 'text-white/60' : 'text-gray-900'}`}>#</span>
              <span className="flex-1 text-left truncate">{channel.name}</span>
              {channel.unread_count ? (
                <Badge count={channel.unread_count} variant={activeChannelId === channel.id ? 'muted' : 'primary'} />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-colors text-left"
        >
          <Avatar name={userName} src={userAvatar} size="md" online />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
            <p className="text-[11px] text-gray-900 font-medium truncate">{userRole || 'Member'}</p>
          </div>
          <svg className="w-4 h-4 text-gray-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>
  )
}

function NavItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-900 hover:bg-gray-50 transition-all duration-150">
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

function MessageIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

function InviteIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}
