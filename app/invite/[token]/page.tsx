'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepting' | 'success'>('loading')
  const [error, setError] = useState('')
  const [inviteInfo, setInviteInfo] = useState<{ email: string; workspace_name: string; workspace_id: string } | null>(null)

  // Step 1: Validate token
  useEffect(() => {
    async function validate() {
      const res = await fetch(`/api/invite/validate?token=${token}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        setStatus('invalid')
        return
      }

      setInviteInfo(data)
      setStatus('valid')
    }
    validate()
  }, [token])

  // Step 2: Accept invite (user must be logged in)
  const handleAccept = async () => {
    setStatus('accepting')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Redirect to signup, then come back
      router.push(`/signup?redirect=/invite/${token}`)
      return
    }

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setStatus('invalid')
      return
    }

    setStatus('success')
    setTimeout(() => {
      router.push(`/workspace/${data.workspace_id}/channel`)
    }, 1500)
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
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Validating invite...</p>
            </div>
          )}

          {status === 'valid' && inviteInfo && (
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">You&apos;re invited!</h2>
              <p className="text-sm text-gray-900 mb-1">
                Join <span className="font-bold">{inviteInfo.workspace_name}</span>
              </p>
              <p className="text-xs text-gray-900 mb-6">Invite sent to {inviteInfo.email}</p>
              <button
                onClick={handleAccept}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
              >
                Accept Invite
              </button>
            </div>
          )}

          {status === 'accepting' && (
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">Joining workspace...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Welcome!</h2>
              <p className="text-sm text-gray-900">Redirecting to workspace...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Invalid Invite</h2>
              <p className="text-sm text-gray-900">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
