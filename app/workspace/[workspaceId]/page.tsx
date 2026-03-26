'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChannels } from '@/hooks/use-channels'

export default function WorkspacePage() {
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
    <main className="flex-1 flex items-center justify-center bg-[#1e1a2b] page-enter">
      <div className="text-center animate-fade-in">
        {loading ? (
          <>
            <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-white/30">Loading channels...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-purple-300">#</span>
            </div>
            <p className="text-sm font-bold text-white/50">Select a channel to start</p>
          </>
        )}
      </div>
    </main>
  )
}
