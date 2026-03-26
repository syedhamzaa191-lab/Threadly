'use client'

interface NotificationToastProps {
  senderName: string
  content: string
  onDismiss: () => void
  onClick: () => void
}

export function NotificationToast({ senderName, content, onDismiss, onClick }: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in">
      <button
        onClick={onClick}
        className="flex items-start gap-3 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-toast border border-gray-100/80 max-w-[360px] hover:bg-white transition-all duration-200 text-left"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-glow">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-900">{senderName}</p>
          <p className="text-[12px] text-gray-500 truncate mt-0.5">{content}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </button>
    </div>
  )
}
