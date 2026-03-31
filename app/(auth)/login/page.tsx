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
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const urlError = searchParams.get('error')
  const supabase = createClient()

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
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side — branding */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        {/* Glow orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-indigo-400/15 rounded-full blur-[60px]" />

        <div className="relative flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <span className="text-white font-extrabold text-lg">Threadly</span>
          </div>

          {/* Hero text */}
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Where teams<br />come together
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-[320px]">
              Real-time messaging, voice calls, and secure workspaces — everything your team needs in one place.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              <div>
                <p className="text-2xl font-extrabold text-white">Fast</p>
                <p className="text-white/40 text-sm">Real-time sync</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">Secure</p>
                <p className="text-white/40 text-sm">End-to-end</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">Simple</p>
                <p className="text-white/40 text-sm">Easy to use</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-xs">&copy; 2025 Threadly. All rights reserved.</p>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 bg-[#0a0612] flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 xl:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <span className="text-white font-extrabold text-lg">Threadly</span>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Sign in</h2>
            <p className="text-white/35 text-[15px]">Welcome back. Sign in to continue.</p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="p-4 bg-red-500/10 rounded-xl mb-6 border border-red-500/20">
              <p className="text-sm text-red-400 font-medium">{displayError}</p>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group w-full py-4 bg-white text-gray-900 rounded-xl font-semibold text-[15px] hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <div className="flex items-center gap-2 text-white/20">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[11px] font-medium tracking-wider">SECURE LOGIN</span>
            </div>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <FeatureRow icon={<MsgIcon />} text="Channels, DMs & threads" />
            <FeatureRow icon={<CallIcon />} text="Voice & video calls" />
            <FeatureRow icon={<LockIcon />} text="Admin-approved access" />
          </div>

          {/* Terms */}
          <p className="text-[11px] text-white/15 text-center">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-[13px] text-white/30">{text}</span>
    </div>
  )
}

function MsgIcon() {
  return <svg className="w-4 h-4 text-violet-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
}
function CallIcon() {
  return <svg className="w-4 h-4 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
}
function LockIcon() {
  return <svg className="w-4 h-4 text-amber-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
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
