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
  iceState: string
  hasRemoteTrack: boolean
}

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch('/api/turn')
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    console.log('[Call] Got ICE servers:', data.iceServers?.length)
    return data.iceServers
  } catch {
    return FALLBACK_ICE_SERVERS
  }
}

// Create a deterministic room ID for two users
function makeRoomId(userA: string, userB: string) {
  return userA < userB ? `call-room:${userA}:${userB}` : `call-room:${userB}:${userA}`
}

const initialState: CallState = {
  status: 'idle',
  type: 'voice',
  remoteUserId: null,
  remoteUserName: null,
  remoteUserAvatar: null,
  isMuted: false,
  isVideoOff: false,
  duration: 0,
  iceState: '',
  hasRemoteTrack: false,
}

export function useCall(userId: string | undefined, userName: string, userAvatar: string | null, onCallLog?: (type: CallType, duration: number, remoteName: string) => void) {
  const [state, setState] = useState<CallState>(initialState)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const supabaseRef = useRef(createClient())
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null)
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([])
  const remoteUserIdRef = useRef<string | null>(null)
  const onCallLogRef = useRef(onCallLog)
  onCallLogRef.current = onCallLog
  const hasLoggedRef = useRef(false)
  const callInfoRef = useRef<{ type: CallType; remoteName: string } | null>(null)
  const durationRef = useRef(0)

  // Channels
  const notifyChannelRef = useRef<any>(null) // per-user channel for incoming call notification
  const roomChannelRef = useRef<any>(null) // shared room channel for call signaling

  // Audio
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const remoteAudioEl = useRef<HTMLAudioElement | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)

  const initAudio = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioCtx()
      }
      audioContextRef.current.resume().catch(() => {})
    } catch (e) { /* ignore */ }

    if (!remoteAudioEl.current) {
      const audio = document.createElement('audio')
      audio.autoplay = true
      audio.setAttribute('playsinline', 'true')
      audio.volume = 1.0
      document.body.appendChild(audio)
      remoteAudioEl.current = audio
    }
    const audio = remoteAudioEl.current
    if (audio) {
      audio.srcObject = new MediaStream()
      const p = audio.play()
      if (p) p.catch(() => {})
    }
  }, [])

  const playRemoteAudio = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
      const p = remoteVideoRef.current.play()
      if (p) p.catch(() => {})
    }
    try {
      const ctx = audioContextRef.current
      if (ctx && ctx.state !== 'closed') {
        if (audioSourceRef.current) {
          try { audioSourceRef.current.disconnect() } catch (_) {}
        }
        const source = ctx.createMediaStreamSource(stream)
        source.connect(ctx.destination)
        audioSourceRef.current = source
      }
    } catch (e) { /* ignore */ }
    const audio = remoteAudioEl.current
    if (audio) {
      audio.srcObject = stream
      const p = audio.play()
      if (p) p.catch(() => {})
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
    pendingCandidates.current = []
    if (audioSourceRef.current) {
      try { audioSourceRef.current.disconnect() } catch (_) {}
      audioSourceRef.current = null
    }
    if (remoteAudioEl.current) {
      remoteAudioEl.current.pause()
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
    // Leave room channel
    if (roomChannelRef.current) {
      supabaseRef.current.removeChannel(roomChannelRef.current)
      roomChannelRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (remoteAudioEl.current) {
        remoteAudioEl.current.pause()
        remoteAudioEl.current.srcObject = null
        if (remoteAudioEl.current.parentNode) {
          remoteAudioEl.current.parentNode.removeChild(remoteAudioEl.current)
        }
        remoteAudioEl.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [])

  const startDurationTimer = useCallback(() => {
    if (durationInterval.current) clearInterval(durationInterval.current)
    durationRef.current = 0
    durationInterval.current = setInterval(() => {
      durationRef.current += 1
      setState(prev => ({ ...prev, duration: durationRef.current }))
    }, 1000)
  }, [])

  const endCallRef = useRef<() => void>(() => {})

  const createPeerConnection = useCallback((iceServers: RTCIceServer[], roomChannel: any) => {
    const pc = new RTCPeerConnection({ iceServers })

    pc.onicecandidate = (event) => {
      if (event.candidate && roomChannel) {
        console.log('[WebRTC] Sending ICE candidate via room channel')
        roomChannel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate.toJSON(), senderId: userId },
        })
      }
    }

    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack:', event.track.kind, event.track.readyState)
      setState(prev => ({ ...prev, hasRemoteTrack: true }))
      const stream = event.streams[0] || new MediaStream([event.track])
      playRemoteAudio(stream)
    }

    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState
      console.log('[WebRTC] ICE state:', iceState)
      setState(prev => ({ ...prev, iceState }))

      if (iceState === 'connected' || iceState === 'completed') {
        setState(prev => {
          if (prev.status !== 'connected') {
            startDurationTimer()
            return { ...prev, status: 'connected', iceState }
          }
          return { ...prev, iceState }
        })
        if (remoteStreamRef.current) {
          playRemoteAudio(remoteStreamRef.current)
        }
      } else if (iceState === 'failed') {
        endCallRef.current()
      } else if (iceState === 'disconnected') {
        setTimeout(() => {
          if (peerConnection.current && peerConnection.current.iceConnectionState === 'disconnected') {
            endCallRef.current()
          }
        }, 5000)
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState)
    }

    return pc
  }, [userId, playRemoteAudio, startDurationTimer])

  // Subscribe to shared room channel and set up signaling handlers
  const joinRoomChannel = useCallback((roomId: string, role: 'caller' | 'receiver') => {
    const supabase = supabaseRef.current

    // Remove old room channel if any
    if (roomChannelRef.current) {
      supabase.removeChannel(roomChannelRef.current)
    }

    const ch = supabase.channel(roomId, {
      config: { broadcast: { self: false } },
    })

    ch.on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
      console.log('[Signal] Received answer via room channel')
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
        setState(prev => ({ ...prev, iceState: 'checking' }))
        // Add any queued ICE candidates
        for (const c of pendingCandidates.current) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(c))
          } catch (e) { /* ignore */ }
        }
        pendingCandidates.current = []
      }
    })

    ch.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload.senderId === userId) return // ignore own
      if (peerConnection.current) {
        if (peerConnection.current.remoteDescription) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
          } catch (e) { /* ignore */ }
        } else {
          // Queue candidate until remote description is set
          pendingCandidates.current.push(payload.candidate)
        }
      }
    })

    ch.on('broadcast', { event: 'call-end' }, () => {
      cleanup()
      setState(prev => ({ ...prev, status: 'ended' }))
      setTimeout(() => setState(initialState), 2000)
    })

    ch.on('broadcast', { event: 'call-reject' }, () => {
      cleanup()
      setState(prev => ({ ...prev, status: 'ended' }))
      setTimeout(() => setState(initialState), 2000)
    })

    return new Promise<any>((resolve) => {
      ch.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Signal] Joined room channel:', roomId)
          roomChannelRef.current = ch
          resolve(ch)
        }
      })
    })
  }, [userId, cleanup])

  // Listen on personal channel for incoming call notifications ONLY
  useEffect(() => {
    if (!userId) return

    const supabase = supabaseRef.current
    const myChannel = supabase.channel(`call-signal:${userId}`, {
      config: { broadcast: { self: false } },
    })

    myChannel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
        console.log('[Signal] Received call offer from:', payload.callerName)
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
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Signal] Listening on personal channel:', `call-signal:${userId}`)
          notifyChannelRef.current = myChannel
        }
      })

    return () => {
      supabase.removeChannel(myChannel)
      notifyChannelRef.current = null
    }
  }, [userId])

  // Send offer via receiver's personal channel
  const sendOffer = useCallback(async (receiverId: string, offer: RTCSessionDescriptionInit, type: CallType) => {
    const supabase = supabaseRef.current
    const ch = supabase.channel(`call-signal:${receiverId}`, {
      config: { broadcast: { self: false } },
    })
    await new Promise<void>((resolve) => {
      ch.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') resolve()
      })
    })
    await ch.send({
      type: 'broadcast',
      event: 'call-offer',
      payload: {
        offer,
        callerId: userId,
        callerName: userName,
        callerAvatar: userAvatar,
        type,
      },
    })
    console.log('[Signal] Offer sent to:', receiverId)
    // Cleanup this temp channel after sending
    setTimeout(() => supabase.removeChannel(ch), 2000)
  }, [userId, userName, userAvatar])

  // Start a call
  const startCall = useCallback(async (
    remoteUserId: string,
    remoteUserName: string,
    remoteUserAvatar: string | null,
    type: CallType
  ) => {
    if (!userId) return
    initAudio()

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
      // 1. Fetch TURN credentials
      const iceServers = await fetchIceServers()

      // 2. Join shared room channel FIRST
      const roomId = makeRoomId(userId, remoteUserId)
      const roomCh = await joinRoomChannel(roomId, 'caller')

      // 3. Create peer connection (ICE candidates go via room channel)
      const pc = createPeerConnection(iceServers, roomCh)
      peerConnection.current = pc
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // 4. Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await sendOffer(remoteUserId, pc.localDescription!.toJSON(), type)

      // Auto-end if no answer in 30s
      setTimeout(() => {
        setState(prev => {
          if (prev.status === 'calling') {
            cleanup()
            if (roomChannelRef.current) {
              roomChannelRef.current.send({ type: 'broadcast', event: 'call-end', payload: {} })
            }
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
  }, [userId, userName, userAvatar, createPeerConnection, sendOffer, cleanup, initAudio, joinRoomChannel])

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const remoteId = remoteUserIdRef.current
    if (!pendingOffer.current || !remoteId || !userId) return
    initAudio()

    try {
      // 1. Fetch TURN credentials
      const iceServers = await fetchIceServers()

      // 2. Join shared room channel
      const roomId = makeRoomId(userId, remoteId)
      const roomCh = await joinRoomChannel(roomId, 'receiver')

      // 3. Create peer connection
      const pc = createPeerConnection(iceServers, roomCh)
      peerConnection.current = pc

      // 4. Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer.current))
      pendingOffer.current = null

      // 5. Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: state.type === 'video',
      })
      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // 6. Create and send answer via room channel
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      console.log('[Signal] Sending answer via room channel')
      await roomCh.send({
        type: 'broadcast',
        event: 'call-answer',
        payload: { answer: pc.localDescription!.toJSON() },
      })

      setState(prev => ({ ...prev, status: 'calling', iceState: 'checking' }))
    } catch (err: any) {
      console.error('Failed to accept call:', err)
      if (err?.name === 'NotAllowedError') {
        alert('Microphone/Camera permission denied. Allow access and try again.')
      } else if (err?.name === 'NotFoundError') {
        alert('No microphone or camera found on this device.')
      }
      rejectCall()
    }
  }, [userId, state.type, createPeerConnection, initAudio, joinRoomChannel])

  const rejectCall = useCallback(() => {
    const remoteId = remoteUserIdRef.current
    if (remoteId && roomChannelRef.current) {
      roomChannelRef.current.send({ type: 'broadcast', event: 'call-reject', payload: {} })
    }
    cleanup()
    setState(initialState)
  }, [cleanup])

  const endCall = useCallback(() => {
    if (roomChannelRef.current) {
      roomChannelRef.current.send({ type: 'broadcast', event: 'call-end', payload: {} })
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
      callInfoRef.current = null
    }, 2000)
  }, [cleanup])

  endCallRef.current = endCall

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }, [])

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
