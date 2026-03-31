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
    <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Glass card */}
      <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-3xl p-8 border border-white/[0.1] shadow-2xl overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

        {/* Content */}
        <div className="relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h2>
            <p className="text-sm text-white/40">Sign in to continue to your workspace</p>
          </div>

          {displayError && (
            <div className="p-3.5 bg-red-500/10 rounded-xl mb-5 border border-red-500/20 animate-[scale-in_0.2s_ease-out]">
              <p className="text-sm text-red-400 font-medium text-center">{displayError}</p>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-8">
            <Feature icon="💬" text="Real-time messaging with your team" delay={0} mounted={mounted} />
            <Feature icon="📞" text="Voice & video calls built-in" delay={100} mounted={mounted} />
            <Feature icon="🔒" text="Secure & private workspaces" delay={200} mounted={mounted} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-sm border border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-100/0 via-violet-100/50 to-violet-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <svg className="w-5 h-5 relative" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="relative">{loading ? 'Redirecting...' : 'Continue with Google'}</span>
          </button>

          <p className="text-[11px] text-white/20 text-center mt-6">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, text, delay, mounted }: { icon: string; text: string; delay: number; mounted: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (mounted) {
      const t = setTimeout(() => setShow(true), 400 + delay)
      return () => clearTimeout(t)
    }
  }, [mounted, delay])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white/[0.04] rounded-xl border border-white/[0.06] transition-all duration-500 ${show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
      <span className="text-base">{icon}</span>
      <span className="text-[13px] text-white/50 font-medium">{text}</span>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-[float_6s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px] animate-[float_10s_ease-in-out_infinite]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-[pulse-soft_3s_infinite]">
            <span className="text-white font-extrabold text-2xl">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Threadly</h1>
            <p className="text-[11px] text-white/30 font-medium">Team Communication</p>
          </div>
        </div>

        <Suspense fallback={
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl p-8 border border-white/[0.1]">
            <div className="animate-pulse">
              <div className="h-7 bg-white/10 rounded-lg w-3/4 mx-auto mb-2" />
              <div className="h-4 bg-white/5 rounded-lg w-1/2 mx-auto mb-8" />
              <div className="h-12 bg-white/5 rounded-xl" />
            </div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  )
}
