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

const initialState: CallState = {
  status: 'idle', type: 'voice',
  remoteUserId: null, remoteUserName: null, remoteUserAvatar: null,
  isMuted: false, isVideoOff: false, duration: 0,
  iceState: '', hasRemoteTrack: false,
}

// Fetch TURN credentials from Metered.ca
async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch('https://mobileapp.metered.live/api/v1/turn/credentials?apiKey=7d563a91b37d968d6fcc8d3a7622bdf4f964')
    const servers = await res.json()
    return servers
  } catch {
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }
}

function roomId(a: string, b: string) {
  return a < b ? `call:${a}:${b}` : `call:${b}:${a}`
}

export function useCall(
  userId: string | undefined,
  userName: string,
  userAvatar: string | null,
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
  const offer = useRef<RTCSessionDescriptionInit | null>(null)
  const roomCh = useRef<any>(null)
  const notifyCh = useRef<any>(null)
  const remoteRef = useRef<string | null>(null)
  const logCb = useRef(onCallLog); logCb.current = onCallLog
  const logged = useRef(false)
  const info = useRef<{ type: CallType; name: string } | null>(null)
  const endRef = useRef<() => void>(() => {})
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([])
  const hasRemoteDesc = useRef(false)

  // Audio
  const audioCtx = useRef<AudioContext | null>(null)
  const audioSrc = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioEl = useRef<HTMLAudioElement | null>(null)

  const initAudio = useCallback(() => {
    try {
      if (!audioCtx.current || audioCtx.current.state === 'closed')
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtx.current.resume().catch(() => {})
    } catch {}
    if (!audioEl.current) {
      const a = document.createElement('audio')
      a.autoplay = true; a.setAttribute('playsinline', 'true'); a.volume = 1
      document.body.appendChild(a)
      audioEl.current = a
    }
    audioEl.current.srcObject = new MediaStream()
    audioEl.current.play().catch(() => {})
  }, [])

  const playRemote = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
      remoteVideoRef.current.play().catch(() => {})
    }
    try {
      const ctx = audioCtx.current
      if (ctx && ctx.state !== 'closed') {
        if (audioSrc.current) try { audioSrc.current.disconnect() } catch {}
        const s = ctx.createMediaStreamSource(stream)
        s.connect(ctx.destination)
        audioSrc.current = s
      }
    } catch {}
    if (audioEl.current) {
      audioEl.current.srcObject = stream
      audioEl.current.play().catch(() => {})
    }
  }, [])

  useEffect(() => { remoteRef.current = state.remoteUserId }, [state.remoteUserId])

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop())
    localStream.current = null
    if (audioSrc.current) try { audioSrc.current.disconnect() } catch {}
    audioSrc.current = null
    if (audioEl.current) { audioEl.current.pause(); audioEl.current.srcObject = null }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (roomCh.current) { sb.current.removeChannel(roomCh.current); roomCh.current = null }
    hasRemoteDesc.current = false
    queuedCandidates.current = []
  }, [])

  useEffect(() => () => {
    if (audioEl.current?.parentNode) audioEl.current.parentNode.removeChild(audioEl.current)
    audioEl.current = null
    if (audioCtx.current?.state !== 'closed') audioCtx.current?.close().catch(() => {})
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    durRef.current = 0
    timerRef.current = setInterval(() => {
      durRef.current += 1
      setState(p => ({ ...p, duration: durRef.current }))
    }, 1000)
  }, [])

  // ── Apply queued ICE candidates ──
  const flushCandidates = useCallback(async () => {
    const conn = pcRef.current
    if (!conn) return
    for (const c of queuedCandidates.current) {
      try { await conn.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    queuedCandidates.current = []
  }, [])

  // ── Join room channel with signaling handlers ──
  const joinRoom = useCallback((rid: string): Promise<any> => {
    if (roomCh.current) sb.current.removeChannel(roomCh.current)
    const ch = sb.current.channel(rid, { config: { broadcast: { self: false } } })

    ch.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      console.log('[Call] Got answer')
      if (!pcRef.current) return
      hasRemoteDesc.current = true
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
      await flushCandidates()
    })

    ch.on('broadcast', { event: 'ice' }, async ({ payload }) => {
      if (!pcRef.current || !payload.candidate) return
      if (hasRemoteDesc.current) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {}
      } else {
        queuedCandidates.current.push(payload.candidate)
      }
    })

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
        if (s === 'SUBSCRIBED') { roomCh.current = ch; resolve(ch) }
      })
    })
  }, [cleanup, flushCandidates])

  // ── Create peer connection ──
  const makePc = useCallback((iceServers: RTCIceServer[]) => {
    const conn = new RTCPeerConnection({ iceServers })

    conn.onicecandidate = (e) => {
      if (e.candidate && roomCh.current) {
        roomCh.current.send({ type: 'broadcast', event: 'ice', payload: { candidate: e.candidate.toJSON() } })
      }
    }

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
        if (pcRef.current?.iceConnectionState === 'disconnected') endRef.current()
      }, 5000)
    }

    return conn
  }, [playRemote, startTimer])

  // ── Listen for incoming calls ──
  useEffect(() => {
    if (!userId) return
    const ch = sb.current.channel(`call-notify:${userId}`, { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'incoming' }, ({ payload }) => {
      console.log('[Call] Incoming from', payload.callerName)
      offer.current = payload.offer
      logged.current = false
      info.current = { type: payload.type, name: payload.callerName }
      setState({
        ...initialState, status: 'ringing', type: payload.type,
        remoteUserId: payload.callerId,
        remoteUserName: payload.callerName,
        remoteUserAvatar: payload.callerAvatar,
      })
    })
    ch.subscribe((s: string) => { if (s === 'SUBSCRIBED') notifyCh.current = ch })
    return () => { sb.current.removeChannel(ch); notifyCh.current = null }
  }, [userId])

  // ── Start call ──
  const startCall = useCallback(async (
    remoteUserId: string, remoteName: string, remoteAvatar: string | null, type: CallType,
  ) => {
    if (!userId) return
    initAudio()

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' })
    } catch (err: any) {
      alert(err?.name === 'NotAllowedError' ? 'Mic permission denied.' : err?.name === 'NotFoundError' ? 'No mic found.' : 'Cannot access mic.')
      return
    }
    localStream.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream

    logged.current = false
    info.current = { type, name: remoteName }
    setState({ ...initialState, status: 'calling', type, remoteUserId, remoteUserName: remoteName, remoteUserAvatar: remoteAvatar })

    try {
      const iceServers = await getIceServers()
      const rid = roomId(userId, remoteUserId)
      const room = await joinRoom(rid)

      const conn = makePc(iceServers)
      pcRef.current = conn
      hasRemoteDesc.current = false
      stream.getTracks().forEach(t => conn.addTrack(t, stream))

      const o = await conn.createOffer()
      await conn.setLocalDescription(o)

      // Send offer via receiver's notify channel
      const nch = sb.current.channel(`call-notify:${remoteUserId}`, { config: { broadcast: { self: false } } })
      await new Promise<void>(r => nch.subscribe((s: string) => { if (s === 'SUBSCRIBED') r() }))
      await nch.send({
        type: 'broadcast', event: 'incoming',
        payload: { offer: conn.localDescription!.toJSON(), callerId: userId, callerName: userName, callerAvatar: userAvatar, type },
      })
      setTimeout(() => sb.current.removeChannel(nch), 3000)

      // Auto-end after 45s if no answer
      setTimeout(() => {
        setState(p => {
          if (p.status === 'calling') {
            room?.send({ type: 'broadcast', event: 'end', payload: {} })
            cleanup()
            return { ...p, status: 'ended' }
          }
          return p
        })
        setTimeout(() => setState(p => p.status === 'ended' ? initialState : p), 2000)
      }, 45000)
    } catch (err) {
      console.error('[Call] Start failed:', err)
      cleanup(); setState(initialState)
    }
  }, [userId, userName, userAvatar, makePc, joinRoom, cleanup, initAudio])

  // ── Accept call ──
  const acceptCall = useCallback(async () => {
    const rid = remoteRef.current
    if (!offer.current || !rid || !userId) return
    initAudio()

    try {
      const iceServers = await getIceServers()
      const room = await joinRoom(roomId(userId, rid))

      const conn = makePc(iceServers)
      pcRef.current = conn
      hasRemoteDesc.current = true

      await conn.setRemoteDescription(new RTCSessionDescription(offer.current))
      offer.current = null

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: state.type === 'video' })
      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      stream.getTracks().forEach(t => conn.addTrack(t, stream))

      const ans = await conn.createAnswer()
      await conn.setLocalDescription(ans)

      await room.send({
        type: 'broadcast', event: 'answer',
        payload: { answer: conn.localDescription!.toJSON() },
      })
      console.log('[Call] Answer sent')

      setState(p => ({ ...p, status: 'calling', iceState: 'connecting' }))
    } catch (err: any) {
      console.error('[Call] Accept failed:', err)
      alert(err?.name === 'NotAllowedError' ? 'Mic permission denied.' : 'Call failed.')
      rejectCall()
    }
  }, [userId, state.type, makePc, joinRoom, initAudio])

  // ── Reject ──
  const rejectCall = useCallback(() => {
    roomCh.current?.send({ type: 'broadcast', event: 'reject', payload: {} })
    cleanup(); setState(initialState)
  }, [cleanup])

  // ── End call ──
  const endCall = useCallback(() => {
    roomCh.current?.send({ type: 'broadcast', event: 'end', payload: {} })
    if (!logged.current && info.current && logCb.current) {
      logged.current = true
      logCb.current(info.current.type, durRef.current, info.current.name)
    }
    cleanup()
    setState(p => ({ ...p, status: 'ended' }))
    setTimeout(() => { setState(initialState); logged.current = false; info.current = null }, 2000)
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
