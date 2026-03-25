'use client'

import { useState } from 'react'
import MessageList from '@/components/message/message-list'
import MessageInput from '@/components/message/message-input'
import ThreadPanel from '@/components/message/thread-panel'

type Channel = {
  id: string
  name: string
  description: string
  workspace_id: string
}

export default function ChannelView({ channel }: { channel: Channel }) {
  const [activeThread, setActiveThread] = useState<string | null>(null)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main channel area */}
      <div className="flex-1 flex flex-col">
        {/* Channel header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <span className="text-gray-400 text-lg">#</span>
          <h2 className="font-semibold">{channel.name}</h2>
          {channel.description && (
            <span className="text-sm text-gray-400 ml-2">{channel.description}</span>
          )}
        </div>

        {/* Messages */}
        <MessageList
          channelId={channel.id}
          onThreadClick={(messageId) => setActiveThread(messageId)}
        />

        {/* Input */}
        <MessageInput
          channelId={channel.id}
          placeholder={`Message #${channel.name}`}
        />
      </div>

      {/* Thread panel */}
      {activeThread && (
        <ThreadPanel
          channelId={channel.id}
          threadId={activeThread}
          onClose={() => setActiveThread(null)}
        />
      )}
    </div>
  )
}
