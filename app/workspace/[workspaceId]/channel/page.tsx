'use client'

import { useParams, useRouter } from 'next/navigation'
import { useChannels } from '@/hooks/use-channels'
import { useAuth } from '@/hooks/use-auth'

export default function ChannelIndexPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const { user } = useAuth()
  const { channels, loading } = useChannels(workspaceId, user?.id)

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-[#1e1a2b] page-enter">
      {/* Header — same style as Members page */}
      <div className="px-4 md:px-8 py-4 md:py-5 bg-[#252133] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
            <span className="text-purple-300 font-bold text-lg">#</span>
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white">Channels</h1>
            <p className="text-[12px] text-white/30 mt-0.5">{channels.length} {channels.length === 1 ? 'channel' : 'channels'} available</p>
          </div>
        </div>
      </div>

      {/* Content — same padding as Members page */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-white/30">Loading channels...</p>
            </div>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white/20">#</span>
              </div>
              <p className="text-[15px] font-semibold text-white/40">No channels yet</p>
              <p className="text-[13px] text-white/20 mt-1">Create a channel to start messaging</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => router.push(`/workspace/${workspaceId}/channel/${channel.id}`)}
                className="flex items-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-200 text-left group"
              >
                <div className="w-12 h-12 bg-white/[0.06] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-500/15 transition-colors">
                  <span className="text-purple-300 font-bold text-xl">#</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-white group-hover:text-purple-200 transition-colors">{channel.name}</p>
                  <p className="text-[12px] text-white/25 mt-0.5">Open channel</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
