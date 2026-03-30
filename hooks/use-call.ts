'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
export type CallType = 'voice' | 'video'

interface CallState {
  status: CallStatus
  type: CallType
  remoteUserId: string | null
  remoteUserName: string | null
  remoteUserAvatar: string | null
  isMuted: boolean
  isVideoOff: boolean
  duration: number
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Free TURN servers from Open Relay (metered.ca)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

const initialState: CallState = {
  status: 'idle',
  type: 'voice',
  remoteUserId: null,
  remoteUserName: null,
  remoteUserAvatar: null,
  isMuted: false,
  isVideoOff: false,
  duration: 0,
}

export function useCall(userId: string | undefined, userName: string, userAvatar: string | null, onCallLog?: (type: CallType, duration: number, remoteName: string) => void) {
  const [state, setState] = useState<CallState>(initialState)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  // Programmatic audio element — not rendered via React, avoids ref timing issues
  const remoteAudioEl = useRef<HTMLAudioElement | null>(null)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const supabaseRef = useRef(createClient())
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null)
  const remoteChannelRef = useRef<any>(null)
  const remoteUserIdRef = useRef<string | null>(null)
  const onCallLogRef = useRef(onCallLog)
  onCallLogRef.current = onCallLog
  const hasLoggedRef = useRef(false)
  const callInfoRef = useRef<{ type: CallType; remoteName: string } | null>(null)
  const isInitiatorRef = useRef(false)
  const durationRef = useRef(0)

  // Create a persistent audio element on mount (attached to DOM body)
  useEffect(() => {
    const audio = document.createElement('audio')
    audio.autoplay = true
    audio.setAttribute('playsinline', 'true')
    // Keep it in DOM but invisible — needed for some mobile browsers
    audio.style.position = 'fixed'
    audio.style.top = '-9999px'
    audio.style.left = '-9999px'
    audio.style.width = '0'
    audio.style.height = '0'
    document.body.appendChild(audio)
    remoteAudioEl.current = audio
    return () => {
      audio.pause()
      audio.srcObject = null
      if (audio.parentNode) audio.parentNode.removeChild(audio)
      remoteAudioEl.current = null
    }
  }, [])

  // "Unlock" audio playback — must be called inside a user gesture (click handler)
  const unlockAudio = useCallback(() => {
    const audio = remoteAudioEl.current
    if (!audio) return
    // Playing (even silence) during a user gesture unlocks autoplay on mobile
    audio.srcObject = new MediaStream()
    audio.play().catch(() => {})
  }, [])

