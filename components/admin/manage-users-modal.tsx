'use client'

import { useState } from 'react'
import { IconButton } from '@/components/ui/icon-button'
import { Avatar } from '@/components/ui/avatar'

interface Member {
  user_id: string
  role: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface ManageUsersModalProps {
  members: Member[]
  workspaceId: string
  currentUserId: string
  onClose: () => void
  onAction: () => void
  onStartDm?: (userId: string) => void
}

export function ManageUsersModal({ members, workspaceId, currentUserId, onClose, onAction, onStartDm }: ManageUsersModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAction = async (action: string, targetUserId: string, newRole?: string) => {
    setLoading(targetUserId)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        target_user_id: targetUserId,
        workspace_id: workspaceId,
        ...(newRole ? { new_role: newRole } : {}),
      }),
    })

    const data = await res.json()
    setLoading(null)

    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess(data.message)
      onAction()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-[500px] shadow-card-hover overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Manage Members</h2>
            <p className="text-[13px] text-gray-900 mt-0.5">{members.length} members</p>
          </div>
          <IconButton size="sm" onClick={onClose}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {error && (
          <div className="mx-6 mb-3 p-3 bg-red-50 rounded-xl">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mx-6 mb-3 p-3 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-600 font-medium">{success}</p>
          </div>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin">
          <div className="space-y-2">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId
              const name = member.profiles?.full_name || 'Unknown'
              const avatar = member.profiles?.avatar_url || null

              return (
                <div key={member.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Avatar name={name} src={avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate">
                      {name} {isCurrentUser && <span className="text-gray-400">(You)</span>}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium uppercase">{member.role}</p>
                  </div>

                  {!isCurrentUser && (
                    <div className="flex gap-1.5 shrink-0">
                      {/* Message button */}
                      {onStartDm && (
                        <button
                          onClick={() => { onStartDm(member.user_id); onClose() }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  )}
                  {!isCurrentUser && member.role !== 'owner' && (
                    <div className="flex gap-1.5 shrink-0">
                      {/* Role toggle */}
                      <button
                        onClick={() => handleAction('change_role', member.user_id, member.role === 'admin' ? 'member' : 'admin')}
                        disabled={loading === member.user_id}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                      </button>
                      {/* Deactivate */}
                      <button
                        onClick={() => handleAction('deactivate', member.user_id)}
                        disabled={loading === member.user_id}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {loading === member.user_id ? '...' : 'Deactivate'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
