'use client'

import React, { useState } from 'react'

// Simple markdown-like renderer — handles bold, italic, strikethrough, code, links
export function MessageContent({ content }: { content: string }) {
  // Check if forwarded message
  const forwardMatch = content.match(/^↪️ Forwarded from (.+?):\n([\s\S]+)$/)
  if (forwardMatch) {
    const senderName = forwardMatch[1]
    const msgContent = forwardMatch[2]
    return (
      <div className="mt-1 border-l-[3px] border-violet-500/50 bg-violet-500/5 rounded-r-xl px-4 py-3 max-w-[400px]">
        <div className="flex items-center gap-2 mb-1.5">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <span className="text-[11px] text-violet-400 font-semibold">Forwarded from {senderName}</span>
        </div>
        <span className="whitespace-pre-wrap break-words leading-relaxed text-white/70">{parseContent(msgContent)}</span>
      </div>
    )
  }

  const elements = parseContent(content)
  return <span className="whitespace-pre-wrap break-words leading-relaxed">{elements}</span>
}

function parseContent(text: string): React.ReactNode[] {
  // Split by code blocks first (```)
  const codeBlockParts = text.split(/(```[\s\S]*?```)/g)

  return codeBlockParts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\n/, '')
      return (
        <pre key={i} className="bg-black/30 text-purple-100 rounded-lg px-4 py-3 my-2 text-[12px] font-mono overflow-x-auto leading-relaxed border border-white/[0.06]">
          <code>{code}</code>
        </pre>
      )
    }
    return <span key={i}>{parseInline(part)}</span>
  })
}

function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  // Match mentions, links, then formatting
  const regex = /(<@[a-f0-9-]+\|([^>]+)>)|(\[([^\]]+?)\]\((https?:\/\/[^)]+)\))|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(\~\~(.+?)\~\~)|(`([^`]+?)`)/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // @Mention <@id|name>
      result.push(
        <span key={match.index} className="text-purple-300 bg-purple-500/10 px-1 rounded font-semibold">@{match[2]}</span>
      )
    } else if (match[3]) {
      // Link [text](url)
      const linkText = match[4]
      const linkUrl = match[5]

      // Image
      if (linkText === 'Image') {
        result.push(<ImagePreview key={match.index} src={linkUrl} />)
      }
      // Voice message
      else if (linkText === 'Voice Message') {
        result.push(
          <div key={match.index} className="flex items-center gap-3 mt-1 px-4 py-3 bg-white/[0.04] rounded-xl border border-white/[0.06] max-w-[320px]">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <audio controls src={linkUrl} className="flex-1 h-8 [&::-webkit-media-controls-panel]:bg-transparent" />
          </div>
        )
      }
      // Video message
      else if (linkText === 'Video Message') {
        result.push(
          <video key={match.index} src={linkUrl} controls className="max-w-[320px] rounded-xl mt-1 border border-white/[0.06]" />
        )
      }
      // Regular link
      else {
        result.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-purple-200 underline decoration-purple-500/30 hover:decoration-purple-400/50 transition-colors"
          >
            {linkText}
          </a>
        )
      }
    } else if (match[6]) {
      // Bold **text**
      result.push(<strong key={match.index} className="font-bold">{match[7]}</strong>)
    } else if (match[8]) {
      // Italic *text*
      result.push(<em key={match.index} className="italic">{match[9]}</em>)
    } else if (match[10]) {
      // Underline __text__
      result.push(<u key={match.index} className="underline">{match[11]}</u>)
    } else if (match[12]) {
      // Strikethrough ~~text~~
      result.push(<s key={match.index} className="line-through">{match[13]}</s>)
    } else if (match[14]) {
      // Inline code `text`
      result.push(
        <code key={match.index} className="bg-white/[0.06] text-purple-200 px-1.5 py-0.5 rounded text-[12px] font-mono">
          {match[15]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result.length > 0 ? result : [text]
}

function ImagePreview({ src }: { src: string }) {
  const [open, setOpen] = useState(false)

  const handleDownload = async () => {
    const res = await fetch(src)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = src.split('/').pop() || 'image'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <img
        src={src}
        alt="Shared image"
        className="max-w-[300px] max-h-[300px] rounded-xl mt-1 cursor-pointer hover:opacity-90 transition-opacity border border-white/[0.06]"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={() => setOpen(false)}>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent z-10" onClick={(e) => e.stopPropagation()}>
            <p className="text-white/60 text-sm font-medium truncate max-w-[50%]">{src.split('/').pop()}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {/* Image */}
          <img src={src} alt="Full image" className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
