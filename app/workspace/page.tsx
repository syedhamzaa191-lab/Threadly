'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface WorkspaceInfo {
  workspace_id: string
  role: string
  workspace: {
    id: string
    name: string
    slug: string
  }
  memberCount: number
  memberAvatars: { full_name: string; avatar_url: string | null }[]
}

export default function WorkspaceListPage() {
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([])
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const isOwner = workspaces.some((ws) => ws.role === 'owner')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setUserName(profile?.full_name || user.email?.split('@')[0] || 'there')

      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces:workspace_id(id, name, slug)')
        .eq('user_id', user.id)

      if (!memberships || memberships.length === 0) {
        setLoading(false)
        return
      }

      const wsInfos: WorkspaceInfo[] = await Promise.all(
        memberships.map(async (m: any) => {
          const ws = m.workspaces

          const [countResult, avatarsResult] = await Promise.all([
            supabase
              .from('workspace_members')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', ws.id),
            supabase
              .from('workspace_members')
              .select('profiles:user_id(full_name, avatar_url)')
              .eq('workspace_id', ws.id)
              .limit(5),
          ])

          return {
            workspace_id: ws.id,
            role: m.role,
            workspace: ws,
            memberCount: countResult.count || 0,
            memberAvatars: (avatarsResult.data || []).map((a: any) => ({
              full_name: a.profiles?.full_name || 'User',
              avatar_url: a.profiles?.avatar_url || null,
            })),
          }
        })
      )

      setWorkspaces(wsInfos)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft shadow-glow-lg">
            <span className="text-white font-extrabold text-2xl">T</span>
          </div>
          <p className="text-sm font-semibold text-white/40">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0612] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[80px]" />
      </div>

      {/* Top nav */}
      <nav className="relative flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
            <span className="text-white font-extrabold text-base">T</span>
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">Threadly</span>
        </div>
        <Link
          href="/"
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          Home
        </Link>
      </nav>

      {/* Welcome Section */}
      <div className="relative max-w-4xl mx-auto px-6 pt-14 pb-10 text-center animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
          Welcome back, <span className="text-gradient">{userName.split(' ')[0]}</span>
        </h1>
        <p className="text-white/40 text-lg">Choose a workspace to get started.</p>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 md:px-6 pb-16 flex gap-6 flex-col lg:flex-row animate-slide-up">
        {/* Left - Workspaces */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm font-bold text-white/70">My workspaces</span>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-premium">
            <div className="border-b border-gray-100 px-6 py-3">
              <span className="text-sm font-bold text-gray-900 border-b-2 border-violet-500 pb-3">Workspaces</span>
            </div>

            {workspaces.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">Ready to launch</p>
                <div className="space-y-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.workspace_id}
                      onClick={() => router.push(`/workspace/${ws.workspace_id}/channel`)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-violet-50/50 transition-all duration-200 group"
                    >
                      <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-glow group-hover:shadow-glow-lg transition-shadow">
                        <span className="text-white font-extrabold text-lg">
                          {ws.workspace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[15px] font-bold text-gray-900 truncate">{ws.workspace.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex -space-x-1.5">
                            {ws.memberAvatars.slice(0, 4).map((m, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'][i % 5] }}
                              >
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  m.full_name.charAt(0).toUpperCase()
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{ws.memberCount} members</span>
                          {ws.role === 'owner' && (
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Owner</span>
                          )}
                          {ws.role === 'admin' && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <span className="text-sm font-bold text-violet-600">Launch</span>
                        <svg className="w-4 h-4 text-violet-600 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create workspace - owner only */}
            {isOwner && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Link
                  href="/workspace/new"
                  className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  + Create a new workspace
                </Link>
              </div>
            )}

            {workspaces.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500 mb-2">You are not part of any workspace yet.</p>
                <p className="text-xs text-gray-400">Ask your admin for an invite link to join.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        {workspaces.length > 0 && (
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">
                  {workspaces[0].workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-bold text-white/80">{workspaces[0].workspace.name}</span>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-premium">
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">Jump right in</h3>
              <p className="text-xs text-gray-400 mb-4">Continue where you left off.</p>
              <button
                onClick={() => router.push(`/workspace/${workspaces[0].workspace_id}/channel`)}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-glow"
              >
                Open workspace
              </button>
            </div>

            {workspaces[0].role !== 'member' && (
              <div className="bg-white rounded-2xl p-5 shadow-premium">
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">Invite teammates</h3>
                <p className="text-xs text-gray-400 mb-4">Grow your team by sending invites.</p>
                <button
                  onClick={() => router.push(`/workspace/${workspaces[0].workspace_id}/channel`)}
                  className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 border border-gray-100 transition-all"
                >
                  Send invites
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
