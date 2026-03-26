'use client'

import { RefObject } from 'react'

interface FormattingToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  content: string
  onContentChange: (content: string) => void
}

export function FormattingToolbar({ textareaRef, content, onContentChange }: FormattingToolbarProps) {
  function wrapSelection(before: string, after: string) {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end)
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end)
    onContentChange(newContent)
    requestAnimationFrame(() => {
      textarea.focus()
      if (selected.length > 0) {
        textarea.setSelectionRange(start + before.length, end + before.length)
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length)
      }
    })
  }

  return (
    <div className="flex items-center gap-0.5 px-2.5 py-1.5 border-b border-white/[0.06]">
      <ToolbarButton title="Bold" onClick={() => wrapSelection('**', '**')}>
        <span className="font-extrabold text-[13px]">B</span>
      </ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => wrapSelection('*', '*')}>
        <span className="italic text-[13px] font-semibold">I</span>
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" onClick={() => wrapSelection('~~', '~~')}>
        <span className="line-through text-[13px] font-semibold">S</span>
      </ToolbarButton>
      <div className="w-px h-4 bg-white/[0.08] mx-1" />
      <ToolbarButton title="Code" onClick={() => wrapSelection('`', '`')}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Code block" onClick={() => wrapSelection('```\n', '\n```')}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h8" />
        </svg>
      </ToolbarButton>
      <div className="w-px h-4 bg-white/[0.08] mx-1" />
      <ToolbarButton title="Link" onClick={() => wrapSelection('[', '](url)')}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150"
    >
      {children}
    </button>
  )
}
