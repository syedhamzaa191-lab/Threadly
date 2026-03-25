'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'

type Workspace = {
  id: string
  name: string
  slug: string
}

type Channel = {
  id: string
  name: string
  is_private: boolean
}

type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
}

export default function Sidebar({
  workspace,
  channels,
  profile,
  workspaces,
}: {
  workspace: Workspace
  channels: Channel[]
  profile: Profile
  workspaces: Workspace[]
}) {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [showWorkspaces, setShowWorkspaces] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!channelName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: channel } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspace.id,
        name: channelName.toLowerCase().replace(/\s+/g, '-'),
        created_by: user.id,
      })
      .select()
      .single()

    if (channel) {
      setChannelName('')
      setShowNewChannel(false)
      router.push(`/workspace/${workspace.id}/channel/${channel.id}`)
      router.refresh()
    }
  }

  async function generateInvite() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('invites')
      .insert({ workspace_id: workspace.id, created_by: user.id })
      .select()
      .single()

    if (data) {
      setInviteCode(`${window.location.origin}/invite/${data.code}`)
      setShowInvite(true)
    }
  }

  return (
    <div className="w-64 bg-sidebar text-white flex flex-col h-screen">
      {/* Workspace header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => setShowWorkspaces(!showWorkspaces)}
          className="flex items-center gap-2 w-full text-left hover:bg-sidebar-hover rounded p-1"
        >
          <span className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-sm font-bold">
            {workspace.name[0].toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{workspace.name}</p>
          </div>
          <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showWorkspaces && (
          <div className="mt-2 bg-gray-800 rounded-md overflow-hidden">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.id}`}
                className={cn(
                  'block px-3 py-2 text-sm hover:bg-gray-700',
                  ws.id === workspace.id && 'bg-gray-700'
                )}
                onClick={() => setShowWorkspaces(false)}
              >
                {ws.name}
              </Link>
            ))}
            <Link
              href="/workspace/new"
              className="block px-3 py-2 text-sm text-brand-300 hover:bg-gray-700 border-t border-gray-700"
            >
              + New Workspace
            </Link>
          </div>
        )}
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-400">Channels</span>
          <button
            onClick={() => setShowNewChannel(!showNewChannel)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            +
          </button>
        </div>

        {showNewChannel && (
          <form onSubmit={createChannel} className="px-4 mb-2">
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="channel-name"
              autoFocus
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-brand-500"
              onBlur={() => {
                if (!channelName) setShowNewChannel(false)
              }}
            />
          </form>
        )}

        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/workspace/${workspace.id}/channel/${channel.id}`}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 text-sm hover:bg-sidebar-hover mx-2 rounded',
              params.channelId === channel.id && 'bg-sidebar-active text-white'
            )}
          >
            <span className="text-gray-400">#</span>
            <span className="truncate">{channel.name}</span>
          </Link>
        ))}
      </div>

      {/* Invite & User */}
      <div className="border-t border-white/10">
        <button
          onClick={generateInvite}
          className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-sidebar-hover"
        >
          + Invite people
        </button>

        {showInvite && inviteCode && (
          <div className="px-4 pb-2">
            <input
              readOnly
              value={inviteCode}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs"
              onFocus={(e) => e.target.select()}
            />
            <p className="text-xs text-gray-500 mt-1">Share this link to invite members</p>
          </div>
        )}

        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold">
            {getInitials(profile.full_name || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || 'User'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
