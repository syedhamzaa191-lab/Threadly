'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatedCharacter } from './animated-character'

const ALL_CONVERSATIONS = [
  // Software Dev
  [
    { from: 'A', text: 'PR is ready for the auth module 🔐' },
    { from: 'B', text: 'Reviewing now, tests look clean ✅', think: 'Let me check...' },
    { from: 'A', text: 'Added rate limiting too' },
    { from: 'B', text: 'Approved & merged! Ship it 🚀' },
  ],
  // Design
  [
    { from: 'B', text: 'New landing page mockup in Figma 🎨', think: 'This looks good...' },
    { from: 'A', text: 'Love the hero section!' },
    { from: 'B', text: 'Client wants darker theme tho' },
    { from: 'A', text: 'On it, pushing update tonight ✨' },
  ],
  // Video Editing
  [
    { from: 'A', text: 'Final cut is rendering now 🎬' },
    { from: 'B', text: 'Add the intro animation first', think: 'Almost there...' },
    { from: 'A', text: 'Done! Color grading looks perfect' },
    { from: 'B', text: 'Upload to drive, client needs it by 5 📤' },
  ],
  // 3D / Motion
  [
    { from: 'B', text: 'Blender render is at 87% 🖥️' },
    { from: 'A', text: 'How many frames left?' },
    { from: 'B', text: '340 more, 2 hours ETA', think: 'GPU going crazy...' },
    { from: 'A', text: 'Nice! Compositing is ready on my end 🎞️' },
  ],
  // Sales
  [
    { from: 'A', text: 'Enterprise deal closed! $48K ARR 🎉', think: 'Huge win!' },
    { from: 'B', text: 'Lets gooo! Best quarter yet' },
    { from: 'A', text: 'Onboarding call set for Monday' },
    { from: 'B', text: 'I\'ll prep the welcome deck 📊' },
  ],
  // Marketing
  [
    { from: 'B', text: 'Campaign CTR is up 34% 📈' },
    { from: 'A', text: 'Which channel performed best?', think: 'Interesting...' },
    { from: 'B', text: 'LinkedIn ads crushed it this time' },
    { from: 'A', text: 'Double the budget for next sprint 💰' },
  ],
  // DevOps
  [
    { from: 'A', text: 'Deployment pipeline is green ✅' },
    { from: 'B', text: 'Latency dropped 40ms after CDN fix', think: 'Nice improvement!' },
    { from: 'A', text: 'Monitoring dashboard looks clean' },
    { from: 'B', text: 'Zero downtime this month 🏆' },
  ],
  // Product
  [
    { from: 'B', text: 'User feedback is in from beta 📋', think: 'So much data...' },
    { from: 'A', text: 'Top request?' },
    { from: 'B', text: 'Dark mode & keyboard shortcuts' },
    { from: 'A', text: 'Already on the roadmap, shipping next week 🗓️' },
  ],
  // Mobile Dev
  [
    { from: 'A', text: 'iOS build passed App Store review 🍎' },
    { from: 'B', text: 'Android build too, both approved!', think: 'Finally!' },
    { from: 'A', text: 'Scheduling release for Thursday' },
    { from: 'B', text: 'Push notifications tested and ready 📱' },
  ],
  // Support
  [
    { from: 'B', text: 'Ticket queue is down to 3 🎯' },
    { from: 'A', text: 'Response time average?', think: 'How are we doing...' },
    { from: 'B', text: 'Under 2 hours, best this quarter' },
    { from: 'A', text: 'Team is killing it! Shoutout in standup 🙌' },
  ],
]

interface Msg { from: string; text: string; think?: string }

