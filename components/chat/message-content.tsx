'use client'

import React from 'react'

// Simple markdown-like renderer — handles bold, italic, strikethrough, code, links
export function MessageContent({ content }: { content: string }) {
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
  // Pattern order matters: bold before italic
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\~\~(.+?)\~\~)|(`([^`]+?)`)|(\[([^\]]+?)\]\(([^)]+?)\))/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Bold **text**
      result.push(<strong key={match.index} className="font-bold">{match[2]}</strong>)
    } else if (match[3]) {
      // Italic *text*
      result.push(<em key={match.index} className="italic">{match[4]}</em>)
    } else if (match[5]) {
      // Strikethrough ~~text~~
      result.push(<s key={match.index} className="line-through">{match[6]}</s>)
    } else if (match[7]) {
      // Inline code `text`
      result.push(
        <code key={match.index} className="bg-white/[0.06] text-purple-200 px-1.5 py-0.5 rounded text-[12px] font-mono">
          {match[8]}
        </code>
      )
    } else if (match[9]) {
      // Link [text](url)
      result.push(
        <a
          key={match.index}
          href={match[11]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-300 hover:text-purple-200 underline decoration-purple-500/30 hover:decoration-purple-400/50 transition-colors"
        >
          {match[10]}
        </a>
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
