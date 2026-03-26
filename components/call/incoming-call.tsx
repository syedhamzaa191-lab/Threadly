'use client'

import { CallType } from '@/hooks/use-call'
import { Avatar } from '@/components/ui/avatar'

interface IncomingCallProps {
  callerName: string
  callerAvatar: string | null
  type: CallType
  onAccept: () => void
  onReject: () => void
}

export function IncomingCall({ callerName, callerAvatar, type, onAccept, onReject }: IncomingCallProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1530] rounded-3xl p-8 text-center shadow-2xl border border-white/[0.06] w-full max-w-sm mx-4 animate-scale-in">
        {/* Pulsing avatar */}
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-green-500/10 animate-ping" style={{ animationDelay: '0.3s' }} />
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <Avatar name={callerName} src={callerAvatar} size="xl" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-1">{callerName}</h2>
        <p className="text-sm text-white/40 mb-8">
          Incoming {type === 'video' ? 'video' : 'voice'} call...
        </p>

        <div className="flex items-center justify-center gap-6">
          {/* Reject */}
          <div className="text-center">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg mx-auto"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
            <p className="text-[11px] text-white/30 font-medium mt-2">Decline</p>
          </div>

          {/* Accept */}
          <div className="text-center">
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg mx-auto"
            >
              {type === 'video' ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
            </button>
            <p className="text-[11px] text-white/30 font-medium mt-2">Accept</p>
          </div>
        </div>
      </div>
    </div>
  )
}
