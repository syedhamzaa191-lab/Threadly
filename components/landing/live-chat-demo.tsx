'use client'

import { useState, useEffect } from 'react'

const messages = [
  { name: 'Sarah', color: 'from-violet-500 to-purple-600', msg: 'Hey team! The new designs are ready 🎨', time: '10:30 AM' },
  { name: 'Ali', color: 'from-blue-500 to-indigo-600', msg: 'Looks great! Starting frontend now', time: '10:32 AM' },
  { name: 'Hamza', color: 'from-emerald-500 to-green-600', msg: 'Awesome work everyone 🚀', time: '10:33 AM' },
  { name: 'Sarah', color: 'from-violet-500 to-purple-600', msg: 'Thread: Check the mobile version too', time: '10:35 AM' },
  { name: 'Ali', color: 'from-blue-500 to-indigo-600', msg: '@Hamza I\'ll need the API docs', time: '10:36 AM' },
  { name: 'Hamza', color: 'from-emerald-500 to-green-600', msg: 'Shared in #engineering channel ✅', time: '10:37 AM' },
]

export function LiveChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (visibleCount >= messages.length) {
      const timer = setTimeout(() => setVisibleCount(0), 3000)
      return () => clearTimeout(timer)
    }
    setTyping(true)
    const typingTimer = setTimeout(() => {
      setTyping(false)
      setVisibleCount(prev => prev + 1)
    }, 1200)
    return () => clearTimeout(typingTimer)
  }, [visibleCount])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#12101f]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-[#1a1630]">
          <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center">
            <span className="text-violet-300 font-bold text-sm">#</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">design-team</p>
            <p className="text-[10px] text-white/30">3 members online</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Messages */}
        <div className="px-5 py-4 min-h-[280px] max-h-[280px] overflow-hidden">
          <div className="space-y-4">
            {messages.slice(0, visibleCount).map((msg, i) => (
              <div key={i} className="flex items-start gap-3 animate-[slideUp_0.3s_ease]">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${msg.color} flex items-center justify-center shrink-0 text-white text-[11px] font-bold`}>
                  {msg.name[0]}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-bold text-white">{msg.name}</span>
                    <span className="text-[10px] text-white/20">{msg.time}</span>
                  </div>
                  <p className="text-[12px] text-white/60 mt-0.5">{msg.msg}</p>
                </div>
              </div>
            ))}
            {typing && visibleCount < messages.length && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${messages[visibleCount].color} flex items-center justify-center shrink-0 text-white text-[11px] font-bold`}>
                  {messages[visibleCount].name[0]}
                </div>
                <div className="flex gap-1 px-3 py-2 bg-white/[0.04] rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-[bounce_1s_infinite_0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-[bounce_1s_infinite_200ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-[bounce_1s_infinite_400ms]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            <span className="text-[12px] text-white/20">Message #design-team</span>
            <div className="ml-auto flex gap-2">
              <div className="w-5 h-5 rounded bg-white/[0.06]" />
              <div className="w-5 h-5 rounded bg-violet-500/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
