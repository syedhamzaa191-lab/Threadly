'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface WorkspaceMembership {
  workspace_id: string
  role: string
  workspaces: { id: string; name: string; slug: string }
}

export default function WorkspaceListPage() {
  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces:workspace_id(id, name, slug)')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        const ws = (data[0] as any).workspaces
        router.push(`/workspace/${ws.id}/channel`)
        return
      }

      // Check if any workspace exists — if so, this user should join, not create
      const { count } = await supabase
        .from('workspaces')
        .select('id', { count: 'exact', head: true })
      setCanCreate(!count || count === 0)

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-extrabold text-xl">T</span>
          </div>
          <p className="text-sm font-bold text-gray-900">Loading...</p>
        </div>
      </div>
    )
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">Get Started</h2>
          <p className="text-sm text-gray-900 mb-6">Create or join a workspace to begin</p>

          <div className="space-y-3">
            {canCreate && (
              <Link
                href="/workspace/new"
                className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm text-center hover:bg-gray-800 transition-colors"
              >
                Create a Workspace
              </Link>
            )}
            <Link
              href="/workspace/new?join=true"
              className={`block w-full py-3 rounded-xl font-bold text-sm text-center transition-colors ${
                canCreate
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Join with Invite Code
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
