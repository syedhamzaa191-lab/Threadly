'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingApprovalPage() {
  const [status, setStatus] = useState<'pending' | 'rejected' | 'approved' | 'loading'>('loading')
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there')

      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membership) {
        router.push(`/workspace/${membership.workspace_id}/channel`)
        return
      }

      const res = await fetch(`/api/approval/status?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status || 'pending')
        if (data.status === 'approved') router.push('/workspace')
      } else {
        setStatus('pending')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side — branding (same as login) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-indigo-400/15 rounded-full blur-[60px]" />

        <div className="relative flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <span className="text-white font-extrabold text-lg">Threadly</span>
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Almost there
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-[320px]">
              Your account is being reviewed by the workspace admin. You'll get access shortly.
            </p>
          </div>

          <p className="text-white/30 text-xs">&copy; 2025 Threadly. All rights reserved.</p>
        </div>
      </div>

      {/* Right side — status */}
      <div className="flex-1 bg-[#0a0612] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <span className="text-white font-extrabold text-lg">Threadly</span>
          </div>

          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-5" />
              <p className="text-white/35 text-sm">Checking your status...</p>
            </div>
          )}

          {/* Pending */}
          {status === 'pending' && (
            <div>
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Hey {userName}!</h2>
                <p className="text-white/35 text-[15px]">Your request is being reviewed.</p>
              </div>

              {/* Progress steps */}
              <div className="space-y-4 mb-10">
                <Step done text="Signed in with Google" />
                <Step done text="Request sent to admin" />
                <Step waiting text="Waiting for approval" />
                <Step upcoming text="Access to workspace" />
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 mb-10">
                <div className="flex gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_200ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_400ms]" />
                </div>
                <p className="text-amber-300/60 text-[13px]">Auto-checking every few seconds</p>
              </div>

              <button
                onClick={handleSignOut}
                className="text-sm text-white/25 hover:text-white/50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Rejected */}
          {status === 'rejected' && (
            <div>
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 border border-red-500/20">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Access Denied</h2>
              <p className="text-white/35 text-[15px] mb-10 leading-relaxed">
                Your request was not approved. Contact the workspace admin if you think this is a mistake.
              </p>

              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-white/[0.06] text-white/50 rounded-xl text-sm font-semibold hover:bg-white/[0.1] transition-all"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Step({ done, waiting, upcoming, text }: { done?: boolean; waiting?: boolean; upcoming?: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3.5">
      {done && (
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {waiting && (
        <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}
      {upcoming && (
        <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-white/15" />
        </div>
      )}
      <span className={`text-[14px] ${done ? 'text-white/50' : waiting ? 'text-amber-300/70 font-medium' : 'text-white/20'}`}>
        {text}
      </span>
    </div>
  )
}