// Shuffle array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function HeroAnimation() {
  const [leftMsgs, setLeftMsgs] = useState<Msg[]>([])
  const [rightMsgs, setRightMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState<'A' | 'B' | null>(null)
  const [thinking, setThinking] = useState<{ from: 'A' | 'B'; text: string } | null>(null)
  const orderRef = useRef(shuffle(ALL_CONVERSATIONS.map((_, i) => i)))
  const posRef = useRef(0)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    function getNext() {
      if (posRef.current >= orderRef.current.length) {
        orderRef.current = shuffle(ALL_CONVERSATIONS.map((_, i) => i))
        posRef.current = 0
      }
      const idx = orderRef.current[posRef.current]
      posRef.current++
      return ALL_CONVERSATIONS[idx]
    }

    function runConversation() {
      const conv = getNext()
      let msgIdx = 0

      function showNext() {
        if (msgIdx >= conv.length) {
          timeout = setTimeout(() => {
            setLeftMsgs([])
            setRightMsgs([])
            setTyping(null)
            setThinking(null)
            timeout = setTimeout(runConversation, 1200)
          }, 3500)
          return
        }

        const msg = conv[msgIdx]
        const sender = msg.from as 'A' | 'B'

        if (msg.think) {
          setThinking({ from: sender, text: msg.think })
          timeout = setTimeout(() => {
            setThinking(null)
            setTyping(sender)
            timeout = setTimeout(() => {
              setTyping(null)
              if (sender === 'A') setLeftMsgs(prev => [...prev.slice(-2), msg])
              else setRightMsgs(prev => [...prev.slice(-2), msg])
              msgIdx++
              timeout = setTimeout(showNext, 1400)
            }, 900)
          }, 1300)
        } else {
          setTyping(sender)
          timeout = setTimeout(() => {
            setTyping(null)
            if (sender === 'A') setLeftMsgs(prev => [...prev.slice(-2), msg])
            else setRightMsgs(prev => [...prev.slice(-2), msg])
            msgIdx++
            timeout = setTimeout(showNext, 1400)
          }, 900)
        }
      }
      showNext()
    }

    timeout = setTimeout(runConversation, 800)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="flex w-full justify-between absolute -top-[30%] left-0 right-0 bottom-0 pointer-events-none items-center">

      {/* LEFT: Character + Messages */}
      <div className="flex flex-col items-start pl-0 lg:pl-2 xl:pl-6 w-[32%] lg:w-[30%]">
        {/* Messages from Jake */}
        <div className="w-full hidden sm:flex flex-col gap-1.5 mb-2 min-h-[60px] justify-end pl-2">
          {leftMsgs.map((msg, i) => (
            <div key={`l-${posRef.current}-${i}`} className="flex justify-start" style={{ animation: 'msg-appear 8s ease both' }}>
              <div className="px-3 py-1.5 rounded-2xl rounded-bl-sm text-[10px] lg:text-[11px] xl:text-[12px] leading-relaxed bg-purple-500/15 text-purple-200/80 border border-purple-500/10 max-w-[95%]">
                {msg.text}
              </div>
            </div>
          ))}
          {typing === 'A' && <TypingDots side="left" />}
        </div>

        {/* Thinking bubble */}
        <div className="w-full hidden sm:flex justify-center mb-1 h-5">
          {thinking && thinking.from === 'A' && (
            <div style={{ animation: 'msg-appear 2.5s ease both' }}>
              <span className="text-[9px] lg:text-[10px] text-white/40 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1">💭 {thinking.text}</span>
            </div>
          )}
        </div>

        {/* Character with animations */}
        <div className={`self-center relative ${typing === 'A' ? '' : 'animate-bob-a'}`}>
          <AnimatedCharacter
            name="Jake"
            color="purple"
            isTyping={typing === 'A'}
            className="w-[160px] sm:w-[220px] md:w-[300px] lg:w-[400px] xl:w-[460px]"
          />
          <p className="text-center text-[12px] lg:text-[14px] font-bold text-purple-300/50 mt-1 tracking-wide">Jake</p>
        </div>
      </div>

      {/* RIGHT: Character + Messages */}
      <div className="flex flex-col items-end pr-0 lg:pr-2 xl:pr-6 w-[32%] lg:w-[30%]">
        {/* Messages from Ryan */}
        <div className="w-full hidden sm:flex flex-col gap-1.5 mb-2 min-h-[60px] justify-end pr-2">
          {rightMsgs.map((msg, i) => (
            <div key={`r-${posRef.current}-${i}`} className="flex justify-end" style={{ animation: 'msg-appear 8s ease both' }}>
              <div className="px-3 py-1.5 rounded-2xl rounded-br-sm text-[10px] lg:text-[11px] xl:text-[12px] leading-relaxed bg-blue-500/15 text-blue-200/80 border border-blue-500/10 max-w-[95%]">
                {msg.text}
              </div>
            </div>
          ))}
          {typing === 'B' && <TypingDots side="right" />}
        </div>

        {/* Thinking bubble */}
        <div className="w-full hidden sm:flex justify-center mb-1 h-5">
          {thinking && thinking.from === 'B' && (
            <div style={{ animation: 'msg-appear 2.5s ease both' }}>
              <span className="text-[9px] lg:text-[10px] text-white/40 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1">💭 {thinking.text}</span>
            </div>
          )}
        </div>

        {/* Character with animations */}
        <div className={`self-center relative ${typing === 'B' ? '' : 'animate-bob-b'}`}>
          <AnimatedCharacter
            name="Ryan"
            color="blue"
            isTyping={typing === 'B'}
            className="w-[160px] sm:w-[220px] md:w-[300px] lg:w-[400px] xl:w-[460px]"
          />
          <p className="text-center text-[12px] lg:text-[14px] font-bold text-blue-300/50 mt-1 tracking-wide">Ryan</p>
        </div>
      </div>
    </div>
  )
}

function TypingDots({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`flex ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
      <div className={`px-3 py-2 rounded-2xl flex gap-1 ${
        side === 'left' ? 'bg-purple-500/10 rounded-bl-sm' : 'bg-blue-500/10 rounded-br-sm'
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'typing-dot 1.2s ease-in-out infinite' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'typing-dot 1.2s ease-in-out infinite 0.2s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'typing-dot 1.2s ease-in-out infinite 0.4s' }} />
      </div>
    </div>
  )
}
