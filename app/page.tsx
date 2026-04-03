import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeroAnimation } from '@/components/landing/hero-animation'
import { LiveChatDemo } from '@/components/landing/live-chat-demo'
import { ThreadlyLogo } from '@/components/ui/threadly-logo'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-[#0a0612] relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
        <ThreadlyLogo size="sm" showText={true} />
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/workspace"
              className="px-5 py-2.5 bg-gradient-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-glow"
            >
              My Workspaces
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-bold text-white/50 hover:text-white rounded-xl transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-gradient-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-glow"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative w-full px-4 md:px-6 pt-12 md:pt-20 pb-10 md:pb-16 text-center page-enter overflow-visible -mt-[80px] pt-[100px] md:pt-[120px]">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-full mb-8 border border-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
            <span className="text-[13px] font-semibold text-white/60">Team messaging, reimagined</span>
          </div>
          <div className="relative">
            {/* Aurora blobs - extend above into navbar */}
            <div className="absolute top-1/2 left-1/2 w-[700px] h-[400px] bg-purple-600/25 rounded-full blur-[140px] aurora-1 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[350px] bg-violet-500/20 rounded-full blur-[120px] aurora-2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] aurora-3 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[250px] bg-fuchsia-500/15 rounded-full blur-[80px] aurora-1 pointer-events-none" style={{ animationDelay: '-5s' }} />

            {/* Spinning rings */}
            <div className="absolute top-1/2 left-1/2 w-[450px] h-[450px] ring-spin pointer-events-none">
              <div className="w-full h-full rounded-full border border-purple-500/[0.07]" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] ring-spin-r pointer-events-none">
              <div className="w-full h-full rounded-full border border-violet-400/[0.06] border-dashed" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-[550px] h-[550px] ring-spin pointer-events-none" style={{ animationDuration: '30s' }}>
              <div className="w-full h-full rounded-full border border-indigo-500/[0.04]" />
              {/* Orbiting dot */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400/40 rounded-full blur-[1px]" />
            </div>

            <h1 className="relative text-3xl sm:text-4xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
              Where teams connect,<br />
              <span className="text-gradient">communicate & collaborate</span>
            </h1>
          </div>
          <p className="text-base md:text-lg text-white/40 max-w-2xl mx-auto mb-6 leading-relaxed px-2">
            Channels, threads, and direct messages — all in one clean, fast workspace.
            Built for teams that value clarity over clutter.
          </p>
        </div>

        <div className="mb-6" />

        {/* Characters */}
        <div className="relative w-full min-h-[200px] sm:min-h-[300px] md:min-h-[420px] lg:min-h-[500px] xl:min-h-[560px] mb-6">
          <HeroAnimation />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href={isLoggedIn ? '/workspace' : '/login'}
            className="group px-8 py-4 bg-gradient-accent text-white font-bold rounded-2xl hover:opacity-90 transition-all text-[15px] shadow-glow-lg hover:shadow-glow"
          >
            {isLoggedIn ? 'Open Workspace' : 'Start for free'}
            <span className="inline-block ml-2 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </Link>
          <a
            href="#features"
            className="px-8 py-4 bg-white/5 text-white/70 font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all text-[15px] border border-white/10"
          >
            See features
          </a>
        </div>
      </section>

      {/* Live Chat Demo */}
      <section className="relative max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-3">See it in action</h2>
          <p className="text-white/35 text-[15px]">Real-time messaging that just works</p>
        </div>
        <LiveChatDemo />
      </section>

      {/* Features */}
      <section id="features" className="relative max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything your team needs
          </h2>
          <p className="text-white/40 text-lg">Simple, powerful, and built for real work.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 stagger-children">
          <FeatureCard
            icon={<ChannelIcon />}
            title="Organized Channels"
            desc="Keep conversations focused with dedicated channels for every team, project, or topic."
          />
          <FeatureCard
            icon={<ThreadIcon />}
            title="Threaded Replies"
            desc="Reply in threads to keep main channels clean. No more scrolling through noise."
          />
          <FeatureCard
            icon={<DmIcon />}
            title="Direct Messages"
            desc="Quick 1-on-1 conversations with any team member, right from the sidebar."
          />
          <FeatureCard
            icon={<RealtimeIcon />}
            title="Real-time Updates"
            desc="Messages appear instantly. No refresh needed — powered by real-time sync."
          />
          <FeatureCard
            icon={<CallIconLanding />}
            title="Voice & Video Calls"
            desc="One-click voice and video calls with any team member. Crystal clear audio."
          />
          <FeatureCard
            icon={<FileIconLanding />}
            title="File Sharing"
            desc="Share images, documents, and voice messages directly in chat."
          />
          <FeatureCard
            icon={<MentionIconLanding />}
            title="@Mentions & Notifications"
            desc="Mention anyone, get notified instantly. Never miss an important message."
          />
          <FeatureCard
            icon={<InviteIconFeature />}
            title="Admin Approvals"
            desc="New users sign in with Google, admin approves. Simple and secure onboarding."
          />
          <FeatureCard
            icon={<SecureIcon />}
            title="Secure by Default"
            desc="Row-level security, encrypted connections, and workspace-scoped access control."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-3xl mx-auto px-4 md:px-6 pb-16 md:pb-24 text-center">
        <div className="relative bg-white/5 rounded-3xl p-10 md:p-14 backdrop-blur-sm border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <h2 className="relative text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            {isLoggedIn ? 'Jump back into your workspace' : 'Ready to get started?'}
          </h2>
          <p className="relative text-white/40 mb-8 text-[15px]">
            {isLoggedIn
              ? 'Your team is waiting. Pick up where you left off.'
              : 'Create your workspace in seconds. No credit card required.'}
          </p>
          <Link
            href={isLoggedIn ? '/workspace' : '/login'}
            className="relative inline-block px-8 py-4 bg-gradient-accent text-white font-bold rounded-2xl hover:opacity-90 transition-all text-[15px] shadow-glow-lg"
          >
            {isLoggedIn ? 'Open Workspace' : 'Start for free'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <ThreadlyLogo size="sm" showText={true} />
          <p className="text-xs text-white/30">
            Designed & Developed by <span className="text-white/50 font-semibold">Syed Hamza Ali</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

function ChatBubble({ name, gradient, time, msg }: { name: string; gradient: string; time: string; msg: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-full shrink-0`} />
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-gray-900">{name}</span>
          <span className="text-[11px] text-gray-400">{time}</span>
        </div>
        <p className="text-[13px] text-gray-600 mt-0.5">{msg}</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative bg-white/[0.03] rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-500 border border-white/[0.06] hover:border-violet-500/20 backdrop-blur-sm overflow-hidden">
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-shadow duration-500">
          {icon}
        </div>
        <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">{title}</h3>
        <p className="text-[13px] text-white/35 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function ChannelIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  )
}

function ThreadIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function DmIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function RealtimeIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function InviteIconFeature() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function CallIconLanding() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function FileIconLanding() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  )
}

function MentionIconLanding() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function SecureIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
