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

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]

async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const r = await fetch('/api/turn')
    if (!r.ok) throw new Error()
    const d = await r.json()
    return d.iceServers
  } catch {
    return FALLBACK_ICE
  }
}

// Wait until all ICE candidates are embedded in the local description
function waitForIceGathering(pc: RTCPeerConnection, timeout = 10000): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeout)
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer)
        resolve()
      }
    })
  })
}

function makeRoomId(a: string, b: string) {
  return a < b ? `call-room:${a}:${b}` : `call-room:${b}:${a}`
}

const initialState: CallState = {
  status: 'idle', type: 'voice',
  remoteUserId: null, remoteUserName: null, remoteUserAvatar: null,
  isMuted: false, isVideoOff: false, duration: 0,
  iceState: '', hasRemoteTrack: false,
}

export function useCall(
  userId: string | undefined,
  userName: string,
  userAvatar: string | null,
  onCallLog?: (type: CallType, duration: number, remoteName: string) => void,
) {
  const [state, setState] = useState<CallState>(initialState)
  const pc = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const durationRef = useRef(0)
  const supabase = useRef(createClient())
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null)
  const roomRef = useRef<any>(null)
  const notifyRef = useRef<any>(null)
  const remoteIdRef = useRef<string | null>(null)
  const logRef = useRef(onCallLog)
  logRef.current = onCallLog
  const loggedRef = useRef(false)
  const infoRef = useRef<{ type: CallType; name: string } | null>(null)
  const endRef = useRef<() => void>(() => {})

  // Audio
  const audioCtx = useRef<AudioContext | null>(null)
  const audioSrc = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioEl = useRef<HTMLAudioElement | null>(null)

  const initAudio = useCallback(() => {
    try {
      if (!audioCtx.current || audioCtx.current.state === 'closed') {
        const C = window.AudioContext || (window as any).webkitAudioContext
        audioCtx.current = new C()
      }
      audioCtx.current.resume().catch(() => {})
    } catch {}
    if (!audioEl.current) {
      const a = document.createElement('audio')
      a.autoplay = true
      a.setAttribute('playsinline', 'true')
      a.volume = 1
      document.body.appendChild(a)
      audioEl.current = a
    }
    const a = audioEl.current
    a.srcObject = new MediaStream()
    a.play().catch(() => {})
  }, [])

  const playRemote = useCallback((stream: MediaStream) => {
    // Video element
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
      remoteVideoRef.current.play().catch(() => {})
    }
    // Web Audio API
    try {
      const ctx = audioCtx.current
      if (ctx && ctx.state !== 'closed') {
        if (audioSrc.current) try { audioSrc.current.disconnect() } catch {}
        const s = ctx.createMediaStreamSource(stream)
        s.connect(ctx.destination)
        audioSrc.current = s
      }
    } catch {}
    // Audio element
    if (audioEl.current) {
      audioEl.current.srcObject = stream
      audioEl.current.play().catch(() => {})
    }
  }, [])

  useEffect(() => { remoteIdRef.current = state.remoteUserId }, [state.remoteUserId])

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop())
    localStream.current = null
    if (audioSrc.current) try { audioSrc.current.disconnect() } catch {}
    audioSrc.current = null
    if (audioEl.current) { audioEl.current.pause(); audioEl.current.srcObject = null }
    pc.current?.close()
    pc.current = null
    if (durationInterval.current) clearInterval(durationInterval.current)
    durationInterval.current = null
    if (roomRef.current) { supabase.current.removeChannel(roomRef.current); roomRef.current = null }
  }, [])

  useEffect(() => () => {
    if (audioEl.current?.parentNode) audioEl.current.parentNode.removeChild(audioEl.current)
    audioEl.current = null
    if (audioCtx.current?.state !== 'closed') audioCtx.current?.close().catch(() => {})
  }, [])

  const startTimer = useCallback(() => {
    if (durationInterval.current) clearInterval(durationInterval.current)
    durationRef.current = 0
    durationInterval.current = setInterval(() => {
      durationRef.current += 1
      setState(p => ({ ...p, duration: durationRef.current }))
    }, 1000)
  }, [])

  // ── Join shared room channel ──
  const joinRoom = useCallback((roomId: string): Promise<any> => {
    if (roomRef.current) supabase.current.removeChannel(roomRef.current)
    const ch = supabase.current.channel(roomId, { config: { broadcast: { self: false } } })

    // Answer handler (caller receives this)
    ch.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      console.log('[Call] Got answer')
      if (!pc.current) return
      await pc.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
      setState(p => ({ ...p, iceState: 'negotiating' }))
    })

    // End / reject
    ch.on('broadcast', { event: 'end' }, () => {
      cleanup()
      setState(p => ({ ...p, status: 'ended' }))
      setTimeout(() => setState(initialState), 2000)
    })
    ch.on('broadcast', { event: 'reject' }, () => {
      cleanup()
      setState(p => ({ ...p, status: 'ended' }))
      setTimeout(() => setState(initialState), 2000)
    })

    return new Promise(resolve => {
      ch.subscribe((s: string) => {
        if (s === 'SUBSCRIBED') { roomRef.current = ch; resolve(ch) }
      })
    })
  }, [cleanup])

  // ── Create RTCPeerConnection ──
  const makePc = useCallback((iceServers: RTCIceServer[]) => {
    const conn = new RTCPeerConnection({ iceServers, iceTransportPolicy: 'relay' })
    conn.ontrack = (e) => {
      console.log('[Call] ontrack', e.track.kind)
      setState(p => ({ ...p, hasRemoteTrack: true }))
      playRemote(e.streams[0] || new MediaStream([e.track]))
    }
    conn.oniceconnectionstatechange = () => {
      const s = conn.iceConnectionState
      console.log('[Call] ICE:', s)
      setState(p => ({ ...p, iceState: s }))
      if (s === 'connected' || s === 'completed') {
        setState(p => {
          if (p.status !== 'connected') { startTimer(); return { ...p, status: 'connected', iceState: s } }
          return { ...p, iceState: s }
        })
      }
      if (s === 'failed') endRef.current()
      if (s === 'disconnected') setTimeout(() => {
        if (pc.current?.iceConnectionState === 'disconnected') endRef.current()
      }, 5000)
    }
    return conn
  }, [playRemote, startTimer])

  // ── Listen for incoming calls on personal channel ──
  useEffect(() => {
    if (!userId) return
    const ch = supabase.current.channel(`call-notify:${userId}`, { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'incoming' }, ({ payload }) => {
      console.log('[Call] Incoming from', payload.callerName)
      pendingOffer.current = payload.offer
      loggedRef.current = false
      infoRef.current = { type: payload.type, name: payload.callerName }
      setState({
        ...initialState,
        status: 'ringing', type: payload.type,
        remoteUserId: payload.callerId,
        remoteUserName: payload.callerName,
        remoteUserAvatar: payload.callerAvatar,
      })
    })
    ch.subscribe((s: string) => { if (s === 'SUBSCRIBED') notifyRef.current = ch })
    return () => { supabase.current.removeChannel(ch); notifyRef.current = null }
  }, [userId])

  // ── Start call ──
  const startCall = useCallback(async (
    remoteUserId: string, remoteName: string, remoteAvatar: string | null, type: CallType,
  ) => {
    if (!userId) return
    initAudio()

    // 1. Get media
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' })
    } catch (err: any) {
      alert(err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. Allow access and try again.'
        : err?.name === 'NotFoundError'
        ? 'No microphone found.' : 'Could not access mic/camera.')
      return
    }
    localStream.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream

    loggedRef.current = false
    infoRef.current = { type, name: remoteName }
    setState({ ...initialState, status: 'calling', type, remoteUserId, remoteUserName: remoteName, remoteUserAvatar: remoteAvatar })

    try {
      // 2. Get TURN servers
      const ice = await fetchIceServers()
      console.log('[Call] ICE servers:', ice.length)

      // 3. Join room
      const roomId = makeRoomId(userId, remoteUserId)
      await joinRoom(roomId)

      // 4. Create PC & offer
      const conn = makePc(ice)
      pc.current = conn
      stream.getTracks().forEach(t => conn.addTrack(t, stream))
      const offer = await conn.createOffer()
      await conn.setLocalDescription(offer)

      // 5. Wait for ALL ICE candidates to be embedded in SDP
      console.log('[Call] Gathering ICE candidates...')
      await waitForIceGathering(conn)
      console.log('[Call] ICE gathering complete')

      // 6. Send complete offer (with all candidates) via receiver's notify channel
      const notifyCh = supabase.current.channel(`call-notify:${remoteUserId}`, { config: { broadcast: { self: false } } })
      await new Promise<void>(r => notifyCh.subscribe((s: string) => { if (s === 'SUBSCRIBED') r() }))
      await notifyCh.send({
        type: 'broadcast', event: 'incoming',
        payload: {
          offer: conn.localDescription!.toJSON(),
          callerId: userId, callerName: userName, callerAvatar: userAvatar, type,
        },
      })
      console.log('[Call] Offer sent')
      setTimeout(() => supabase.current.removeChannel(notifyCh), 3000)

      // 7. Auto-end after 45s if still calling (no answer)
      setTimeout(() => {
        setState(p => {
          if (p.status === 'calling') {
            cleanup()
            roomRef.current?.send({ type: 'broadcast', event: 'end', payload: {} })
            return { ...p, status: 'ended' }
          }
          return p
        })
        setTimeout(() => setState(p => p.status === 'ended' ? initialState : p), 2000)
      }, 45000)
    } catch (err) {
      console.error('[Call] Failed:', err)
      cleanup(); setState(initialState)
    }
  }, [userId, userName, userAvatar, makePc, joinRoom, cleanup, initAudio])

  // ── Accept call ──
  const acceptCall = useCallback(async () => {
    const rid = remoteIdRef.current
    if (!pendingOffer.current || !rid || !userId) return
    initAudio()

    try {
      // 1. Get TURN servers
      const ice = await fetchIceServers()

      // 2. Join room
      const roomId = makeRoomId(userId, rid)
      const roomCh = await joinRoom(roomId)

      // 3. Create PC
      const conn = makePc(ice)
      pc.current = conn

      // 4. Set remote description (offer with all candidates)
      await conn.setRemoteDescription(new RTCSessionDescription(pendingOffer.current))
      pendingOffer.current = null

      // 5. Get media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: state.type === 'video' })
      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      stream.getTracks().forEach(t => conn.addTrack(t, stream))

      // 6. Create answer & wait for ICE gathering
      const answer = await conn.createAnswer()
      await conn.setLocalDescription(answer)
      console.log('[Call] Gathering ICE candidates...')
      await waitForIceGathering(conn)
      console.log('[Call] ICE gathering complete, sending answer')

      // 7. Send complete answer via room channel
      await roomCh.send({
        type: 'broadcast', event: 'answer',
        payload: { answer: conn.localDescription!.toJSON() },
      })

      setState(p => ({ ...p, status: 'calling', iceState: 'negotiating' }))
    } catch (err: any) {
      console.error('[Call] Accept failed:', err)
      if (err?.name === 'NotAllowedError') alert('Mic permission denied.')
      else if (err?.name === 'NotFoundError') alert('No mic found.')
      rejectCall()
    }
  }, [userId, state.type, makePc, joinRoom, initAudio])

  const rejectCall = useCallback(() => {
    roomRef.current?.send({ type: 'broadcast', event: 'reject', payload: {} })
    cleanup(); setState(initialState)
  }, [cleanup])

  const endCall = useCallback(() => {
    roomRef.current?.send({ type: 'broadcast', event: 'end', payload: {} })
    if (!loggedRef.current && infoRef.current && logRef.current) {
      loggedRef.current = true
      logRef.current(infoRef.current.type, durationRef.current, infoRef.current.name)
    }
    setState(p => ({ ...p, status: 'ended' }))
    cleanup()
    setTimeout(() => { setState(initialState); loggedRef.current = false; infoRef.current = null }, 2000)
  }, [cleanup])

  endRef.current = endCall

  const toggleMute = useCallback(() => {
    const t = localStream.current?.getAudioTracks()[0]
    if (t) { t.enabled = !t.enabled; setState(p => ({ ...p, isMuted: !t.enabled })) }
  }, [])

  const toggleVideo = useCallback(() => {
    const t = localStream.current?.getVideoTracks()[0]
    if (t) { t.enabled = !t.enabled; setState(p => ({ ...p, isVideoOff: !t.enabled })) }
  }, [])

  return {
    callState: state, localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, endCall, toggleMute, toggleVideo,
  }
}
