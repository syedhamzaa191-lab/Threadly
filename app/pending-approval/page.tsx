'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingApprovalPage() {
  const [status, setStatus] = useState<'pending' | 'rejected' | 'approved' | 'loading'>('loading')
  const [userName, setUserName] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

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
        if (data.status === 'approved') {
          router.push('/workspace')
        }
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
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`relative w-full max-w-[480px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            {/* Logo */}
            <div className="flex items-center justify-center gap-3.5 mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                <span className="text-white font-extrabold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Threadly</h1>
                <p className="text-[11px] text-white/30 font-medium -mt-0.5">Team Communication</p>
              </div>
            </div>

            {/* Loading */}
            {status === 'loading' && (
              <div className="text-center py-6">
                <div className="w-10 h-10 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-5" />
                <p className="text-white/35 text-sm font-medium">Checking your status...</p>
              </div>
            )}

            {/* Pending */}
            {status === 'pending' && (
              <div className="text-center">
                {/* Animated waiting icon */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-2xl animate-[pulse-soft_2s_infinite]" />
                  <div className="relative w-full h-full bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <svg className="w-9 h-9 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-[26px] font-extrabold text-white mb-1.5 tracking-tight">Hey {userName}!</h2>
                <p className="text-[15px] text-white/50 font-semibold mb-5">Your request is being reviewed</p>

                {/* Status steps */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] p-5 mb-6 text-left">
                  <div className="space-y-3.5">
                    <StatusStep done text="Signed in with Google" />
                    <StatusStep done text="Request sent to admin" />
                    <StatusStep waiting text="Waiting for admin approval" />
                    <StatusStep upcoming text="Access to workspace" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2.5 text-white/25 text-xs mb-7">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_200ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_400ms]" />
                  </div>
                  <span>Auto-checking every few seconds</span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-6 py-2.5 bg-white/[0.04] text-white/40 rounded-xl text-sm font-semibold hover:bg-white/[0.08] hover:text-white/60 transition-all border border-white/[0.06]"
                >
                  Sign out
                </button>
              </div>
            )}

            {/* Rejected */}
            {status === 'rejected' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>

                <h2 className="text-[26px] font-extrabold text-white mb-1.5 tracking-tight">Access Denied</h2>
                <p className="text-[14px] text-white/35 leading-relaxed mb-8 max-w-[340px] mx-auto">
                  Your request to join Threadly was not approved. If you think this is a mistake, contact the workspace admin.
                </p>

                <button
                  onClick={handleSignOut}
                  className="px-8 py-3 bg-white/[0.06] text-white/60 rounded-xl text-sm font-bold hover:bg-white/[0.1] transition-all border border-white/[0.08]"
                >
                  Go Back
                </button>
              </div>
            )}
            <p className="text-center text-[11px] text-white/15 mt-8 font-medium">
              Powered by Threadly &mdash; Built for teams
            </p>
          </div>
      </div>
    </div>
  )
}

function StatusStep({ done, waiting, upcoming, text }: { done?: boolean; waiting?: boolean; upcoming?: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      {done && (
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {waiting && (
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 border border-amber-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}
      {upcoming && (
        <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.06]">
          <div className="w-2 h-2 rounded-full bg-white/15" />
        </div>
      )}
      <span className={`text-[13px] font-medium ${done ? 'text-white/50' : waiting ? 'text-amber-300/70' : 'text-white/20'}`}>
        {text}
      </span>
    </div>
  )
}
