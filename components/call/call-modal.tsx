'use client'

import { RefObject } from 'react'
import { CallStatus, CallType } from '@/hooks/use-call'
import { Avatar } from '@/components/ui/avatar'

interface CallModalProps {
  status: CallStatus
  type: CallType
  remoteName: string
  remoteAvatar: string | null
  isMuted: boolean
  isVideoOff: boolean
  duration: number
  localVideoRef: RefObject<HTMLVideoElement | null>
  remoteVideoRef: RefObject<HTMLVideoElement | null>
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function CallModal({
  status,
  type,
  remoteName,
  remoteAvatar,
  isMuted,
  isVideoOff,
  duration,
  localVideoRef,
  remoteVideoRef,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: CallModalProps) {
  if (status === 'idle') return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0612]/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 animate-scale-in">
        {/* Video Call View */}
        {type === 'video' && status === 'connected' ? (
          <div className="relative rounded-3xl overflow-hidden bg-[#1a1530] aspect-video shadow-2xl">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Local Video (PIP) */}
            <div className="absolute top-4 right-4 w-36 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg bg-[#1a1530]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center">
                  <Avatar name={remoteName} size="lg" />
                </div>
              )}
            </div>
            {/* Duration */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
              <span className="text-white text-[12px] font-bold tabular-nums">{formatDuration(duration)}</span>
            </div>
            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <CallButton active={isMuted} onClick={onToggleMute} icon={isMuted ? <MicOffIcon /> : <MicIcon />} label={isMuted ? 'Unmute' : 'Mute'} />
              <CallButton active={isVideoOff} onClick={onToggleVideo} icon={isVideoOff ? <VideoOffIcon /> : <VideoIcon />} label={isVideoOff ? 'Camera On' : 'Camera Off'} />
              <button onClick={onEndCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg" title="End Call">
                <EndCallIcon />
              </button>
            </div>
          </div>
        ) : (
          /* Voice Call / Calling / Ringing View */
          <div className="bg-[#1a1530] rounded-3xl p-8 text-center shadow-2xl border border-white/[0.06]">
            {/* Video elements for voice call - use sr-only instead of hidden to allow audio playback */}
            <video ref={remoteVideoRef} autoPlay playsInline className="sr-only" />
            <video ref={localVideoRef} autoPlay playsInline muted className="sr-only" />

            {/* Animated rings for calling state */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              {(status === 'calling' || status === 'ringing') && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-purple-400/10 animate-ping" style={{ animationDelay: '0.5s' }} />
                </>
              )}
              <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                <Avatar name={remoteName} src={remoteAvatar} size="xl" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">{remoteName}</h2>
            <p className="text-sm text-white/40 mb-8">
              {status === 'calling' && 'Calling...'}
              {status === 'connected' && formatDuration(duration)}
              {status === 'ended' && 'Call Ended'}
            </p>

            {status === 'connected' && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <CallButton active={isMuted} onClick={onToggleMute} icon={isMuted ? <MicOffIcon /> : <MicIcon />} label={isMuted ? 'Unmute' : 'Mute'} />
                {type === 'video' && (
                  <CallButton active={isVideoOff} onClick={onToggleVideo} icon={isVideoOff ? <VideoOffIcon /> : <VideoIcon />} label={isVideoOff ? 'Camera On' : 'Camera Off'} />
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={onEndCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg" title="End Call">
                <EndCallIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CallButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
        active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      {icon}
    </button>
  )
}

function MicIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
}

function MicOffIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
}

function VideoIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
}

function VideoOffIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
}

function EndCallIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
}
