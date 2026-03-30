import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.METERED_API_KEY

  if (!apiKey) {
    // No TURN configured — return STUN only
    return NextResponse.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })
  }

  try {
    const appName = process.env.METERED_APP_NAME || 'mobileapp'
    const res = await fetch(
      `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      throw new Error(`Metered API error: ${res.status}`)
    }

    const credentials = await res.json()

    return NextResponse.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        ...credentials,
      ],
    })
  } catch (err) {
    console.error('[TURN] Failed to fetch credentials:', err)
    return NextResponse.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })
  }
}
