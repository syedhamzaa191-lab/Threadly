import { NextResponse } from 'next/server'

export async function GET() {
  const user = (process.env.TURN_USERNAME || 'threadly').trim()
  const cred = (process.env.TURN_CREDENTIAL || 'Vwa9gKBJFoths7Lj').trim()
  const host = (process.env.TURN_HOST || 'turn.mustafakurd.com').trim()

  return NextResponse.json({
    iceServers: [
      { urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ] },
      { urls: `turn:${host}:3478`, username: user, credential: cred },
      { urls: `turn:${host}:3478?transport=tcp`, username: user, credential: cred },
      { urls: `turns:${host}:5349`, username: user, credential: cred },
    ],
  })
}
