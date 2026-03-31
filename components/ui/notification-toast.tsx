'use client'

import { useEffect, useState } from 'react'

interface NotificationToastProps {
  senderName: string
  content: string
  onDismiss: () => void
  onClick: () => void
}

export function NotificationToast({ senderName, content, onDismiss, onClick }: NotificationToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true))

    // Play notification sound
    playNotificationSound()
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  const handleClick = () => {
    setVisible(false)
    setTimeout(onClick, 300)
  }

  return (
    <div className={`fixed top-4 right-4 z-[100] transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-8 -translate-y-2'}`}>
      <button
        onClick={handleClick}
        className="group flex items-start gap-3.5 p-4 bg-[#1e1a2b]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(139,92,246,0.15)] max-w-[380px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.3)] transition-all duration-200 text-left border border-white/[0.08] hover:border-white/[0.15]"
      >
        {/* Avatar / Icon */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <span className="text-white font-extrabold text-base">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Pulse dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#1e1a2b] animate-pulse" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-bold text-white truncate">{senderName}</p>
            <span className="text-[10px] text-white/25 font-medium shrink-0">just now</span>
          </div>
          <p className="text-[12px] text-white/50 truncate leading-relaxed">{content}</p>
        </div>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss() }}
          className="text-white/20 hover:text-white/60 shrink-0 mt-1 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full overflow-hidden bg-white/[0.05]">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-[shrink_6s_linear_forwards]" />
        </div>
      </button>
    </div>
  )
}

// Generate and play a clean notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    // First tone (higher)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    osc1.frequency.setValueAtTime(1047, ctx.currentTime + 0.08)
    gain1.gain.setValueAtTime(0.15, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.25)

    // Second tone (subtle harmonic)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.06)
    gain2.gain.setValueAtTime(0, ctx.currentTime)
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.06)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.06)
    osc2.stop(ctx.currentTime + 0.3)

    // Cleanup
    setTimeout(() => ctx.close().catch(() => {}), 500)
  } catch {}
}