  // Attach remote stream to audio & video elements
  const attachRemoteStream = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
    }
    const audio = remoteAudioEl.current
    if (audio) {
      audio.srcObject = stream
      audio.play().catch((e) => console.warn('Audio play blocked:', e))
    }
  }, [])

  useEffect(() => {
    remoteUserIdRef.current = state.remoteUserId
  }, [state.remoteUserId])

  const cleanup = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop())
      localStream.current = null
    }
    remoteStreamRef.current = null
    if (remoteAudioEl.current) {
      remoteAudioEl.current.srcObject = null
    }
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }
    if (remoteChannelRef.current) {
      supabaseRef.current.removeChannel(remoteChannelRef.current)
      remoteChannelRef.current = null
    }
    pendingOffer.current = null
  }, [])

  const sendToRemote = useCallback(async (remoteId: string, event: string, payload: any) => {
    const supabase = supabaseRef.current
    if (!remoteChannelRef.current || remoteChannelRef.current._topic !== `call-signal:${remoteId}`) {
      if (remoteChannelRef.current) {
        supabase.removeChannel(remoteChannelRef.current)
      }
      const ch = supabase.channel(`call-signal:${remoteId}`, {
        config: { broadcast: { self: false } },
      })
      await new Promise<void>((resolve) => {
        ch.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve()
        })
      })
      remoteChannelRef.current = ch
    }
    await remoteChannelRef.current.send({
      type: 'broadcast',
      event,
      payload,
    })
  }, [])

  const startDurationTimer = useCallback(() => {
    if (durationInterval.current) clearInterval(durationInterval.current)
    durationRef.current = 0
    durationInterval.current = setInterval(() => {
      durationRef.current += 1
      setState(prev => ({ ...prev, duration: durationRef.current }))
    }, 1000)
  }, [])

  const createPeerConnection = useCallback((remoteId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendToRemote(remoteId, 'ice-candidate', {
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.ontrack = (event) => {
      // Get or build the remote stream
      let stream = event.streams[0]
      if (!stream) {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream()
        }
        remoteStreamRef.current.addTrack(event.track)
        stream = remoteStreamRef.current
      }
      attachRemoteStream(stream)
    }

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState)
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall()
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState)
    }

    return pc
  }, [sendToRemote, attachRemoteStream])

  // Listen on own channel for incoming signals
  useEffect(() => {
    if (!userId) return

    const supabase = supabaseRef.current
    const myChannel = supabase.channel(`call-signal:${userId}`, {
      config: { broadcast: { self: false } },
    })

    myChannel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
        pendingOffer.current = payload.offer
        hasLoggedRef.current = false
        callInfoRef.current = { type: payload.type, remoteName: payload.callerName }
        setState({
          ...initialState,
          status: 'ringing',
          type: payload.type,
          remoteUserId: payload.callerId,
          remoteUserName: payload.callerName,
          remoteUserAvatar: payload.callerAvatar,
        })
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
          setState(prev => ({ ...prev, status: 'connected' }))
          startDurationTimer()
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (peerConnection.current && payload.candidate) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
          } catch (e) {
            // ignore
          }
        }
      })
      .on('broadcast', { event: 'call-end' }, () => {
        cleanup()
        setState(prev => ({ ...prev, status: 'ended' }))
        setTimeout(() => setState(initialState), 2000)
      })
      .on('broadcast', { event: 'call-reject' }, () => {
        cleanup()
        setState(prev => ({ ...prev, status: 'ended' }))
        setTimeout(() => setState(initialState), 2000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(myChannel)
    }
  }, [userId, cleanup, startDurationTimer])

  // Start a call
  const startCall = useCallback(async (
    remoteUserId: string,
    remoteUserName: string,
    remoteUserAvatar: string | null,
    type: CallType
  ) => {
    if (!userId) return

    // Unlock audio during this user gesture
    unlockAudio()

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      })
    } catch (err: any) {
      console.error('Permission denied:', err)
      if (err?.name === 'NotAllowedError') {
        alert('Microphone/Camera permission denied. Click the lock icon in the address bar to allow access, then try again.')
      } else if (err?.name === 'NotFoundError') {
        alert('No microphone or camera found on this device.')
      } else {
        alert('Could not access microphone/camera: ' + (err?.message || 'Unknown error'))
      }
      return
    }

    localStream.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream

    hasLoggedRef.current = false
    isInitiatorRef.current = true
    callInfoRef.current = { type, remoteName: remoteUserName }
    setState({
      ...initialState,
      status: 'calling',
      type,
      remoteUserId,
      remoteUserName,
      remoteUserAvatar,
    })

    try {
      const pc = createPeerConnection(remoteUserId)
      peerConnection.current = pc
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await sendToRemote(remoteUserId, 'call-offer', {
        offer: pc.localDescription?.toJSON(),
        callerId: userId,
        callerName: userName,
        callerAvatar: userAvatar,
        type,
      })

      // Auto-end if no answer in 30s
      setTimeout(() => {
        setState(prev => {
          if (prev.status === 'calling') {
            cleanup()
            sendToRemote(remoteUserId, 'call-end', {})
            return { ...prev, status: 'ended' }
          }
          return prev
        })
        setTimeout(() => {
          setState(prev => prev.status === 'ended' ? initialState : prev)
        }, 2000)
      }, 30000)
    } catch (err) {
      console.error('Failed to start call:', err)
      cleanup()
      setState(initialState)
    }
  }, [userId, userName, userAvatar, createPeerConnection, sendToRemote, cleanup, unlockAudio])

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const remoteId = remoteUserIdRef.current
    if (!pendingOffer.current || !remoteId) return

    // Unlock audio during this user gesture (accept button click)
    unlockAudio()

    try {
      const pc = createPeerConnection(remoteId)
      peerConnection.current = pc

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer.current))
      pendingOffer.current = null

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: state.type === 'video',
      })
      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await sendToRemote(remoteId, 'call-answer', {
        answer: pc.localDescription?.toJSON(),
      })

      // Re-attach remote stream in case ontrack already fired
      if (remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0) {
        attachRemoteStream(remoteStreamRef.current)
      }

      setState(prev => ({ ...prev, status: 'connected' }))
      startDurationTimer()
    } catch (err: any) {
      console.error('Failed to accept call:', err)
      if (err?.name === 'NotAllowedError') {
        alert('Microphone/Camera permission denied. Allow access and try again.')
      } else if (err?.name === 'NotFoundError') {
        alert('No microphone or camera found on this device.')
      }
      rejectCall()
    }
  }, [state.type, createPeerConnection, sendToRemote, startDurationTimer, unlockAudio, attachRemoteStream])

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const remoteId = remoteUserIdRef.current
    if (remoteId) {
      sendToRemote(remoteId, 'call-reject', {})
    }
    cleanup()
    setState(initialState)
  }, [sendToRemote, cleanup])

  // End call
  const endCall = useCallback(() => {
    const remoteId = remoteUserIdRef.current
    if (remoteId) {
      sendToRemote(remoteId, 'call-end', {})
    }
    if (!hasLoggedRef.current && callInfoRef.current && onCallLogRef.current) {
      hasLoggedRef.current = true
      const info = callInfoRef.current
      onCallLogRef.current(info.type, durationRef.current, info.remoteName)
    }
    setState(prev => ({ ...prev, status: 'ended' }))
    cleanup()
    setTimeout(() => {
      setState(initialState)
      hasLoggedRef.current = false
      isInitiatorRef.current = false
      callInfoRef.current = null
    }, 2000)
  }, [sendToRemote, cleanup])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }))
      }
    }
  }, [])

  return {
    callState: state,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  }
}
