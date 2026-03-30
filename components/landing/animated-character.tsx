'use client'

import { useMemo } from 'react'

interface CharacterProps {
  name: string
  color: 'purple' | 'blue'
  isTyping?: boolean
  className?: string
}

export function AnimatedCharacter({ name, color, className = '' }: CharacterProps) {
  if (color === 'purple') return <JakeCharacter className={className} />
  return <RyanCharacter className={className} />
}

/* ═══════════════════════════════════════════════════════════════
   JAKE – Man working on laptop, purple blazer, floating UI cards
   Matches reference: curly afro, glasses, purple jacket, desk
   ═══════════════════════════════════════════════════════════════ */
function JakeCharacter({ className }: { className: string }) {
  return (
    <div className={`relative select-none ${className}`}>
      <style>{`
        @keyframes j-type{0%,100%{transform:translateY(0) rotate(0deg)}30%{transform:translateY(-1.5px) rotate(-0.6deg)}60%{transform:translateY(0.5px) rotate(0.3deg)}}
        @keyframes j-f1{0%,100%{transform:translateY(0) translateX(0);opacity:.9}50%{transform:translateY(-8px) translateX(3px);opacity:1}}
        @keyframes j-f2{0%,100%{transform:translateY(0) translateX(0);opacity:.85}50%{transform:translateY(-10px) translateX(-4px);opacity:1}}
        @keyframes j-f3{0%,100%{transform:translateY(0);opacity:.8}50%{transform:translateY(-7px);opacity:1}}
        @keyframes j-f4{0%,100%{transform:translateY(0) translateX(0);opacity:.75}50%{transform:translateY(-6px) translateX(2px);opacity:.95}}
        @keyframes j-cur{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes j-br{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.008)}}
        @keyframes j-hl{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-2deg) translateY(-1.5px)}75%{transform:rotate(1.2deg) translateY(0.5px)}}
        @keyframes j-hr{0%,100%{transform:rotate(0deg)}30%{transform:rotate(1.5deg) translateY(-1.5px)}70%{transform:rotate(-1deg) translateY(0.5px)}}
        @keyframes j-bk{0%,42%,44%,87%,89%,100%{transform:scaleY(1)}43%,88%{transform:scaleY(.06)}}
        @keyframes j-d1{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.75;transform:scale(1.4)}}
        @keyframes j-d2{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}
        @keyframes j-sg{0%,100%{opacity:.1}50%{opacity:.18}}
        @keyframes j-scr{0%,100%{opacity:.5}50%{opacity:.8}}
        @keyframes j-fg1{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
        @keyframes j-fg2{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
        @keyframes j-elook{0%,25%{transform:translate(0,0)}30%,55%{transform:translate(1.5px,-.5px)}60%,85%{transform:translate(-1px,.5px)}90%,100%{transform:translate(0,0)}}
      `}</style>

      <svg viewBox="0 0 550 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id="j-skin" cx=".5" cy=".35" r=".65">
            <stop offset="0%" stopColor="#FDDCB5"/>
            <stop offset="60%" stopColor="#F0C49B"/>
            <stop offset="100%" stopColor="#D4956B"/>
          </radialGradient>
          <linearGradient id="j-jacket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6"/>
            <stop offset="50%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#5B21B6"/>
          </linearGradient>
          <linearGradient id="j-jacket-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D28D9"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>
          <linearGradient id="j-hair" x1=".3" y1="0" x2=".7" y2="1">
            <stop offset="0%" stopColor="#2d2b55"/>
            <stop offset="100%" stopColor="#13112b"/>
          </linearGradient>
          <linearGradient id="j-laptop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5E7EB"/>
            <stop offset="100%" stopColor="#D1D5DB"/>
          </linearGradient>
          <filter id="j-shd"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity=".15"/></filter>
          <filter id="j-glow"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>

        {/* ── FLOATING UI ELEMENTS ── */}
        {/* Card 1: top right - mini browser */}
        <g style={{animation:'j-f1 3.8s ease-in-out infinite'}}>
          <rect x="365" y="30" width="105" height="50" rx="6" fill="#1E1B4B" opacity=".85" stroke="#7C3AED" strokeWidth=".5" strokeOpacity=".3"/>
          {/* Browser dots */}
          <circle cx="375" cy="39" r="2" fill="#EF4444" opacity=".7"/>
          <circle cx="382" cy="39" r="2" fill="#F59E0B" opacity=".7"/>
          <circle cx="389" cy="39" r="2" fill="#22C55E" opacity=".7"/>
          <rect x="372" y="46" width="40" height="3" rx="1" fill="#A78BFA" opacity=".6"/>
          <rect x="372" y="52" width="55" height="3" rx="1" fill="#60A5FA" opacity=".45"/>
          <rect x="372" y="58" width="30" height="3" rx="1" fill="#34D399" opacity=".5"/>
          <rect x="372" y="64" width="48" height="3" rx="1" fill="#C4B5FD" opacity=".35"/>
          <rect x="415" y="46" width="22" height="3" rx="1" fill="#FBBF24" opacity=".4"/>
        </g>

        {/* Card 2: mid right - data/chart */}
        <g style={{animation:'j-f2 4.2s ease-in-out infinite .6s'}}>
          <rect x="385" y="100" width="115" height="55" rx="6" fill="#1E1B4B" opacity=".8" stroke="#7C3AED" strokeWidth=".5" strokeOpacity=".25"/>
          {/* Mini bar chart */}
          <rect x="395" y="132" width="8" height="14" rx="2" fill="#A78BFA" opacity=".6"/>
          <rect x="407" y="125" width="8" height="21" rx="2" fill="#8B5CF6" opacity=".65"/>
          <rect x="419" y="118" width="8" height="28" rx="2" fill="#7C3AED" opacity=".7"/>
          <rect x="431" y="128" width="8" height="18" rx="2" fill="#A78BFA" opacity=".55"/>
          <rect x="443" y="122" width="8" height="24" rx="2" fill="#8B5CF6" opacity=".6"/>
          {/* Labels */}
          <rect x="395" y="107" width="50" height="3" rx="1" fill="#C4B5FD" opacity=".5"/>
          <rect x="395" y="113" width="35" height="2.5" rx="1" fill="#DDD6FE" opacity=".35"/>
          {/* Trend line */}
          <polyline points="399,130 411,122 423,116 435,126 447,119" stroke="#22C55E" strokeWidth="1.5" fill="none" opacity=".5" strokeLinecap="round"/>
        </g>

        {/* Card 3: lower right - code snippet */}
        <g style={{animation:'j-f3 3.2s ease-in-out infinite 1.2s'}}>
          <rect x="370" y="172" width="95" height="40" rx="5" fill="#1E1B4B" opacity=".75" stroke="#7C3AED" strokeWidth=".5" strokeOpacity=".2"/>
          <rect x="378" y="180" width="12" height="2.5" rx="1" fill="#C084FC" opacity=".6"/>
          <rect x="393" y="180" width="35" height="2.5" rx="1" fill="#60A5FA" opacity=".5"/>
          <rect x="384" y="186" width="45" height="2.5" rx="1" fill="#34D399" opacity=".5"/>
          <rect x="384" y="192" width="28" height="2.5" rx="1" fill="#FBBF24" opacity=".4"/>
          <rect x="378" y="198" width="18" height="2.5" rx="1" fill="#C084FC" opacity=".5"/>
          <rect x="399" y="198" width="38" height="2.5" rx="1" fill="#F87171" opacity=".4"/>
        </g>

        {/* Card 4: small notification */}
        <g style={{animation:'j-f4 3.6s ease-in-out infinite .3s'}}>
          <rect x="355" y="225" width="70" height="20" rx="10" fill="#7C3AED" opacity=".25"/>
          <circle cx="368" cy="235" r="4" fill="#22C55E" opacity=".6"/>
          <rect x="376" y="233" width="35" height="3" rx="1" fill="#C4B5FD" opacity=".5"/>
        </g>

        {/* Floating dots */}
        <circle cx="358" cy="55" r="3.5" fill="#A78BFA" opacity=".45" style={{animation:'j-d1 2.8s ease-in-out infinite'}}/>
        <circle cx="490" cy="80" r="3" fill="#7C3AED" opacity=".35" style={{animation:'j-d2 3.3s ease-in-out infinite .8s'}}/>
        <circle cx="365" cy="155" r="2.5" fill="#C4B5FD" opacity=".4" style={{animation:'j-d1 3s ease-in-out infinite .5s'}}/>
        <circle cx="480" cy="145" r="2" fill="#DDD6FE" opacity=".35" style={{animation:'j-d2 3.5s ease-in-out infinite 1.5s'}}/>
        <circle cx="505" cy="50" r="2.5" fill="#8B5CF6" opacity=".3" style={{animation:'j-d1 4s ease-in-out infinite 1s'}}/>
        <circle cx="360" cy="260" r="2" fill="#A78BFA" opacity=".3" style={{animation:'j-d2 2.5s ease-in-out infinite .2s'}}/>
        {/* Connecting lines between dots (subtle) */}
        <line x1="358" y1="55" x2="365" y2="30" stroke="#A78BFA" strokeWidth=".5" opacity=".15" strokeDasharray="3 3"/>
        <line x1="490" y1="80" x2="500" y2="100" stroke="#7C3AED" strokeWidth=".5" opacity=".12" strokeDasharray="3 3"/>

        {/* ── DESK ── */}
        <g>
          <rect x="55" y="282" width="300" height="4" rx="2" fill="#94A3B8" opacity=".6"/>
          {/* Desk surface highlight */}
          <rect x="58" y="282" width="294" height="1.5" rx="1" fill="white" opacity=".08"/>
          {/* Desk legs */}
          <line x1="85" y1="286" x2="78" y2="355" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/>
          <line x1="325" y1="286" x2="332" y2="355" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/>
          {/* Desk cross bar */}
          <line x1="82" y1="330" x2="329" y2="330" stroke="#94A3B8" strokeWidth="1.5" opacity=".25"/>
          {/* Coffee mug on desk */}
          <rect x="80" y="268" width="16" height="14" rx="3" fill="#475569" opacity=".5"/>
          <path d="M96 273 Q102 273 102 278 Q102 283 96 283" stroke="#475569" strokeWidth="1.5" fill="none" opacity=".4"/>
          {/* Steam from coffee */}
          <path d="M86 266 Q84 260 87 255" stroke="white" strokeWidth=".8" fill="none" opacity=".15" style={{animation:'j-fg1 3s ease-in-out infinite'}}/>
          <path d="M90 267 Q92 260 89 254" stroke="white" strokeWidth=".8" fill="none" opacity=".12" style={{animation:'j-fg2 3.5s ease-in-out infinite .5s'}}/>
        </g>

        {/* ── BODY GROUP (breathing) ── */}
        <g style={{animation:'j-br 4s ease-in-out infinite',transformOrigin:'210px 282px'}}>

          {/* ── TORSO / JACKET (behind laptop) ── */}
          <g filter="url(#j-shd)">
            {/* Back shoulder area */}
            <path d="M142 180 Q138 162 158 152 L262 152 Q282 162 278 180 L284 280 L136 280Z" fill="url(#j-jacket)"/>
            {/* Jacket left panel */}
            <path d="M142 180 L136 280 L210 280 L210 175Z" fill="url(#j-jacket-side)" opacity=".3"/>
            {/* Collar */}
            <path d="M176 152 L200 172 L176 152" fill="none"/>
            <path d="M244 152 L220 172 L244 152" fill="none"/>
            {/* Lapels */}
            <path d="M176 152 L200 178 L188 182 L170 162Z" fill="#6D28D9" opacity=".6"/>
            <path d="M244 152 L220 178 L232 182 L250 162Z" fill="#6D28D9" opacity=".6"/>
            {/* Shirt underneath */}
            <path d="M188 155 L210 180 L232 155" fill="#EDE9FE" opacity=".5"/>
            <path d="M195 155 L210 172 L225 155" fill="white" opacity=".15"/>
            {/* Jacket button */}
            <circle cx="210" cy="210" r="2.5" fill="#5B21B6" opacity=".5"/>
            {/* Jacket pocket */}
            <path d="M240 220 L258 220 L258 236 Q258 240 254 240 L244 240 Q240 240 240 236Z" fill="#5B21B6" opacity=".25"/>
            <line x1="240" y1="220" x2="258" y2="220" stroke="#6D28D9" strokeWidth="1" opacity=".4"/>
            {/* Jacket fold lines */}
            <path d="M155 185 Q150 230 145 278" stroke="#6D28D9" strokeWidth="1" fill="none" opacity=".35"/>
            <path d="M265 185 Q270 230 275 278" stroke="#9333EA" strokeWidth=".8" fill="none" opacity=".2"/>
            <path d="M195 200 Q192 240 190 275" stroke="#6D28D9" strokeWidth=".6" fill="none" opacity=".2"/>
            {/* Shoulder seam */}
            <path d="M158 155 Q148 160 142 180" stroke="#9333EA" strokeWidth=".8" fill="none" opacity=".25"/>
            <path d="M262 155 Q272 160 278 180" stroke="#9333EA" strokeWidth=".8" fill="none" opacity=".25"/>
          </g>

          {/* ── LAPTOP BASE (behind hands) ── */}
          <g>
            {/* Laptop hinge */}
            <rect x="155" y="278" width="110" height="3" rx="1.5" fill="#D1D5DB"/>
            {/* Laptop base */}
            <path d="M138 282 L282 282 L290 292 L130 292Z" fill="url(#j-laptop)"/>
            {/* Keyboard area */}
            <rect x="155" y="283" width="110" height="6" rx="1" fill="#C9CDD3" opacity=".6"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i=>(
              <rect key={`k${i}`} x={158+i*10.5} y={284} width="8" height="2" rx=".5" fill="#9CA3AF" opacity=".45"
                style={i%3===0?{animation:`j-fg1 .${3+i%4}s ease-in-out ${i*.06}s infinite`}:undefined}/>
            ))}
            {/* Trackpad */}
            <rect x="183" y="288" width="54" height="2.5" rx="1" fill="#9CA3AF" opacity=".2"/>
          </g>

          {/* ── LEFT ARM ── */}
          <g style={{animation:'j-hl .65s ease-in-out infinite',transformOrigin:'148px 185px'}}>
            {/* Upper arm (jacket sleeve) */}
            <path d="M142 180 Q118 225 130 265" stroke="#7C3AED" strokeWidth="26" strokeLinecap="round" fill="none"/>
            <path d="M142 180 Q118 225 130 265" stroke="#5B21B6" strokeWidth="26" strokeLinecap="round" fill="none" opacity=".2"/>
            {/* Sleeve cuff */}
            <ellipse cx="131" cy="258" rx="14" ry="5" fill="#5B21B6" opacity=".4"/>
            {/* Forearm/wrist skin */}
            <path d="M130 258 Q135 272 155 278" stroke="#F0C49B" strokeWidth="13" strokeLinecap="round" fill="none"/>
            {/* Hand */}
            <ellipse cx="160" cy="279" rx="11" ry="5.5" fill="#F0C49B"/>
            {/* Fingers */}
            <rect x="150" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'j-fg1 .25s ease-in-out infinite'}}/>
            <rect x="155" y="275" width="3.5" height="8" rx="1.8" fill="#F0C49B" style={{animation:'j-fg2 .3s ease-in-out infinite .05s'}}/>
            <rect x="160" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'j-fg1 .22s ease-in-out infinite .1s'}}/>
            <rect x="165" y="276.5" width="3.5" height="6.5" rx="1.8" fill="#F0C49B" style={{animation:'j-fg2 .28s ease-in-out infinite .08s'}}/>
            {/* Wrist shadow */}
            <ellipse cx="140" cy="260" rx="8" ry="3" fill="#D4956B" opacity=".15"/>
          </g>

          {/* ── RIGHT ARM ── */}
          <g style={{animation:'j-hr .6s ease-in-out infinite',transformOrigin:'272px 185px'}}>
            <path d="M278 180 Q302 225 290 265" stroke="#7C3AED" strokeWidth="26" strokeLinecap="round" fill="none"/>
            <path d="M278 180 Q302 225 290 265" stroke="#5B21B6" strokeWidth="26" strokeLinecap="round" fill="none" opacity=".2"/>
            <ellipse cx="289" cy="258" rx="14" ry="5" fill="#5B21B6" opacity=".4"/>
            <path d="M290 258 Q285 272 265 278" stroke="#F0C49B" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <ellipse cx="260" cy="279" rx="11" ry="5.5" fill="#F0C49B"/>
            <rect x="250" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'j-fg2 .27s ease-in-out infinite'}}/>
            <rect x="255" y="275" width="3.5" height="8" rx="1.8" fill="#F0C49B" style={{animation:'j-fg1 .32s ease-in-out infinite .06s'}}/>
            <rect x="260" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'j-fg2 .24s ease-in-out infinite .1s'}}/>
            <rect x="265" y="276.5" width="3.5" height="6.5" rx="1.8" fill="#F0C49B" style={{animation:'j-fg1 .35s ease-in-out infinite .04s'}}/>
          </g>

          {/* ── NECK ── */}
          <rect x="201" y="120" width="18" height="35" rx="7" fill="url(#j-skin)"/>
          <ellipse cx="210" cy="128" rx="11" ry="4" fill="#D4956B" opacity=".15"/>
          {/* Neck shadow from head */}
          <ellipse cx="210" cy="122" rx="16" ry="5" fill="#D4956B" opacity=".1"/>

          {/* ── HEAD (typing nod) ── */}
          <g style={{animation:'j-type 2.5s cubic-bezier(.4,0,.6,1) infinite',transformOrigin:'210px 120px'}}>
            {/* Head shape */}
            <ellipse cx="210" cy="82" rx="46" ry="50" fill="url(#j-skin)"/>
            {/* Forehead highlight */}
            <ellipse cx="210" cy="62" rx="25" ry="12" fill="white" opacity=".04"/>
            {/* Jaw shadow */}
            <path d="M174 102 Q210 125 246 102" fill="#D4956B" opacity=".1"/>
            {/* Chin */}
            <ellipse cx="210" cy="128" rx="12" ry="5" fill="#F0C49B"/>

            {/* ── HAIR (curly/afro with volume) ── */}
            <g>
              <ellipse cx="210" cy="48" rx="52" ry="40" fill="url(#j-hair)"/>
              {/* Curly texture bumps */}
              <circle cx="178" cy="25" r="16" fill="#13112b"/>
              <circle cx="200" cy="16" r="18" fill="#13112b"/>
              <circle cx="225" cy="18" r="17" fill="#13112b"/>
              <circle cx="246" cy="28" r="15" fill="#13112b"/>
              <circle cx="168" cy="38" r="14" fill="#13112b"/>
              <circle cx="252" cy="42" r="13" fill="#13112b"/>
              <circle cx="256" cy="58" r="10" fill="#13112b"/>
              <circle cx="163" cy="55" r="11" fill="#13112b"/>
              {/* Inner curl highlights */}
              <circle cx="190" cy="20" r="10" fill="#2d2b55" opacity=".35"/>
              <circle cx="215" cy="14" r="11" fill="#2d2b55" opacity=".28"/>
              <circle cx="238" cy="22" r="10" fill="#2d2b55" opacity=".3"/>
              <circle cx="175" cy="32" r="8" fill="#2d2b55" opacity=".25"/>
              <circle cx="248" cy="35" r="8" fill="#2d2b55" opacity=".25"/>
              {/* Subtle shine on hair */}
              <ellipse cx="205" cy="22" rx="16" ry="6" fill="white" opacity=".03" transform="rotate(-10 205 22)"/>
              <ellipse cx="230" cy="18" rx="10" ry="4" fill="white" opacity=".025"/>
              {/* Side hair meeting face */}
              <path d="M164 60 Q160 75 162 90" fill="#13112b"/>
              <path d="M256 60 Q260 75 258 90" fill="#13112b"/>
            </g>

            {/* ── EARS ── */}
            <ellipse cx="164" cy="86" rx="7" ry="11" fill="#F0C49B"/>
            <ellipse cx="164" cy="86" rx="4" ry="7" fill="#D4956B" opacity=".2"/>
            <ellipse cx="256" cy="86" rx="7" ry="11" fill="#F0C49B"/>
            <ellipse cx="256" cy="86" rx="4" ry="7" fill="#D4956B" opacity=".2"/>

            {/* ── GLASSES ── */}
            <g>
              {/* Left lens */}
              <rect x="182" y="68" width="26" height="22" rx="5" fill="none" stroke="#334155" strokeWidth="2.8"/>
              <rect x="183" y="69" width="24" height="20" rx="4" fill="white" opacity=".06"/>
              {/* Lens glare */}
              <rect x="186" y="72" width="8" height="2" rx="1" fill="white" opacity=".08" transform="rotate(-15 190 73)"/>
              {/* Right lens */}
              <rect x="214" y="68" width="26" height="22" rx="5" fill="none" stroke="#334155" strokeWidth="2.8"/>
              <rect x="215" y="69" width="24" height="20" rx="4" fill="white" opacity=".06"/>
              <rect x="218" y="72" width="8" height="2" rx="1" fill="white" opacity=".08" transform="rotate(-15 222 73)"/>
              {/* Bridge */}
              <path d="M208 77 Q211 74 214 77" stroke="#334155" strokeWidth="2.2" fill="none"/>
              {/* Temple arms */}
              <path d="M182 75 L166 80" stroke="#334155" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M240 75 L254 80" stroke="#334155" strokeWidth="2.2" strokeLinecap="round"/>
            </g>

            {/* ── EYES ── */}
            <g>
              {/* Left eye */}
              <g style={{animation:'j-bk 4.2s ease-in-out infinite',transformOrigin:'195px 79px'}}>
                <g style={{animation:'j-elook 7s ease-in-out infinite'}}>
                  <ellipse cx="195" cy="79" rx="6" ry="6" fill="#1a1a2e"/>
                  <circle cx="193" cy="77" r="2" fill="white" opacity=".85"/>
                  <circle cx="197" cy="81" r=".8" fill="white" opacity=".4"/>
                </g>
              </g>
              {/* Right eye */}
              <g style={{animation:'j-bk 4.2s ease-in-out infinite .12s',transformOrigin:'227px 79px'}}>
                <g style={{animation:'j-elook 7s ease-in-out infinite'}}>
                  <ellipse cx="227" cy="79" rx="6" ry="6" fill="#1a1a2e"/>
                  <circle cx="225" cy="77" r="2" fill="white" opacity=".85"/>
                  <circle cx="229" cy="81" r=".8" fill="white" opacity=".4"/>
                </g>
              </g>
            </g>

            {/* ── EYEBROWS ── */}
            <path d="M184 65 Q194 60 207 64" stroke="#13112b" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M215 64 Q228 60 238 65" stroke="#13112b" strokeWidth="2.2" strokeLinecap="round" fill="none"/>

            {/* ── NOSE ── */}
            <path d="M208 90 Q210 98 214 95" stroke="#D4956B" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <circle cx="207" cy="97" r="1.3" fill="#D4956B" opacity=".15"/>
            <circle cx="215" cy="96" r="1.3" fill="#D4956B" opacity=".15"/>

            {/* ── MOUTH ── */}
            <path d="M200 108 Q210 114 220 108" stroke="#C96B6B" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            {/* Lower lip hint */}
            <path d="M203 110 Q210 116 217 110" stroke="#C96B6B" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".4"/>

            {/* ── CHEEK BLUSH ── */}
            <ellipse cx="178" cy="98" rx="8" ry="4" fill="#F4A0A0" opacity=".08"/>
            <ellipse cx="242" cy="98" rx="8" ry="4" fill="#F4A0A0" opacity=".08"/>

            {/* ── SCREEN GLOW ON FACE ── */}
            <ellipse cx="210" cy="100" rx="30" ry="20" fill="#A78BFA" opacity=".04"/>
          </g>

          {/* ── LAPTOP LID (in front of everything, back facing viewer) ── */}
          <g>
            <rect x="145" y="198" width="130" height="82" rx="5" fill="#E5E7EB"/>
            <rect x="150" y="203" width="120" height="72" rx="3" fill="#D4D8DE"/>
            {/* Logo mark */}
            <circle cx="210" cy="238" r="10" fill="#C0C5CC" opacity=".6"/>
            <circle cx="210" cy="238" r="7" fill="#B4BAC2" opacity=".4"/>
            {/* Lid highlight */}
            <line x1="150" y1="203" x2="270" y2="203" stroke="white" strokeWidth="1" opacity=".15"/>
            <line x1="152" y1="275" x2="268" y2="275" stroke="#C0C5CC" strokeWidth=".5" opacity=".3"/>
            {/* Screen glow leaking from top */}
            <rect x="150" y="197" width="120" height="3" rx="1" fill="#7C3AED" opacity=".15"/>
            <ellipse cx="210" cy="196" rx="50" ry="8" fill="#7C3AED" filter="url(#j-glow)" opacity=".08" style={{animation:'j-sg 3s ease-in-out infinite'}}/>
          </g>
        </g>

        {/* ── CHAIR SEAT (behind desk) ── */}
        <rect x="125" y="280" width="170" height="10" rx="4" fill="#475569" opacity=".2"/>
      </svg>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   RYAN – Person at desk with laptop, blue hoodie, chat bubbles
   Different from Jake: straight hair, hoodie, headphones, chat UI
   Both on laptops = communicating with each other
   ═══════════════════════════════════════════════════════════════ */
