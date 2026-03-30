import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    iceServers: [
      { urls: process.env.STUN_URL || 'stun:stun.l.google.com:19302' },
      {
        urls: process.env.TURN_URL || 'turn:turn.mustafakurd.com:3478',
        username: process.env.TURN_USERNAME || 'threadly',
        credential: process.env.TURN_CREDENTIAL || 'Vwa9gKBJFoths7Lj',
      },
    ],
  })
}
