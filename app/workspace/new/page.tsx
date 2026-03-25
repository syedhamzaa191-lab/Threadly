'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function NewWorkspaceContent() {
  const searchParams = useSearchParams()
  const isJoin = searchParams.get('join') === 'true'
  const [tab, setTab] = useState<'create' | 'join'>(isJoin ? 'join' : 'create')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name, slug, owner_id: user.id })
      .select()
      .single()

    if (wsError) {
      setError(wsError.message)
      setLoading(false)
      return
    }

    // Add owner as member
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    })

    // Create default #general channel
    await supabase.from('channels').insert({
      workspace_id: workspace.id,
      name: 'general',
      description: 'General discussion',
      created_by: user.id,
    })

    router.push(`/workspace/${workspace.id}/channel`)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: invite, error: invError } = await supabase
      .from('invites')
      .select('*, workspaces(*)')
      .eq('code', inviteCode.trim())
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invError || !invite) {
      setError('Invalid or expired invite code')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      await supabase.from('workspace_members').insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: 'member',
      })
    }

    router.push(`/workspace/${invite.workspace_id}/channel`)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
            <span className="text-white font-extrabold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Threadly</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-card">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === 'create' ? 'bg-gray-900 text-white' : 'text-gray-900'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === 'join' ? 'bg-gray-900 text-white' : 'text-gray-900'
              }`}
            >
              Join
            </button>
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="e.g. My Team"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Paste your invite code"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Workspace'}
              </button>
            </form>
          )}

          <Link href="/workspace" className="block text-sm font-bold text-gray-900 text-center mt-4 underline">
            Back
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function NewWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">T</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Threadly</h1>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-card animate-pulse">
            <div className="h-10 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    }>
      <NewWorkspaceContent />
    </Suspense>
  )
}
