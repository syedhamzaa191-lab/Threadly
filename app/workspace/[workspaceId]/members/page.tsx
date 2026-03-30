'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface MemberProfile {
  user_id: string
  role: string
  full_name: string
  email: string
  avatar_url: string | null
  bio: string
  phone: string
  location: string
  department: string
}

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const { user } = useAuth()
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const [myRole, setMyRole] = useState<string>('member')
  const supabase = createClient()

  const loadMembers = useCallback(async () => {
    const { data: mems } = await supabase
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspaceId)

    if (!mems || mems.length === 0) { setLoading(false); return }

    // Find current user's role
    const myMem = mems.find((m: any) => m.user_id === user?.id)
    if (myMem) setMyRole(myMem.role)

    const userIds = mems.map((m: any) => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, bio, phone, location, department')
      .in('id', userIds)

    const combined = mems.map((m: any) => {
      const p = profiles?.find((p: any) => p.id === m.user_id)
      return {
        user_id: m.user_id,
        role: m.role,
        full_name: p?.full_name || 'Unknown',
        email: p?.email || '',
        avatar_url: p?.avatar_url || null,
        bio: p?.bio || '',
        phone: p?.phone || '',
        location: p?.location || '',
        department: p?.department || '',
      }
    })

    setMembers(combined)
    setLoading(false)
  }, [workspaceId, user?.id])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const isAdmin = myRole === 'owner' || myRole === 'admin'

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.department.toLowerCase().includes(search.toLowerCase())
  )

  const roleOrder = { owner: 0, admin: 1, member: 2 }
  const sorted = [...filtered].sort((a, b) =>
    (roleOrder[a.role as keyof typeof roleOrder] ?? 3) - (roleOrder[b.role as keyof typeof roleOrder] ?? 3)
  )

  return (
    <>
      <main className="flex-1 flex flex-col min-w-0 bg-[#1e1a2b] page-enter">
        {/* Header */}
        <div className="px-4 md:px-8 py-4 md:py-5 bg-[#252133] border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[18px] font-bold text-white">Team Members</h1>
                <p className="text-[12px] text-white/30 mt-0.5">{members.length} {members.length === 1 ? 'member' : 'members'} in this workspace</p>
              </div>
            </div>
          </div>
          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-dark p-4 md:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/30">Loading members...</p>
              </div>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/40">No members found</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 stagger-children">
              {sorted.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => setSelectedMember(member)}
                  className="group bg-[#252133] hover:bg-[#2d2840] border border-white/[0.06] hover:border-purple-500/20 rounded-2xl p-5 text-left transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={member.full_name} src={member.avatar_url} size="xl" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-white truncate">{member.full_name}</h3>
                        {member.user_id === user?.id && (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full shrink-0">You</span>
                        )}
                      </div>
                      <RoleBadge role={member.role} />
                      <p className="text-[12px] text-white/30 truncate mt-1">{member.email}</p>
                    </div>
                  </div>

                  {(member.bio || member.department || member.location) && (
                    <div className="mt-4 pt-3 border-t border-white/[0.04]">
                      {member.bio && (
                        <p className="text-[12px] text-white/40 line-clamp-2 leading-relaxed">{member.bio}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {member.department && (
                          <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {member.department}
                          </span>
                        )}
                        {member.location && (
                          <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {member.location}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          isYou={selectedMember.user_id === user?.id}
          isAdmin={isAdmin}
          myRole={myRole}
          workspaceId={workspaceId}
          onClose={() => setSelectedMember(null)}
          onRefresh={loadMembers}
        />
      )}
    </>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    owner: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
    member: 'bg-white/[0.06] text-white/40 border-white/[0.06]',
  }
  const s = styles[role as keyof typeof styles] || styles.member
  return (
    <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${s}`}>
      {role}
    </span>
  )
}

function MemberDetailModal({ member, isYou, isAdmin, myRole, workspaceId, onClose, onRefresh }: {
  member: MemberProfile
  isYou: boolean
  isAdmin: boolean
  myRole: string
  workspaceId: string
  onClose: () => void
  onRefresh: () => void
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const canManage = isAdmin && !isYou && member.role !== 'owner'

  const handleAction = async (action: string, newRole?: string) => {
    setActionLoading(action)
    setActionError('')
    setActionSuccess('')

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        target_user_id: member.user_id,
        workspace_id: workspaceId,
        ...(newRole ? { new_role: newRole } : {}),
      }),
    })

    const data = await res.json()
    setActionLoading(null)

    if (!res.ok) {
      setActionError(data.error || 'Something went wrong')
    } else {
      setActionSuccess(data.message || 'Done!')
      onRefresh()
      if (action === 'deactivate') {
        setTimeout(onClose, 1500)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#252133] rounded-3xl w-full max-w-[440px] overflow-hidden border border-white/[0.08] shadow-2xl animate-scale-in">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-purple-600/40 via-indigo-600/30 to-violet-700/40 relative">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl border-4 border-[#252133] overflow-hidden bg-[#252133]">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
              ) : null}
              <div className={`w-full h-full bg-[#8b5cf6] flex items-center justify-center font-bold text-white text-xl ${member.avatar_url ? 'hidden' : ''}`}>
                {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 px-6 pb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-white">{member.full_name}</h2>
            {isYou && <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">You</span>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <RoleBadge role={member.role} />
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Admin Actions */}
          {canManage && (
            <div className="mt-5">
              <p className="text-[11px] font-bold text-white/25 uppercase tracking-wider mb-2">Admin Actions</p>

              {actionError && (
                <div className="mb-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="text-[12px] text-red-400 font-medium">{actionError}</p>
                </div>
              )}
              {actionSuccess && (
                <div className="mb-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-[12px] text-emerald-400 font-medium">{actionSuccess}</p>
                </div>
              )}

              <div className="flex gap-2">
                {/* Role toggle */}
                <button
                  onClick={() => handleAction('change_role', member.role === 'admin' ? 'member' : 'admin')}
                  disabled={actionLoading !== null}
                  className="flex-1 px-3 py-2.5 rounded-xl text-[12px] font-bold bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white border border-white/[0.08] transition-all disabled:opacity-50"
                >
                  {actionLoading === 'change_role' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      Changing...
                    </span>
                  ) : member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                </button>
                {/* Deactivate */}
                <button
                  onClick={() => handleAction('deactivate')}
                  disabled={actionLoading !== null}
                  className="flex-1 px-3 py-2.5 rounded-xl text-[12px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                >
                  {actionLoading === 'deactivate' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-red-400/20 border-t-red-400/60 rounded-full animate-spin" />
                      Deactivating...
                    </span>
                  ) : 'Deactivate User'}
                </button>
              </div>
            </div>
          )}

          {/* Bio */}
          {member.bio && (
            <div className="mt-5">
              <p className="text-[11px] font-bold text-white/25 uppercase tracking-wider mb-2">About</p>
              <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.04]">
                <p className="text-[13px] text-white/60 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="mt-5 space-y-2">
            <p className="text-[11px] font-bold text-white/25 uppercase tracking-wider mb-2">Details</p>

            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Email"
              value={member.email}
            />
            {member.department && (
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                label="Department"
                value={member.department}
              />
            )}
            {member.location && (
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Location"
                value={member.location}
              />
            )}
            {member.phone && (
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                label="Phone"
                value={member.phone}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
      <div className="w-8 h-8 bg-white/[0.04] rounded-lg flex items-center justify-center text-white/30 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">{label}</p>
        <p className="text-[13px] text-white/60 font-medium truncate mt-0.5">{value || 'Not set'}</p>
      </div>
    </div>
  )
}
