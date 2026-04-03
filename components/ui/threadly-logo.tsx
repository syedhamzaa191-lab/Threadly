'use client'

interface ThreadlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
}

const sizes = {
  sm: { box: 'w-14 h-14', text: 'text-[22px]' },
  md: { box: 'w-16 h-16', text: 'text-[24px]' },
  lg: { box: 'w-[72px] h-[72px]', text: 'text-[28px]' },
  xl: { box: 'w-20 h-20', text: 'text-[34px]' },
}

export function ThreadlyLogo({ size = 'md', showText = true }: ThreadlyLogoProps) {
  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div className={`${s.box} relative group`}>
        {/* Animated glow ring */}
        <div className="absolute inset-[-3px] rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-40 blur-[8px] transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />

        {/* Main container */}
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 animate-[gradient-shift_6s_ease_infinite]" style={{ backgroundSize: '200% 200%' }} />

          {/* Shine sweep animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shine_3s_ease-in-out_infinite]" />

          {/* Logo SVG */}
          <svg className="relative w-full h-full p-[22%]" viewBox="0 0 32 32" fill="none">
            {/* Message bubble outline */}
            <path
              d="M6 8C6 6.34 7.34 5 9 5H23C24.66 5 26 6.34 26 8V18C26 19.66 24.66 21 23 21H13L8 25V21H9C7.34 21 6 19.66 6 18V8Z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[draw_2s_ease_infinite]"
              strokeDasharray="80"
              strokeDashoffset="0"
            />
            {/* Thread lines inside bubble */}
            <line x1="11" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
              <animate attributeName="x2" values="11;21;21" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="11" y1="14" x2="18" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
              <animate attributeName="x2" values="11;18;18" dur="2s" begin="0.3s" repeatCount="indefinite" />
            </line>
            <line x1="11" y1="18" x2="15" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.4">
              <animate attributeName="x2" values="11;15;15" dur="2s" begin="0.6s" repeatCount="indefinite" />
            </line>
          </svg>
        </div>
      </div>

      {showText && (
        <div>
          <h1 className={`${s.text} font-black text-white tracking-tight leading-none`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {'Thread'.split('').map((char, i) => (
              <span key={i} className="inline-block animate-[charLoop_4s_ease_infinite]" style={{ animationDelay: `${i * 0.1}s` }}>{char}</span>
            ))}
            {'ly'.split('').map((char, i) => (
              <span key={`ly-${i}`} className="inline-block bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-[charLoop_4s_ease_infinite]" style={{ animationDelay: `${(6 + i) * 0.1}s` }}>{char}</span>
            ))}
          </h1>
          {size !== 'sm' && (
            <p className="text-[10px] text-white/20 font-semibold tracking-[0.2em] uppercase mt-1 animate-[pulse-soft_3s_infinite]">Team Communication</p>
          )}
        </div>
      )}
    </div>
  )
}
