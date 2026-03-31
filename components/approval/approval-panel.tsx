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
  onApproved?: () => void
}

export function ApprovalPanel({ workspaceId, onClose, onApproved }: ApprovalPanelProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/approval?workspace_id=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch {}
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [fetchRequests])

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId)
    setActionFeedback({ id: requestId, type: action })

    const res = await fetch('/api/approval', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, action, workspace_id: workspaceId }),
    })

    if (res.ok) {
      // Animate out then remove
      setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
        setActionFeedback(null)
        if (action === 'approve' && onApproved) onApproved()
      }, 600)
    }
    setActionLoading(null)
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Panel */}
      <div className={`relative bg-white rounded-3xl w-full max-w-[480px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100/50 transition-all duration-300 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 pb-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }} />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Approval Requests</h2>
              <p className="text-[13px] text-white/60 mt-0.5">Approve or reject people who want to join</p>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4 pt-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-3 border-gray-100 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400 font-medium">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[15px] font-bold text-gray-700 mb-1">All clear!</p>
              <p className="text-xs text-gray-400 max-w-[250px] mx-auto">When someone signs in with Google, their request will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Pending — {requests.length} {requests.length === 1 ? 'request' : 'requests'}
              </p>
              {requests.map((req, i) => {
                const feedback = actionFeedback?.id === req.id ? actionFeedback.type : null
                return (
                  <div
                    key={req.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${
                      feedback === 'approve' ? 'bg-emerald-50 border-emerald-200 scale-95 opacity-0' :
                      feedback === 'reject' ? 'bg-red-50 border-red-200 scale-95 opacity-0' :
                      'bg-gray-50/80 border-gray-100 hover:border-violet-200 hover:shadow-sm'
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 shrink-0 ring-2 ring-white shadow-sm">
                      {req.avatar_url ? (
                        <img src={req.avatar_url} alt={req.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-base">
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
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-[12px] font-bold hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                      >
                        {actionLoading === req.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'reject')}
                        disabled={actionLoading === req.id}
                        className="px-4 py-2.5 bg-white text-red-500 rounded-xl text-[12px] font-bold border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all duration-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="px-6 pb-6 pt-2">
          <div className="bg-gradient-to-br from-gray-50 to-violet-50/30 rounded-2xl p-4 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">How it works</p>
            <div className="space-y-2">
              <Step num={1} text="Someone signs in with Google on the login page" />
              <Step num={2} text="Their request appears here for your approval" />
              <Step num={3} text="Approve to add them, or reject to deny access" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 h-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
        {num}
      </span>
      <p className="text-[12px] text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
}
