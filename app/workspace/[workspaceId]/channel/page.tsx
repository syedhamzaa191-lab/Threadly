'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChannels } from '@/hooks/use-channels'

export default function ChannelIndexPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const { channels, loading } = useChannels(workspaceId)

  useEffect(() => {
    if (!loading && channels.length > 0) {
      router.replace(`/workspace/${workspaceId}/channel/${channels[0].id}`)
    }
  }, [loading, channels, workspaceId, router])

  return (
    <main className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">#</span>
        </div>
        <p className="text-sm font-bold text-gray-900">
          {loading ? 'Loading channels...' : 'Select a channel to start'}
        </p>
      </div>
    </main>
  )
}
