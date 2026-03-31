import { NextResponse } from 'next/server'

export async function GET() {
  const user = process.env.TURN_USERNAME || 'threadly'
  const cred = process.env.TURN_CREDENTIAL || 'Vwa9gKBJFoths7Lj'
  const host = process.env.TURN_HOST || 'turn.mustafakurd.com'

  return NextResponse.json({
    iceServers: [
      // STUN servers
      { urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ] },
      // Primary TURN (self-hosted Coturn)
      { urls: `turn:${host}:3478`, username: user, credential: cred },
      { urls: `turn:${host}:3478?transport=tcp`, username: user, credential: cred },
      { urls: `turns:${host}:5349`, username: user, credential: cred },
      // Fallback TURN (free public relay)
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turns:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    ],
  })
}
