import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-extrabold text-lg">T</span>
          </div>
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">Threadly</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-card mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[13px] font-bold text-gray-900">Team messaging, reimagined</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
          Where teams connect,<br />
          <span className="text-gray-400">communicate & collaborate</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Channels, threads, and direct messages — all in one clean, fast workspace.
          Built for teams that value clarity over clutter.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors shadow-soft text-[15px]"
          >
            Start for free
          </Link>
          <a
            href="#features"
            className="px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-card text-[15px]"
          >
            See features
          </a>
        </div>
      </section>

      {/* App Preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl shadow-card-hover p-4 md:p-6">
          <div className="bg-gray-50 rounded-2xl p-6 md:p-10">
            <div className="flex gap-4">
              {/* Fake sidebar */}
              <div className="hidden md:block w-56 shrink-0">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">My Workspace</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Channels</p>
                <div className="space-y-1">
                  <div className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium"># general</div>
                  <div className="px-3 py-2 text-gray-500 rounded-lg text-xs font-medium"># design</div>
                  <div className="px-3 py-2 text-gray-500 rounded-lg text-xs font-medium"># engineering</div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-5 px-1">Direct Messages</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                    <div className="w-5 h-5 bg-blue-200 rounded-full" />
                    <span>Sarah K.</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                    <div className="w-5 h-5 bg-emerald-200 rounded-full" />
                    <span>Ali M.</span>
                  </div>
                </div>
              </div>
              {/* Fake chat */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                  <span className="text-gray-300 text-lg">#</span>
                  <span className="text-sm font-bold text-gray-900">general</span>
                  <span className="text-xs text-gray-400 ml-2">12 members</span>
                </div>
                <div className="space-y-5">
                  <ChatBubble name="Sarah K." color="bg-blue-200" time="10:30 AM" msg="Hey team! The new designs are ready for review." />
                  <ChatBubble name="Ali M." color="bg-emerald-200" time="10:32 AM" msg="Looks great! I'll start on the frontend today." />
                  <ChatBubble name="You" color="bg-violet-200" time="10:35 AM" msg="Awesome work everyone. Let's sync up in the thread." />
                </div>
                <div className="mt-6 px-4 py-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-400">
                  Type a message...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Everything your team needs
          </h2>
          <p className="text-gray-500 text-lg">Simple, powerful, and built for real work.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
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
            icon={<InviteIcon />}
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
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gray-900 rounded-3xl p-10 md:p-14">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8 text-[15px]">
            Create your workspace in seconds. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-colors text-[15px]"
          >
            Start for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-sm font-bold text-gray-900">Threadly</span>
          </div>
          <p className="text-xs text-gray-400">Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  )
}

function ChatBubble({ name, color, time, msg }: { name: string; color: string; time: string; msg: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 ${color} rounded-full shrink-0`} />
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-gray-900">{name}</span>
          <span className="text-[11px] text-gray-400">{time}</span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{msg}</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function ChannelIcon() {
  return (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  )
}

function ThreadIcon() {
  return (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function DmIcon() {
  return (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function RealtimeIcon() {
  return (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function InviteIcon() {
  return (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function SecureIcon() {
  return (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
