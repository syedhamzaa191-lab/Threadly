'use client'

import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/icon-button'

interface InviteModalProps {
  workspaceId: string
  onClose: () => void
}

interface InviteItem {
  id: string
  email: string
  token: string
  expires_at: string
}

const LIVE_URL = 'https://threadly1-sigma.vercel.app'

export function InviteModal({ workspaceId, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingInvites, setPendingInvites] = useState<InviteItem[]>([])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPendingInvites = async () => {
    const res = await fetch(`/api/invite?workspace_id=${workspaceId}`)
    if (res.ok) {
      const data = await res.json()
      setPendingInvites(data.invites)
    }
  }

  useEffect(() => {
    fetchPendingInvites()
  }, [workspaceId])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, email: email.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    setEmail('')
    fetchPendingInvites()
  }

  const handleDelete = async (inviteId: string) => {
    setDeletingId(inviteId)
    const res = await fetch('/api/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: inviteId, workspace_id: workspaceId }),
    })

    if (res.ok) {
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
    }
    setDeletingId(null)
  }

  const copyLink = (token: string, type: 'local' | 'live') => {
    const base = type === 'live' ? LIVE_URL : window.location.origin
    const link = `${base}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(`${token}-${type}`)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-[440px] shadow-card-hover overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Invite Members</h2>
            <p className="text-[13px] text-gray-900 mt-0.5">Send invite links to add team members</p>
          </div>
          <IconButton size="sm" onClick={onClose}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSendInvite} className="px-6 pb-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 font-medium mt-2">{error}</p>
          )}
        </form>

        {/* How it works */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">How it works</p>
            <div className="space-y-1.5">
              <Step num={1} text="Enter the email of the person you want to invite" />
              <Step num={2} text="A secure invite link is generated (expires in 7 days)" />
              <Step num={3} text="Share the link — they click it and sign in with Google" />
              <Step num={4} text="They are automatically added to the workspace" />
            </div>
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="px-6 pb-6 overflow-y-auto">
            <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3">
              Pending Invites ({pendingInvites.length})
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{inv.email}</p>
                    <p className="text-[11px] text-gray-500">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => copyLink(inv.token, 'local')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                        copiedToken === `${inv.token}-local`
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      {copiedToken === `${inv.token}-local` ? 'Copied!' : 'Local'}
                    </button>
                    <button
                      onClick={() => copyLink(inv.token, 'live')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                        copiedToken === `${inv.token}-live`
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {copiedToken === `${inv.token}-live` ? 'Copied!' : 'Live'}
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingId === inv.id}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      {deletingId === inv.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 bg-gray-900 text-white rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
        {num}
      </span>
      <p className="text-[12px] text-gray-900 leading-relaxed">{text}</p>
    </div>
  )
}