function RyanCharacter({ className }: { className: string }) {
  return (
    <div className={`relative select-none ${className}`}>
      <style>{`
        @keyframes r-type{0%,100%{transform:translateY(0) rotate(0deg)}30%{transform:translateY(-1.5px) rotate(.5deg)}60%{transform:translateY(.5px) rotate(-.3deg)}}
        @keyframes r-f1{0%,100%{transform:translateY(0) translateX(0);opacity:.9}50%{transform:translateY(-7px) translateX(-3px);opacity:1}}
        @keyframes r-f2{0%,100%{transform:translateY(0) translateX(0);opacity:.85}50%{transform:translateY(-9px) translateX(2px);opacity:1}}
        @keyframes r-f3{0%,100%{transform:translateY(0);opacity:.8}50%{transform:translateY(-6px);opacity:1}}
        @keyframes r-cur{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes r-br{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.008)}}
        @keyframes r-hl{0%,100%{transform:rotate(0deg)}25%{transform:rotate(1.8deg) translateY(-1px)}75%{transform:rotate(-1deg) translateY(.5px)}}
        @keyframes r-hr{0%,100%{transform:rotate(0deg)}30%{transform:rotate(-1.5deg) translateY(-1.5px)}70%{transform:rotate(.8deg) translateY(.5px)}}
        @keyframes r-bk{0%,44%,46%,90%,92%,100%{transform:scaleY(1)}45%,91%{transform:scaleY(.06)}}
        @keyframes r-d1{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.7;transform:scale(1.35)}}
        @keyframes r-d2{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.6;transform:scale(1.25)}}
        @keyframes r-sg{0%,100%{opacity:.1}50%{opacity:.18}}
        @keyframes r-scr{0%,100%{opacity:.5}50%{opacity:.8}}
        @keyframes r-fg1{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
        @keyframes r-fg2{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
        @keyframes r-elook{0%,25%{transform:translate(0,0)}30%,55%{transform:translate(-1.5px,-.5px)}60%,85%{transform:translate(1px,.3px)}90%,100%{transform:translate(0,0)}}
        @keyframes r-notif{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.08);opacity:1}}
      `}</style>

      <svg viewBox="0 0 550 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id="r-skin" cx=".5" cy=".35" r=".65">
            <stop offset="0%" stopColor="#FDDCB5"/>
            <stop offset="60%" stopColor="#F0C49B"/>
            <stop offset="100%" stopColor="#D4956B"/>
          </radialGradient>
          <linearGradient id="r-hoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA"/>
            <stop offset="50%" stopColor="#3B82F6"/>
            <stop offset="100%" stopColor="#2563EB"/>
          </linearGradient>
          <linearGradient id="r-hoodie-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1D4ED8"/>
            <stop offset="100%" stopColor="#3B82F6"/>
          </linearGradient>
          <linearGradient id="r-hair" x1=".3" y1="0" x2=".7" y2="1">
            <stop offset="0%" stopColor="#44403C"/>
            <stop offset="100%" stopColor="#1C1917"/>
          </linearGradient>
          <linearGradient id="r-laptop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5E7EB"/>
            <stop offset="100%" stopColor="#D1D5DB"/>
          </linearGradient>
          <filter id="r-shd"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity=".15"/></filter>
          <filter id="r-glow"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>

        {/* ── FLOATING CHAT / UI ELEMENTS (left side - mirrored from Jake) ── */}
        {/* Chat bubble 1 - incoming message */}
        <g style={{animation:'r-f1 3.6s ease-in-out infinite'}}>
          <rect x="20" y="45" width="100" height="35" rx="8" fill="#1E3A5F" opacity=".8" stroke="#3B82F6" strokeWidth=".5" strokeOpacity=".3"/>
          <circle cx="35" cy="56" r="6" fill="#7C3AED" opacity=".5"/>
          <text x="36" y="58.5" fill="white" fontSize="5" textAnchor="middle" fontFamily="sans-serif" opacity=".7">J</text>
          <rect x="46" y="52" width="45" height="3" rx="1" fill="#A78BFA" opacity=".5"/>
          <rect x="46" y="58" width="60" height="3" rx="1" fill="#C4B5FD" opacity=".35"/>
          <rect x="46" y="64" width="35" height="3" rx="1" fill="#DDD6FE" opacity=".3"/>
          {/* Typing indicator */}
          <circle cx="35" cy="72" r="1.5" fill="#60A5FA" opacity=".5"/>
          <circle cx="40" cy="72" r="1.5" fill="#60A5FA" opacity=".4"/>
          <circle cx="45" cy="72" r="1.5" fill="#60A5FA" opacity=".3"/>
        </g>

        {/* Chat bubble 2 - sent message */}
        <g style={{animation:'r-f2 4s ease-in-out infinite .5s'}}>
          <rect x="30" y="100" width="110" height="30" rx="8" fill="#1E3A5F" opacity=".75" stroke="#3B82F6" strokeWidth=".5" strokeOpacity=".25"/>
          <rect x="38" y="108" width="55" height="3" rx="1" fill="#60A5FA" opacity=".5"/>
          <rect x="38" y="114" width="75" height="3" rx="1" fill="#93C5FD" opacity=".4"/>
          <rect x="38" y="120" width="40" height="3" rx="1" fill="#BFDBFE" opacity=".35"/>
          {/* Read receipt */}
          <text x="120" y="125" fill="#22C55E" fontSize="5" fontFamily="sans-serif" opacity=".5">✓✓</text>
        </g>

        {/* Chat bubble 3 - notification */}
        <g style={{animation:'r-f3 3.4s ease-in-out infinite 1s'}}>
          <rect x="15" y="148" width="90" height="22" rx="11" fill="#3B82F6" opacity=".2"/>
          <circle cx="30" cy="159" r="5" fill="#22C55E" opacity=".5" style={{animation:'r-notif 2s ease-in-out infinite'}}/>
          <rect x="40" y="156" width="50" height="3" rx="1" fill="#93C5FD" opacity=".45"/>
        </g>

        {/* Chat bubble 4 - mini thread */}
        <g style={{animation:'r-f1 3.8s ease-in-out infinite .8s'}}>
          <rect x="35" y="185" width="85" height="40" rx="6" fill="#1E3A5F" opacity=".7" stroke="#3B82F6" strokeWidth=".5" strokeOpacity=".2"/>
          <rect x="42" y="192" width="40" height="2.5" rx="1" fill="#60A5FA" opacity=".45"/>
          <rect x="42" y="198" width="55" height="2.5" rx="1" fill="#93C5FD" opacity=".35"/>
          <line x1="42" y1="205" x2="108" y2="205" stroke="#334155" strokeWidth=".5" opacity=".3"/>
          <rect x="42" y="210" width="30" height="2.5" rx="1" fill="#A78BFA" opacity=".35"/>
          <rect x="42" y="216" width="48" height="2.5" rx="1" fill="#C4B5FD" opacity=".3"/>
        </g>

        {/* Floating dots */}
        <circle cx="130" cy="60" r="3" fill="#60A5FA" opacity=".4" style={{animation:'r-d1 2.6s ease-in-out infinite'}}/>
        <circle cx="8" cy="130" r="2.5" fill="#3B82F6" opacity=".35" style={{animation:'r-d2 3.2s ease-in-out infinite .7s'}}/>
        <circle cx="125" cy="175" r="2" fill="#93C5FD" opacity=".35" style={{animation:'r-d1 3s ease-in-out infinite .4s'}}/>
        <circle cx="20" cy="230" r="2.5" fill="#60A5FA" opacity=".3" style={{animation:'r-d2 3.4s ease-in-out infinite 1.2s'}}/>
        <circle cx="5" cy="75" r="2" fill="#BFDBFE" opacity=".3" style={{animation:'r-d1 3.8s ease-in-out infinite .9s'}}/>

        {/* ── DESK ── */}
        <g>
          <rect x="120" y="282" width="300" height="4" rx="2" fill="#94A3B8" opacity=".6"/>
          <rect x="123" y="282" width="294" height="1.5" rx="1" fill="white" opacity=".08"/>
          <line x1="150" y1="286" x2="143" y2="355" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/>
          <line x1="390" y1="286" x2="397" y2="355" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/>
          <line x1="147" y1="330" x2="394" y2="330" stroke="#94A3B8" strokeWidth="1.5" opacity=".25"/>
          {/* Plant on desk */}
          <rect x="375" y="262" width="14" height="20" rx="3" fill="#475569" opacity=".4"/>
          <circle cx="382" cy="258" r="8" fill="#34D399" opacity=".25"/>
          <circle cx="378" cy="254" r="5" fill="#34D399" opacity=".2"/>
          <circle cx="386" cy="255" r="5" fill="#22C55E" opacity=".18"/>
        </g>

        {/* ── BODY GROUP (breathing) ── */}
        <g style={{animation:'r-br 4s ease-in-out infinite',transformOrigin:'270px 282px'}}>

          {/* ── TORSO / HOODIE (behind laptop) ── */}
          <g filter="url(#r-shd)">
            <path d="M202 180 Q198 162 218 152 L322 152 Q342 162 338 180 L344 280 L196 280Z" fill="url(#r-hoodie)"/>
            <path d="M202 180 L196 280 L270 280 L270 175Z" fill="url(#r-hoodie-side)" opacity=".25"/>
            {/* Hood shape behind neck */}
            <path d="M232 150 Q240 138 270 135 Q300 138 308 150" fill="#2563EB" opacity=".4"/>
            <path d="M235 150 Q242 140 270 137 Q298 140 305 150" fill="#3B82F6" opacity=".2"/>
            {/* Hoodie front pocket (kangaroo pocket) */}
            <path d="M230 225 Q230 218 240 218 L300 218 Q310 218 310 225 L310 255 Q310 260 300 260 L240 260 Q230 260 230 255Z"
              fill="#2563EB" opacity=".2"/>
            <line x1="230" y1="218" x2="310" y2="218" stroke="#1D4ED8" strokeWidth=".8" opacity=".3"/>
            {/* Hoodie drawstrings */}
            <line x1="260" y1="155" x2="258" y2="175" stroke="white" strokeWidth="1" opacity=".15"/>
            <line x1="280" y1="155" x2="282" y2="175" stroke="white" strokeWidth="1" opacity=".15"/>
            <circle cx="258" cy="176" r="1.5" fill="white" opacity=".12"/>
            <circle cx="282" cy="176" r="1.5" fill="white" opacity=".12"/>
            {/* Center zipper line */}
            <line x1="270" y1="155" x2="270" y2="278" stroke="#1D4ED8" strokeWidth="1" opacity=".2"/>
            {/* Fold lines */}
            <path d="M212 185 Q208 230 205 278" stroke="#1D4ED8" strokeWidth="1" fill="none" opacity=".3"/>
            <path d="M328 185 Q332 230 335 278" stroke="#60A5FA" strokeWidth=".8" fill="none" opacity=".15"/>
            <path d="M245 195 Q242 240 240 275" stroke="#1D4ED8" strokeWidth=".5" fill="none" opacity=".15"/>
            {/* Shoulder seams */}
            <path d="M218 155 Q208 160 202 180" stroke="#60A5FA" strokeWidth=".8" fill="none" opacity=".2"/>
            <path d="M322 155 Q332 160 338 180" stroke="#60A5FA" strokeWidth=".8" fill="none" opacity=".2"/>
          </g>

          {/* ── LAPTOP BASE (behind hands) ── */}
          <g>
            {/* Laptop hinge */}
            <rect x="215" y="278" width="110" height="3" rx="1.5" fill="#D1D5DB"/>
            {/* Laptop base */}
            <path d="M198 282 L342 282 L350 292 L190 292Z" fill="url(#r-laptop)"/>
            {/* Keyboard area */}
            <rect x="215" y="283" width="110" height="6" rx="1" fill="#C9CDD3" opacity=".6"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i=>(
              <rect key={`rk${i}`} x={218+i*10.5} y={284} width="8" height="2" rx=".5" fill="#9CA3AF" opacity=".45"
                style={i%3===1?{animation:`r-fg1 .${3+i%4}s ease-in-out ${i*.06}s infinite`}:undefined}/>
            ))}
            <rect x="243" y="288" width="54" height="2.5" rx="1" fill="#9CA3AF" opacity=".2"/>
          </g>

          {/* ── LEFT ARM ── */}
          <g style={{animation:'r-hl .6s ease-in-out infinite',transformOrigin:'208px 185px'}}>
            <path d="M202 180 Q178 225 190 265" stroke="#3B82F6" strokeWidth="26" strokeLinecap="round" fill="none"/>
            <path d="M202 180 Q178 225 190 265" stroke="#2563EB" strokeWidth="26" strokeLinecap="round" fill="none" opacity=".2"/>
            <ellipse cx="191" cy="258" rx="14" ry="5" fill="#1D4ED8" opacity=".3"/>
            <path d="M190 258 Q195 272 215 278" stroke="#F0C49B" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <ellipse cx="220" cy="279" rx="11" ry="5.5" fill="#F0C49B"/>
            <rect x="210" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'r-fg1 .25s ease-in-out infinite'}}/>
            <rect x="215" y="275" width="3.5" height="8" rx="1.8" fill="#F0C49B" style={{animation:'r-fg2 .3s ease-in-out infinite .05s'}}/>
            <rect x="220" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'r-fg1 .22s ease-in-out infinite .1s'}}/>
            <rect x="225" y="276.5" width="3.5" height="6.5" rx="1.8" fill="#F0C49B" style={{animation:'r-fg2 .28s ease-in-out infinite .08s'}}/>
          </g>

          {/* ── RIGHT ARM ── */}
          <g style={{animation:'r-hr .55s ease-in-out infinite',transformOrigin:'332px 185px'}}>
            <path d="M338 180 Q362 225 350 265" stroke="#3B82F6" strokeWidth="26" strokeLinecap="round" fill="none"/>
            <path d="M338 180 Q362 225 350 265" stroke="#2563EB" strokeWidth="26" strokeLinecap="round" fill="none" opacity=".2"/>
            <ellipse cx="349" cy="258" rx="14" ry="5" fill="#1D4ED8" opacity=".3"/>
            <path d="M350 258 Q345 272 325 278" stroke="#F0C49B" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <ellipse cx="320" cy="279" rx="11" ry="5.5" fill="#F0C49B"/>
            <rect x="310" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'r-fg2 .27s ease-in-out infinite'}}/>
            <rect x="315" y="275" width="3.5" height="8" rx="1.8" fill="#F0C49B" style={{animation:'r-fg1 .32s ease-in-out infinite .06s'}}/>
            <rect x="320" y="276" width="3.5" height="7" rx="1.8" fill="#F0C49B" style={{animation:'r-fg2 .24s ease-in-out infinite .1s'}}/>
            <rect x="325" y="276.5" width="3.5" height="6.5" rx="1.8" fill="#F0C49B" style={{animation:'r-fg1 .35s ease-in-out infinite .04s'}}/>
          </g>

          {/* ── NECK ── */}
          <rect x="261" y="120" width="18" height="35" rx="7" fill="url(#r-skin)"/>
          <ellipse cx="270" cy="128" rx="11" ry="4" fill="#D4956B" opacity=".15"/>

          {/* ── HEAD (typing nod) ── */}
          <g style={{animation:'r-type 2.8s cubic-bezier(.4,0,.6,1) infinite',transformOrigin:'270px 120px'}}>
            <ellipse cx="270" cy="82" rx="46" ry="50" fill="url(#r-skin)"/>
            <ellipse cx="270" cy="62" rx="25" ry="12" fill="white" opacity=".04"/>
            <path d="M234 102 Q270 125 306 102" fill="#D4956B" opacity=".1"/>
            <ellipse cx="270" cy="128" rx="12" ry="5" fill="#F0C49B"/>

            {/* ── HAIR (messy, full head coverage, fringe above eyes) ── */}
            <g>
              {/* Full hair base - covers top of head, stops above eyes */}
              <path d="M222 68 Q218 35 270 22 Q322 35 318 68 Q322 50 310 38 Q294 24 270 22 Q246 24 230 38 Q218 50 222 68Z" fill="#1C1917"/>
              {/* Top volume layer */}
              <path d="M226 62 Q224 34 270 22 Q316 34 314 62 Q316 46 306 36 Q290 24 270 22 Q250 24 234 36 Q224 46 226 62Z" fill="url(#r-hair)"/>

              {/* Messy fringe - stops at eyebrow line (~y=66) */}
              <path d="M232 52 Q236 42 246 40 Q254 44 254 54 Q254 62 248 66 Q240 64 234 58 Q230 54 232 52Z" fill="#1C1917"/>
              <path d="M250 48 Q256 38 266 38 Q274 42 274 52 Q274 62 266 66 Q258 64 252 56 Q248 50 250 48Z" fill="#292524"/>
              <path d="M270 48 Q276 38 286 40 Q294 44 292 54 Q292 62 286 66 Q278 64 272 56 Q268 50 270 48Z" fill="#1C1917"/>
              <path d="M288 50 Q294 42 304 44 Q310 48 308 58 Q306 64 300 66 Q294 64 290 58 Q286 52 288 50Z" fill="#292524"/>

              {/* Top messy bumps */}
              <path d="M242 30 Q248 20 256 24 Q256 30 250 36 Q244 34 242 30Z" fill="#292524" opacity=".6"/>
              <path d="M264 26 Q272 18 282 22 Q282 28 276 34 Q268 32 264 26Z" fill="#1C1917" opacity=".7"/>
              <path d="M288 30 Q296 22 304 28 Q302 34 296 38 Q290 34 288 30Z" fill="#292524" opacity=".55"/>
              <path d="M228 38 Q234 28 244 32 Q242 38 236 42 Q230 40 228 38Z" fill="#1C1917" opacity=".6"/>

              {/* Side hair - past ears */}
              <path d="M222 68 Q218 82 216 98 Q220 94 224 82 Q226 72 224 66Z" fill="#1C1917"/>
              <path d="M218 78 Q214 92 213 106 Q217 98 220 86Z" fill="#292524" opacity=".5"/>
              <path d="M318 68 Q322 82 324 98 Q320 94 316 82 Q314 72 316 66Z" fill="#1C1917"/>
              <path d="M322 78 Q326 92 327 106 Q323 98 320 86Z" fill="#292524" opacity=".5"/>

              {/* Small hair patches at temples (under headphone cups) */}
              <ellipse cx="226" cy="72" rx="6" ry="8" fill="#1C1917"/>
              <ellipse cx="314" cy="72" rx="6" ry="8" fill="#1C1917"/>

              {/* Hair shine */}
              <ellipse cx="258" cy="35" rx="14" ry="5" fill="white" opacity=".04" transform="rotate(-5 258 35)"/>
              <ellipse cx="288" cy="34" rx="8" ry="3" fill="white" opacity=".03"/>
            </g>

            {/* ── HEADPHONES (on top of hair) ── */}
            <g>
              {/* Band */}
              <path d="M222 72 Q220 48 270 40 Q320 48 318 72" stroke="#374151" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M222 72 Q220 48 270 40 Q320 48 318 72" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".3"/>
              {/* Left ear cup */}
              <rect x="215" y="68" width="14" height="22" rx="5" fill="#374151"/>
              <rect x="217" y="70" width="10" height="18" rx="4" fill="#4B5563" opacity=".4"/>
              <ellipse cx="222" cy="79" rx="3" ry="5" fill="#1F2937"/>
              {/* Right ear cup */}
              <rect x="311" y="68" width="14" height="22" rx="5" fill="#374151"/>
              <rect x="313" y="70" width="10" height="18" rx="4" fill="#4B5563" opacity=".4"/>
              <ellipse cx="318" cy="79" rx="3" ry="5" fill="#1F2937"/>
              {/* Mic arm */}
              <path d="M215 82 Q205 85 200 92" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="199" cy="93" r="3" fill="#374151"/>
              <circle cx="199" cy="93" r="1.5" fill="#1F2937"/>
            </g>

            {/* ── EARS (behind headphones, barely visible) ── */}
            <ellipse cx="224" cy="86" rx="5" ry="10" fill="#F0C49B" opacity=".4"/>
            <ellipse cx="316" cy="86" rx="5" ry="10" fill="#F0C49B" opacity=".4"/>

            {/* ── EYES ── */}
            <g>
              <g style={{animation:'r-bk 4s ease-in-out infinite .5s',transformOrigin:'255px 79px'}}>
                <g style={{animation:'r-elook 6.5s ease-in-out infinite .5s'}}>
                  <ellipse cx="255" cy="79" rx="6" ry="6" fill="#292524"/>
                  <circle cx="253" cy="77" r="2" fill="white" opacity=".85"/>
                  <circle cx="257" cy="81" r=".8" fill="white" opacity=".4"/>
                </g>
              </g>
              <g style={{animation:'r-bk 4s ease-in-out infinite .65s',transformOrigin:'285px 79px'}}>
                <g style={{animation:'r-elook 6.5s ease-in-out infinite .5s'}}>
                  <ellipse cx="285" cy="79" rx="6" ry="6" fill="#292524"/>
                  <circle cx="283" cy="77" r="2" fill="white" opacity=".85"/>
                  <circle cx="287" cy="81" r=".8" fill="white" opacity=".4"/>
                </g>
              </g>
            </g>

            {/* ── EYEBROWS ── */}
            <path d="M246 68 Q254 64 263 67" stroke="#292524" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M277 67 Q286 64 294 68" stroke="#292524" strokeWidth="2" strokeLinecap="round" fill="none"/>

            {/* ── NOSE ── */}
            <path d="M268 90 Q270 98 274 95" stroke="#D4956B" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <circle cx="267" cy="97" r="1.3" fill="#D4956B" opacity=".15"/>
            <circle cx="275" cy="96" r="1.3" fill="#D4956B" opacity=".15"/>

            {/* ── MOUTH ── */}
            <path d="M260 108 Q270 114 280 108" stroke="#C96B6B" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M263 110 Q270 114 277 110" stroke="#C96B6B" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".4"/>

            {/* ── CHEEKS ── */}
            <ellipse cx="242" cy="98" rx="8" ry="4" fill="#F4A0A0" opacity=".08"/>
            <ellipse cx="298" cy="98" rx="8" ry="4" fill="#F4A0A0" opacity=".08"/>

            {/* Screen glow on face */}
            <ellipse cx="270" cy="100" rx="30" ry="20" fill="#60A5FA" opacity=".04"/>
          </g>

          {/* ── LAPTOP LID (in front of everything, back facing viewer) ── */}
          <g>
            <rect x="205" y="198" width="130" height="82" rx="5" fill="#E5E7EB"/>
            <rect x="210" y="203" width="120" height="72" rx="3" fill="#D4D8DE"/>
            {/* Logo mark */}
            <circle cx="270" cy="238" r="10" fill="#C0C5CC" opacity=".6"/>
            <circle cx="270" cy="238" r="7" fill="#B4BAC2" opacity=".4"/>
            {/* Lid highlight */}
            <line x1="210" y1="203" x2="330" y2="203" stroke="white" strokeWidth="1" opacity=".15"/>
            <line x1="212" y1="275" x2="328" y2="275" stroke="#C0C5CC" strokeWidth=".5" opacity=".3"/>
            {/* Screen glow leaking from top */}
            <rect x="210" y="197" width="120" height="3" rx="1" fill="#3B82F6" opacity=".15"/>
            <ellipse cx="270" cy="196" rx="50" ry="8" fill="#3B82F6" filter="url(#r-glow)" opacity=".08" style={{animation:'r-sg 3s ease-in-out infinite'}}/>
          </g>
        </g>

        {/* Chair hint */}
        <rect x="185" y="280" width="170" height="10" rx="4" fill="#475569" opacity=".2"/>
      </svg>
    </div>
  )
}
