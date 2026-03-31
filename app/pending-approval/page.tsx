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
      if (!user) {
        router.push('/login')
        return
      }

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there')

      // Check if already a workspace member (approved)
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

      // Check approval request status
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

    // Poll every 5 seconds to check if approved
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-md w-full mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow-lg">
            <span className="text-white font-extrabold text-2xl">T</span>
          </div>
        </div>

        {status === 'loading' && (
          <div className="bg-white/[0.04] backdrop-blur-sm rounded-3xl p-8 border border-white/[0.08] text-center">
            <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">Checking status...</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-white/[0.04] backdrop-blur-sm rounded-3xl p-8 border border-white/[0.08] text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Hey {userName}!</h1>
            <h2 className="text-lg font-bold text-white/70 mb-4">Approval Pending</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Your request to join Threadly has been sent to the admin.
              You'll get access as soon as they approve your request.
            </p>
            <div className="flex items-center justify-center gap-2 text-white/20 text-xs mb-6">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Waiting for admin approval...</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}

        {status === 'rejected' && (
          <div className="bg-white/[0.04] backdrop-blur-sm rounded-3xl p-8 border border-white/[0.08] text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Sorry, your request to join Threadly was not approved.
              Contact the admin if you think this is a mistake.
            </p>
            <button
              onClick={handleSignOut}
              className="px-6 py-2.5 bg-white/[0.06] text-white/60 rounded-xl text-sm font-bold hover:bg-white/[0.1] transition-all"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
