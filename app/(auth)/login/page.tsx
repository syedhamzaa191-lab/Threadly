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
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side — premium branding */}
      <div className="hidden xl:flex xl:w-1/2 bg-[#0c0618] relative overflow-hidden">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-600/20 via-transparent to-purple-600/10" />
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-[float_6s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-indigo-500/8 rounded-full blur-[80px] animate-[float_10s_ease-in-out_infinite]" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative flex flex-col justify-between p-14 w-full z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.4)]">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">Threadly</span>
          </div>

          {/* Hero content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-violet-300 text-xs font-semibold tracking-wide">TEAM PLATFORM</span>
            </div>

            <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
              Where great<br />teams do their<br />best work
            </h1>
            <p className="text-white/40 text-[16px] leading-relaxed max-w-[380px]">
              Real-time messaging, voice & video calls, and organized workspaces. Built for teams that move fast.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-3 gap-3 mt-10">
              <FeatureCard icon={<MsgIconLg />} label="Messaging" sub="Real-time" />
              <FeatureCard icon={<CallIconLg />} label="Calls" sub="HD voice" />
              <FeatureCard icon={<ShieldIconLg />} label="Security" sub="Encrypted" />
            </div>

            {/* Testimonial / social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#7c3aed', '#ec4899', '#f59e0b', '#10b981'].map((color, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0c0618] flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
                    {['H', 'A', 'S', 'M'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white/60 text-sm font-semibold">Trusted by teams</p>
                <p className="text-white/25 text-xs">Join your workspace today</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/20 text-xs">&copy; 2025 Threadly. All rights reserved.</p>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 bg-[#0a0612] flex items-center justify-center p-6 sm:p-12 relative">
        {/* Subtle gradient on right side */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-violet-500/20 to-transparent hidden xl:block" />

        <div className={`w-full max-w-[380px] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-14 xl:hidden">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.3)]">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <div>
              <span className="text-white font-extrabold text-lg block">Threadly</span>
              <span className="text-white/25 text-[10px] font-medium">Team Communication</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-[32px] font-extrabold text-white tracking-tight mb-2">Welcome back</h2>
            <p className="text-white/30 text-[15px]">Sign in to your workspace</p>
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
            className="group w-full py-4 bg-white text-gray-900 rounded-2xl font-semibold text-[15px] hover:bg-gray-50 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-100/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <svg className="w-5 h-5 relative" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="relative">{loading ? 'Redirecting...' : 'Continue with Google'}</span>
          </button>

          {/* Or divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-white/15 font-semibold tracking-[0.15em]">SECURE LOGIN</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Features */}
          <div className="space-y-4 mb-10">
            <FeatureRow icon={<MsgIcon />} text="Channels, DMs & threads" />
            <FeatureRow icon={<CallIcon />} text="Voice & video calls" />
            <FeatureRow icon={<LockIcon />} text="Admin-approved access" />
          </div>

          {/* Terms */}
          <p className="text-[11px] text-white/15 text-center leading-relaxed">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-white/70 text-sm font-semibold">{label}</p>
      <p className="text-white/25 text-[11px] mt-0.5">{sub}</p>
    </div>
  )
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-[13px] text-white/30 font-medium">{text}</span>
    </div>
  )
}

function MsgIcon() {
  return <svg className="w-4 h-4 text-violet-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
}
function CallIcon() {
  return <svg className="w-4 h-4 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
}
function LockIcon() {
  return <svg className="w-4 h-4 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
}
function MsgIconLg() {
  return <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
}
function CallIconLg() {
  return <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
}
function ShieldIconLg() {
  return <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
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
