'use client'

interface ChatHeaderProps {
  channelName: string
  memberCount?: number
  isAdmin?: boolean
  onManageMembers?: () => void
}

export function ChatHeader({ channelName, memberCount, isAdmin, onManageMembers }: ChatHeaderProps) {
  return (
    <div className="px-4 md:px-6 py-3 md:py-3.5 flex items-center justify-between bg-[#252133] border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/[0.06] rounded-lg flex items-center justify-center">
          <span className="text-purple-300 font-bold text-[15px]">#</span>
        </div>
        <div>
          <h2 className="font-bold text-[16px] text-white tracking-tight">{channelName}</h2>
          {memberCount !== undefined && (
            <p className="text-[11px] text-white/40 font-medium mt-0.5">{memberCount} members</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        {isAdmin && onManageMembers && (
          <button
            onClick={onManageMembers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-bold text-purple-300 bg-white/[0.06] hover:bg-white/[0.1] transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Manage
          </button>
        )}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-150">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-150">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
