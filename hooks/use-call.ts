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
  isSpeaker: boolean
  duration: number
  iceState: string
  hasRemoteTrack: boolean
}

const initialState: CallState = {
  status: 'idle', type: 'voice',
  remoteUserId: null, remoteUserName: null, remoteUserAvatar: null,
  isMuted: false, isVideoOff: false, isSpeaker: false, duration: 0,
  iceState: '', hasRemoteTrack: false,
}

// ── Cached ICE servers ──
let cachedIce: RTCIceServer[] | null = null
let cacheTime = 0
async function getIce(): Promise<RTCIceServer[]> {
  // Cache for 5 minutes
  if (cachedIce && Date.now() - cacheTime < 300000) return cachedIce
  try {
    const r = await fetch('https://mobileapp.metered.live/api/v1/turn/credentials?apiKey=7d563a91b37d968d6fcc8d3a7622bdf4f964')
    cachedIce = await r.json()
    cacheTime = Date.now()
    return cachedIce!
  } catch {
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }
}

// Pre-fetch on module load
if (typeof window !== 'undefined') getIce()

function rid(a: string, b: string) { return a < b ? `call:${a}:${b}` : `call:${b}:${a}` }

export function useCall(
  userId: string | undefined, userName: string, userAvatar: string | null,
  onCallLog?: (type: CallType, duration: number, remoteName: string) => void,
) {
  const [state, setState] = useState<CallState>(initialState)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const durRef = useRef(0)
  const sb = useRef(createClient())
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null)
  const roomCh = useRef<any>(null)
  const remoteRef = useRef<string | null>(null)
  const logCb = useRef(onCallLog); logCb.current = onCallLog
  const logged = useRef(false)
  const isCaller = useRef(false)
  const infoRef = useRef<{ type: CallType; name: string } | null>(null)
  const endRef = useRef<() => void>(() => {})
  const queued = useRef<RTCIceCandidateInit[]>([])
  const hasRD = useRef(false)

  // Audio
  const actx = useRef<AudioContext | null>(null)
  const asrc = useRef<MediaStreamAudioSourceNode | null>(null)
  const ael = useRef<HTMLAudioElement | null>(null)

  const initAudio = useCallback(() => {
    // Only create audio element for earpiece — NO AudioContext here (that goes to speaker)
    if (!ael.current) {
      const a = document.createElement('audio')
      a.autoplay = true
      a.setAttribute('playsinline', 'true')
      a.volume = 1
      document.body.appendChild(a)
      ael.current = a
    }
    // Unlock audio playback on mobile with silent play
    ael.current.srcObject = new MediaStream()
    ael.current.play().catch(() => {})
  }, [])

  const remoteStream = useRef<MediaStream | null>(null)
  const speakerOn = useRef(false)

  const playRemote = useCallback((stream: MediaStream) => {
    remoteStream.current = stream

    // Video element — only set srcObject for video calls (don't play audio through it)
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
      remoteVideoRef.current.muted = true // mute video element, audio goes through ael or actx
      remoteVideoRef.current.play().catch(() => {})
    }

    if (speakerOn.current) {
      // Speaker ON — use Web Audio API (loudspeaker)
      if (ael.current) ael.current.volume = 0
      try {
        if (!actx.current || actx.current.state === 'closed') {
          actx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        actx.current.resume().catch(() => {})
        if (asrc.current) try { asrc.current.disconnect() } catch {}
        const s = actx.current.createMediaStreamSource(stream)
        s.connect(actx.current.destination)
        asrc.current = s
      } catch {}
    } else {
      // Speaker OFF (default) — use audio element only (earpiece on mobile)
      if (ael.current) {
        ael.current.volume = 1
        ael.current.srcObject = stream
        ael.current.play().catch(() => {})
      }
    }
  }, [])

  useEffect(() => { remoteRef.current = state.remoteUserId }, [state.remoteUserId])

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop()); localStream.current = null
    if (asrc.current) try { asrc.current.disconnect() } catch {}; asrc.current = null
    if (ael.current) { ael.current.pause(); ael.current.srcObject = null }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (roomCh.current) { sb.current.removeChannel(roomCh.current); roomCh.current = null }
    hasRD.current = false; queued.current = []
  }, [])

  useEffect(() => () => {
    if (ael.current?.parentNode) ael.current.parentNode.removeChild(ael.current); ael.current = null
    if (actx.current?.state !== 'closed') actx.current?.close().catch(() => {})
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    durRef.current = 0
    timerRef.current = setInterval(() => { durRef.current += 1; setState(p => ({ ...p, duration: durRef.current })) }, 1000)
  }, [])

  const flush = useCallback(async () => {
    const c = pcRef.current; if (!c) return
    for (const x of queued.current) try { await c.addIceCandidate(new RTCIceCandidate(x)) } catch {}
    queued.current = []
  }, [])

  const joinRoom = useCallback((id: string): Promise<any> => {
    if (roomCh.current) sb.current.removeChannel(roomCh.current)
    const ch = sb.current.channel(id, { config: { broadcast: { self: false } } })

    ch.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      if (!pcRef.current) return
      hasRD.current = true
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
      await flush()
    })
    ch.on('broadcast', { event: 'ice' }, async ({ payload }) => {
      if (!pcRef.current || !payload.candidate) return
      if (hasRD.current) try { await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {}
      else queued.current.push(payload.candidate)
    })
    ch.on('broadcast', { event: 'end' }, () => { cleanup(); setState(p => ({ ...p, status: 'ended' })); setTimeout(() => setState(initialState), 2000) })
    ch.on('broadcast', { event: 'reject' }, () => { cleanup(); setState(p => ({ ...p, status: 'ended' })); setTimeout(() => setState(initialState), 2000) })

    return new Promise(r => ch.subscribe((s: string) => { if (s === 'SUBSCRIBED') { roomCh.current = ch; r(ch) } }))
  }, [cleanup, flush])

  const makePc = useCallback((ice: RTCIceServer[]) => {
    const c = new RTCPeerConnection({ iceServers: ice })
    c.onicecandidate = e => { if (e.candidate && roomCh.current) roomCh.current.send({ type: 'broadcast', event: 'ice', payload: { candidate: e.candidate.toJSON() } }) }
    c.ontrack = e => { setState(p => ({ ...p, hasRemoteTrack: true })); playRemote(e.streams[0] || new MediaStream([e.track])) }
    c.oniceconnectionstatechange = () => {
      const s = c.iceConnectionState; setState(p => ({ ...p, iceState: s }))
      if (s === 'connected' || s === 'completed') setState(p => { if (p.status !== 'connected') { startTimer(); return { ...p, status: 'connected', iceState: s } }; return { ...p, iceState: s } })
      if (s === 'failed') endRef.current()
      if (s === 'disconnected') setTimeout(() => { if (pcRef.current?.iceConnectionState === 'disconnected') endRef.current() }, 5000)
    }
    return c
  }, [playRemote, startTimer])

  // ── Incoming call listener ──
  useEffect(() => {
    if (!userId) return
    const ch = sb.current.channel(`call-notify:${userId}`, { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'incoming' }, ({ payload }) => {
      offerRef.current = payload.offer
      logged.current = false
      isCaller.current = false
      infoRef.current = { type: payload.type, name: payload.callerName }
      setState({ ...initialState, status: 'ringing', type: payload.type, remoteUserId: payload.callerId, remoteUserName: payload.callerName, remoteUserAvatar: payload.callerAvatar })
    })
    // Listen for reject from receiver (sent before they join room)
    ch.on('broadcast', { event: 'incoming-reject' }, () => {
      cleanup()
      setState(p => ({ ...p, status: 'ended' }))
      setTimeout(() => setState(initialState), 2000)
    })
    ch.subscribe()
    return () => { sb.current.removeChannel(ch) }
  }, [userId])

  // ── Start call (optimized — parallel ops) ──
  const startCall = useCallback(async (
    remoteUserId: string, remoteName: string, remoteAvatar: string | null, type: CallType,
  ) => {
    if (!userId) return
    initAudio()

    // Show UI immediately
    logged.current = false
    isCaller.current = true
    infoRef.current = { type, name: remoteName }
    setState({ ...initialState, status: 'calling', type, remoteUserId, remoteUserName: remoteName, remoteUserAvatar: remoteAvatar })

    try {
      // Run getUserMedia, getIce, joinRoom, and notify channel subscribe ALL in parallel
      const [stream, ice, room, nch] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' }),
        getIce(),
        joinRoom(rid(userId, remoteUserId)),
        new Promise<any>(res => {
          const c = sb.current.channel(`call-notify:${remoteUserId}`, { config: { broadcast: { self: false } } })
          c.subscribe((s: string) => { if (s === 'SUBSCRIBED') res(c) })
        }),
      ])

      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const conn = makePc(ice)
      pcRef.current = conn; hasRD.current = false
      stream.getTracks().forEach(t => conn.addTrack(t, stream))

      const o = await conn.createOffer()
      await conn.setLocalDescription(o)

      // Send offer instantly
      await nch.send({
        type: 'broadcast', event: 'incoming',
        payload: { offer: conn.localDescription!.toJSON(), callerId: userId, callerName: userName, callerAvatar: userAvatar, type },
      })
      setTimeout(() => sb.current.removeChannel(nch), 3000)

      // Auto-end after 45s if no answer
      setTimeout(() => {
        setState(p => {
          if (p.status === 'calling') { room?.send({ type: 'broadcast', event: 'end', payload: {} }); cleanup(); return { ...p, status: 'ended' } }
          return p
        })
        setTimeout(() => setState(p => p.status === 'ended' ? initialState : p), 2000)
      }, 45000)
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') alert('Mic permission denied.')
      else if (err?.name === 'NotFoundError') alert('No mic found.')
      else console.error('[Call] Start failed:', err)
      cleanup(); setState(initialState)
    }
  }, [userId, userName, userAvatar, makePc, joinRoom, cleanup, initAudio])

  // ── Accept call (optimized — parallel ops) ──
  const acceptCall = useCallback(async () => {
    const remId = remoteRef.current
    if (!offerRef.current || !remId || !userId) return
    initAudio()

    // Show connecting UI immediately
    setState(p => ({ ...p, status: 'calling', iceState: 'connecting' }))

    try {
      // Run getIce, joinRoom, getUserMedia ALL in parallel
      const [ice, room, stream] = await Promise.all([
        getIce(),
        joinRoom(rid(userId, remId)),
        navigator.mediaDevices.getUserMedia({ audio: true, video: state.type === 'video' }),
      ])

      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const conn = makePc(ice)
      pcRef.current = conn; hasRD.current = true

      await conn.setRemoteDescription(new RTCSessionDescription(offerRef.current))
      offerRef.current = null

      stream.getTracks().forEach(t => conn.addTrack(t, stream))
      const ans = await conn.createAnswer()
      await conn.setLocalDescription(ans)

      // Send answer instantly
      await room.send({ type: 'broadcast', event: 'answer', payload: { answer: conn.localDescription!.toJSON() } })
    } catch (err: any) {
      console.error('[Call] Accept failed:', err)
      alert(err?.name === 'NotAllowedError' ? 'Mic permission denied.' : 'Call failed.')
      rejectCall()
    }
  }, [userId, state.type, makePc, joinRoom, initAudio])

  const rejectCall = useCallback(async () => {
    const callerId = remoteRef.current
    if (callerId) {
      try {
        const ch = sb.current.channel(`call-notify:${callerId}`, { config: { broadcast: { self: false } } })
        await new Promise<void>(r => ch.subscribe((s: string) => { if (s === 'SUBSCRIBED') r() }))
        await ch.send({ type: 'broadcast', event: 'incoming-reject', payload: {} })
        setTimeout(() => sb.current.removeChannel(ch), 2000)
      } catch {}
    }
    roomCh.current?.send({ type: 'broadcast', event: 'reject', payload: {} })
    cleanup(); setState(initialState)
  }, [cleanup])

  // Reject with a quick reply message sent to the DM
  const rejectWithMessage = useCallback(async (message: string) => {
    const callerId = remoteRef.current
    if (callerId) {
      try {
        const ch = sb.current.channel(`call-notify:${callerId}`, { config: { broadcast: { self: false } } })
        await new Promise<void>(r => ch.subscribe((s: string) => { if (s === 'SUBSCRIBED') r() }))
        await ch.send({ type: 'broadcast', event: 'incoming-reject', payload: { message } })
        setTimeout(() => sb.current.removeChannel(ch), 2000)
      } catch {}
    }
    roomCh.current?.send({ type: 'broadcast', event: 'reject', payload: {} })
    cleanup(); setState(initialState)
  }, [cleanup])

  const endCall = useCallback(() => {
    roomCh.current?.send({ type: 'broadcast', event: 'end', payload: {} })
    if (!logged.current && isCaller.current && infoRef.current && logCb.current) { logged.current = true; logCb.current(infoRef.current.type, durRef.current, infoRef.current.name) }
    cleanup()
    setState(p => ({ ...p, status: 'ended' }))
    setTimeout(() => { setState(initialState); logged.current = false; isCaller.current = false; infoRef.current = null }, 2000)
  }, [cleanup])

  endRef.current = endCall

  const toggleSpeaker = useCallback(() => {
    speakerOn.current = !speakerOn.current
    const on = speakerOn.current
    setState(p => ({ ...p, isSpeaker: on }))
    const stream = remoteStream.current

    if (on) {
      // Speaker ON — create AudioContext and route through loudspeaker
      if (ael.current) ael.current.volume = 0
      try {
        if (!actx.current || actx.current.state === 'closed') {
          actx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        actx.current.resume().catch(() => {})
        if (asrc.current) try { asrc.current.disconnect() } catch {}
        if (stream) {
          const s = actx.current.createMediaStreamSource(stream)
          s.connect(actx.current.destination)
          asrc.current = s
        }
      } catch {}
    } else {
      // Speaker OFF — disconnect AudioContext, use audio element (earpiece)
      if (asrc.current) try { asrc.current.disconnect() } catch {}
      asrc.current = null
      if (actx.current && actx.current.state !== 'closed') {
        actx.current.close().catch(() => {})
        actx.current = null
      }
      if (ael.current) {
        ael.current.volume = 1
        if (stream) { ael.current.srcObject = stream; ael.current.play().catch(() => {}) }
      }
    }
  }, [])

  const toggleMute = useCallback(() => { const t = localStream.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setState(p => ({ ...p, isMuted: !t.enabled })) } }, [])
  const toggleVideo = useCallback(() => { const t = localStream.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setState(p => ({ ...p, isVideoOff: !t.enabled })) } }, [])

  return { callState: state, localVideoRef, remoteVideoRef, startCall, acceptCall, rejectCall, rejectWithMessage, endCall, toggleMute, toggleVideo, toggleSpeaker }
}
