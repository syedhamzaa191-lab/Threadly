import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeroAnimation } from '@/components/landing/hero-animation'

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-glow">
            <span className="text-white font-extrabold text-lg">T</span>
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">Threadly</span>
        </div>
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

        {/* Characters + Chat on sides */}
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

      {/* App Preview */}
      <section className="relative max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="bg-white/5 rounded-2xl md:rounded-3xl p-2 md:p-5 backdrop-blur-sm border border-white/10 shadow-glow-lg">
          <div className="bg-white rounded-2xl p-5 md:p-8 shadow-premium">
            <div className="flex gap-4">
              {/* Fake sidebar */}
              <div className="hidden md:block w-52 shrink-0 bg-[#0f0a1a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">T</span>
                  </div>
                  <span className="text-[13px] font-bold text-white">My Workspace</span>
                </div>
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] mb-2 px-1">Channels</p>
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1.5 bg-white/10 text-white rounded-lg text-xs font-medium flex items-center gap-2">
                    <span className="text-violet-300 text-[10px]">#</span> general
                  </div>
                  <div className="px-2.5 py-1.5 text-white/40 rounded-lg text-xs font-medium flex items-center gap-2">
                    <span className="text-white/20 text-[10px]">#</span> design
                  </div>
                  <div className="px-2.5 py-1.5 text-white/40 rounded-lg text-xs font-medium flex items-center gap-2">
                    <span className="text-white/20 text-[10px]">#</span> engineering
                  </div>
                </div>
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] mb-2 mt-4 px-1">Direct Messages</p>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/40">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full" />
                    <span>Sarah K.</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/40">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full" />
                    <span>Ali M.</span>
                  </div>
                </div>
              </div>
              {/* Fake chat */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                  <span className="text-violet-400 text-base">#</span>
                  <span className="text-sm font-bold text-gray-900">general</span>
                  <span className="text-[11px] text-gray-400 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">12 members</span>
                </div>
                <div className="space-y-4">
                  <ChatBubble name="Sarah K." gradient="from-purple-400 to-violet-500" time="10:30 AM" msg="Hey team! The new designs are ready for review." />
                  <ChatBubble name="Ali M." gradient="from-blue-400 to-indigo-500" time="10:32 AM" msg="Looks great! I'll start on the frontend today." />
                  <ChatBubble name="You" gradient="from-fuchsia-400 to-pink-500" time="10:35 AM" msg="Awesome work everyone. Let's sync up in the thread." />
                </div>
                <div className="mt-5 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-400 flex items-center justify-between">
                  <span>Type a message...</span>
                  <div className="w-6 h-6 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            icon={<InviteIconFeature />}
            title="Easy Invites"
            desc="Invite teammates with a secure link. They sign in with Google and they're in."
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-sm font-bold text-white">Threadly</span>
          </div>
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
    <div className="group bg-white/5 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300 border border-white/5 hover:border-white/10 backdrop-blur-sm">
      <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center mb-4 shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
        {icon}
      </div>
      <h3 className="text-[15px] font-bold text-white mb-2">{title}</h3>
      <p className="text-[13px] text-white/40 leading-relaxed">{desc}</p>
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

function SecureIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
