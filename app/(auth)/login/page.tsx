'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  account_deactivated: 'Your account has been deactivated. Contact your admin.',
  auth_failed: 'Authentication failed. Please try again.',
  no_code: 'Something went wrong. Please try again.',
}

function LoginContent() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const urlError = searchParams.get('error')
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  const displayError = error || (urlError ? ERROR_MESSAGES[urlError] || urlError : '')

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    const siteUrl = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback${redirect ? `?redirect=${redirect}` : ''}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`relative w-full max-w-[480px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            {/* Logo + Brand */}
            <div className="flex items-center justify-center gap-3.5 mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                <span className="text-white font-extrabold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Threadly</h1>
                <p className="text-[11px] text-white/30 font-medium -mt-0.5">Team Communication</p>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h2 className="text-[26px] font-extrabold text-white mb-1.5 tracking-tight">Welcome back</h2>
              <p className="text-[14px] text-white/35">Sign in to continue to your workspace</p>
            </div>

            {/* Error */}
            {displayError && (
              <div className="p-3.5 bg-red-500/10 rounded-xl mb-6 border border-red-500/20">
                <p className="text-sm text-red-400 font-medium text-center">{displayError}</p>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2.5 mb-8">
              <Feature icon={<MsgIcon />} text="Real-time messaging with your team" delay={0} mounted={mounted} />
              <Feature icon={<CallIcon />} text="Voice & video calls built-in" delay={100} mounted={mounted} />
              <Feature icon={<LockIcon />} text="Secure & private workspaces" delay={200} mounted={mounted} />
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-[15px] hover:shadow-[0_4px_24px_rgba(139,92,246,0.25)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-100/0 via-violet-100/40 to-violet-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <svg className="w-5 h-5 relative" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="relative">{loading ? 'Redirecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-white/20 font-medium">SECURE LOGIN</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Footer */}
            <p className="text-[11px] text-white/15 text-center">
              By signing in, you agree to our Terms of Service
            </p>

            {/* Bottom tagline */}
            <p className="text-center text-[11px] text-white/15 mt-8 font-medium">
              Powered by Threadly &mdash; Built for teams
            </p>
          </div>
      </div>
    </div>
  )
}

function Feature({ icon, text, delay, mounted }: { icon: React.ReactNode; text: string; delay: number; mounted: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (mounted) {
      const t = setTimeout(() => setShow(true), 300 + delay)
      return () => clearTimeout(t)
    }
  }, [mounted, delay])

  return (
    <div className={`flex items-center gap-3.5 px-4 py-3.5 bg-white/[0.03] rounded-xl border border-white/[0.05] transition-all duration-500 ${show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-[13px] text-white/45 font-medium">{text}</span>
    </div>
  )
}

function MsgIcon() {
  return (
    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function CallIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
