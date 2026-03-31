'use client'

import { useState, useEffect, useCallback } from 'react'
import { IconButton } from '@/components/ui/icon-button'

interface ApprovalRequest {
  id: string
  user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  status: string
  created_at: string
}

interface ApprovalPanelProps {
  workspaceId: string
  onClose: () => void
}

export function ApprovalPanel({ workspaceId, onClose }: ApprovalPanelProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`/api/approval?workspace_id=${workspaceId}`)
    if (res.ok) {
      const data = await res.json()
      setRequests(data.requests || [])
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    fetchRequests()
    // Poll every 10 seconds
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [fetchRequests])

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId)
    const res = await fetch('/api/approval', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, action, workspace_id: workspaceId }),
    })

    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    }
    setActionLoading(null)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-[480px] shadow-premium-hover overflow-hidden max-h-[90vh] flex flex-col animate-scale-in border border-gray-100/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Approval Requests</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">Approve or reject people who want to join</p>
          </div>
          <IconButton size="sm" onClick={onClose}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No pending requests</p>
              <p className="text-xs text-gray-400">When someone signs in with Google, their request will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3">
                Pending ({requests.length})
              </p>
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                    {req.avatar_url ? (
                      <img src={req.avatar_url} alt={req.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {req.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{req.full_name}</p>
                    <p className="text-[12px] text-gray-400 truncate">{req.email}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-[12px] font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                    >
                      {actionLoading === req.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[12px] font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">How it works</p>
            <div className="space-y-1.5">
              <Step num={1} text="Someone signs in with Google on the login page" />
              <Step num={2} text="Their request appears here for your approval" />
              <Step num={3} text="Approve to add them to the workspace, or reject" />
              <Step num={4} text="Rejected users are notified and cannot access the app" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
        {num}
      </span>
      <p className="text-[12px] text-gray-900 leading-relaxed">{text}</p>
    </div>
  )
}
