'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

export default function NewWorkspacePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const slug = slugify(name) + '-' + Date.now().toString(36)

    // Create workspace
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

    // Add creator as owner member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Create #general channel
    const { data: channel } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspace.id,
        name: 'general',
        description: 'General discussion',
        created_by: user.id,
      })
      .select()
      .single()

    if (channel) {
      router.push(`/workspace/${workspace.id}/channel/${channel.id}`)
    } else {
      router.push(`/workspace/${workspace.id}`)
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">Threadly</h1>
          <p className="text-gray-500 mt-1">Create your first workspace</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-6">New Workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Workspace name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="My Team"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-2 px-4 bg-brand-600 text-white rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
