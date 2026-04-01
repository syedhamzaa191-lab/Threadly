'use client'

import { useState, useRef, FormEvent, useCallback } from 'react'
import { EmojiPicker } from './emoji-picker'

interface MessageInputProps {
  placeholder?: string
  onSend: (content: string) => void
  disabled?: boolean
  members?: { id: string; full_name: string; avatar_url: string | null }[]
  currentUserId?: string
}

export function MessageInput({
  placeholder = 'Type a message...',
  onSend,
  disabled,
  members,
  currentUserId,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showFormatting, setShowFormatting] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()

    // If there's a pending file, upload it first
    if (pendingFile) {
      await handleFileUpload(pendingFile)
      setPendingFile(null)
      setFilePreview(null)
    }

    const editor = editorRef.current
    if (!editor) return
    const markdown = htmlToMarkdown(editor)
    const trimmed = markdown.trim()
    if (!trimmed && !pendingFile) return
    if (trimmed) {
      onSend(trimmed)
    }
    editor.innerHTML = ''
    setContent('')
  }

  const handleInput = () => {
    const editor = editorRef.current
    if (!editor) return
    const text = editor.textContent || ''
    setContent(text)

    // Check for @ mention
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || ''
      const atMatch = textBefore.match(/@(\w*)$/)
      if (atMatch) {
        setMentionQuery(atMatch[1])
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const applyFormat = useCallback((command: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    if (command === 'bold') document.execCommand('bold', false)
    else if (command === 'italic') document.execCommand('italic', false)
    else if (command === 'underline') document.execCommand('underline', false)
    else if (command === 'strikethrough') document.execCommand('strikeThrough', false)
    else if (command === 'orderedlist') document.execCommand('insertOrderedList', false)
    else if (command === 'unorderedlist') document.execCommand('insertUnorderedList', false)
    else if (command === 'code') {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      if (selectedText) {
        const code = document.createElement('code')
        code.className = 'bg-white/[0.08] text-purple-200 px-1.5 py-0.5 rounded text-[12px] font-mono'
        code.textContent = selectedText
        range.deleteContents()
        range.insertNode(code)
        selection.collapseToEnd()
      }
    } else if (command === 'codeblock') {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString() || 'code here'
      const pre = document.createElement('pre')
      pre.className = 'bg-black/30 text-purple-100 rounded-lg px-3 py-2 my-1 text-[12px] font-mono border border-white/[0.06]'
      pre.textContent = selectedText
      range.deleteContents()
      range.insertNode(pre)
      selection.collapseToEnd()
    } else if (command === 'link') {
      const url = prompt('Enter URL:')
      if (url) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString() || url
        const a = document.createElement('a')
        a.href = url
        a.textContent = selectedText
        a.className = 'text-purple-300 underline'
        a.target = '_blank'
        range.deleteContents()
        range.insertNode(a)
        selection.collapseToEnd()
      }
    }
    handleInput()
  }, [])

  // Insert mention
  const insertMention = (user: { id: string; full_name: string }) => {
    const editor = editorRef.current
    if (!editor) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    const textNode = range.startContainer
    const text = textNode.textContent || ''
    const offset = range.startOffset
    const atIdx = text.lastIndexOf('@', offset)

    if (atIdx >= 0) {
      // Replace @query with mention span
      const before = text.slice(0, atIdx)
      const after = text.slice(offset)
      textNode.textContent = before

      const mention = document.createElement('span')
      mention.className = 'text-purple-300 bg-purple-500/10 px-1 rounded font-semibold'
      mention.contentEditable = 'false'
      mention.setAttribute('data-mention-id', user.id)
      mention.textContent = `@${user.full_name}`

      const afterNode = document.createTextNode(after + '\u00A0')

      const parent = textNode.parentNode
      if (parent) {
        parent.insertBefore(mention, textNode.nextSibling)
        parent.insertBefore(afterNode, mention.nextSibling)
        // Move cursor after mention
        const newRange = document.createRange()
        newRange.setStartAfter(afterNode)
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
      }
    }

    setShowMentions(false)
    handleInput()
  }

  // Upload file via API route (server-side, bypasses RLS)
  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Upload failed')
        setUploading(false)
        return
      }

      const { url, type } = await res.json()

      if (type.startsWith('image/')) {
        onSend(`[Image](${url})`)
      } else if (type.startsWith('audio/')) {
        onSend(`[Voice Message](${url})`)
      } else if (type.startsWith('video/')) {
        onSend(`[Video Message](${url})`)
      } else {
        onSend(`[${file.name}](${url})`)
      }
    } catch {
      alert('Upload failed')
    }
    setUploading(false)
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        await handleFileUpload(file)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      alert('Microphone permission denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Filtered members for mention
  const filteredMembers = members?.filter(m =>
    m.id !== currentUserId && m.full_name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 6) || []

  // Recording UI
  if (isRecording) {
    return (
      <div className="px-3 md:px-6 pb-3 md:pb-5 pt-2 bg-[#1e1a2b]">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#2a2540] rounded-xl border border-red-500/30">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white/70 text-sm font-medium flex-1">Recording... {formatTime(recordingTime)}</span>
          <button onClick={cancelRecording} className="px-3 py-1.5 text-white/40 hover:text-white/70 text-sm transition-colors">Cancel</button>
          <button onClick={stopRecording} className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-400 transition-colors">Send</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 md:px-6 pb-3 md:pb-5 pt-2 bg-[#1e1a2b]">
      <div className={`rounded-xl border transition-all duration-200 bg-[#2a2540] relative ${
        isFocused
          ? 'border-purple-500/40 shadow-[0_0_0_2px_rgba(168,85,247,0.1)]'
          : 'border-white/[0.08] hover:border-white/[0.12]'
      }`}>
        {/* Formatting toolbar — toggleable */}
        {showFormatting && (
          <div className="flex items-center gap-0.5 px-2.5 py-1.5 border-b border-white/[0.06]">
            <TBtn title="Bold" onClick={() => applyFormat('bold')}><span className="font-extrabold text-[13px]">B</span></TBtn>
            <TBtn title="Italic" onClick={() => applyFormat('italic')}><span className="italic text-[13px] font-semibold">I</span></TBtn>
            <TBtn title="Underline" onClick={() => applyFormat('underline')}><span className="underline text-[13px] font-semibold">U</span></TBtn>
            <TBtn title="Strikethrough" onClick={() => applyFormat('strikethrough')}><span className="line-through text-[13px] font-semibold">S</span></TBtn>
            <div className="w-px h-4 bg-white/[0.08] mx-1" />
            <TBtn title="Link" onClick={() => applyFormat('link')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </TBtn>
            <div className="w-px h-4 bg-white/[0.08] mx-1" />
            <TBtn title="Numbered list" onClick={() => applyFormat('orderedlist')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M8 6v0M8 12v0M8 18v0" /></svg>
            </TBtn>
            <TBtn title="Bullet list" onClick={() => applyFormat('unorderedlist')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </TBtn>
            <div className="w-px h-4 bg-white/[0.08] mx-1" />
            <TBtn title="Code" onClick={() => applyFormat('code')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </TBtn>
            <TBtn title="Code block" onClick={() => applyFormat('codeblock')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h8" /></svg>
            </TBtn>
          </div>
        )}

        {/* File preview */}
        {pendingFile && (
          <div className="px-3 pt-2.5 flex items-center gap-3">
            <div className="relative inline-flex items-center gap-2.5 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[12px] text-white/60 font-medium truncate max-w-[180px]">{pendingFile.name}</p>
                <p className="text-[10px] text-white/25">{(pendingFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => { setPendingFile(null); setFilePreview(null) }}
                className="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all ml-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Editor area */}
        <div className="flex items-end gap-2 px-3 py-2.5 relative">
          {/* File upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all duration-150 shrink-0"
            title="Upload file"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setPendingFile(f)
                if (f.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = () => setFilePreview(reader.result as string)
                  reader.readAsDataURL(f)
                } else {
                  setFilePreview(null)
                }
              }
              e.target.value = ''
            }}
          />

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
            className="flex-1 bg-transparent text-[14px] text-white/90 resize-none focus:outline-none py-1 max-h-32 overflow-y-auto leading-relaxed [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-white/25 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_s]:line-through [&_strike]:line-through [&_code]:bg-white/[0.08] [&_code]:text-purple-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_code]:font-mono [&_pre]:bg-black/30 [&_pre]:text-purple-100 [&_pre]:rounded-lg [&_pre]:px-3 [&_pre]:py-2 [&_pre]:text-[12px] [&_pre]:font-mono [&_a]:text-purple-300 [&_a]:underline"
          />

          {/* Mention dropdown */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-[#322d45] rounded-xl border border-white/[0.08] shadow-2xl z-50 max-h-[200px] overflow-y-auto scrollbar-dark">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertMention(m) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] text-white/70 font-medium">{m.full_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom toolbar icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Hide/show formatting */}
            <button
              type="button"
              onClick={() => setShowFormatting(!showFormatting)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ${showFormatting ? 'text-purple-400 bg-purple-500/10' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.06]'}`}
              title={showFormatting ? 'Hide formatting' : 'Show formatting'}
            >
              <span className="font-bold text-[12px]">Aa</span>
            </button>

            {/* Emoji */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ${showEmoji ? 'text-purple-400 bg-purple-500/10' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.06]'}`}
                title="Emoji"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={(emoji) => {
                    const editor = editorRef.current
                    if (editor) { editor.focus(); document.execCommand('insertText', false, emoji) }
                    setShowEmoji(false)
                    handleInput()
                  }}
                  onClose={() => setShowEmoji(false)}
                  openUpward={true}
                />
              )}
            </div>

            {/* @ Mention */}
            <button
              type="button"
              onClick={() => {
                const editor = editorRef.current
                if (editor) {
                  editor.focus()
                  document.execCommand('insertText', false, '@')
                  // Show all members immediately
                  setMentionQuery('')
                  setShowMentions(true)
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all duration-150"
              title="Mention someone"
            >
              <span className="font-bold text-[14px]">@</span>
            </button>

            {/* Voice message */}
            <button
              type="button"
              onClick={startRecording}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all duration-150"
              title="Voice message"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Send */}
            <button
              type="submit"
              disabled={disabled || (!content.trim() && !pendingFile)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                content.trim() || pendingFile
                  ? 'bg-purple-600 text-white hover:bg-purple-500 active:scale-95'
                  : 'text-white/15 bg-white/[0.04]'
              }`}
            >
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

function htmlToMarkdown(el: HTMLElement): string {
  let result = ''
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement
      const tag = elem.tagName.toLowerCase()
      // Handle mentions
      if (elem.getAttribute('data-mention-id')) {
        const mentionId = elem.getAttribute('data-mention-id')
        const mentionName = elem.textContent?.replace('@', '') || ''
        result += `<@${mentionId}|${mentionName}>`
        continue
      }
      const inner = htmlToMarkdown(elem)
      if (tag === 'b' || tag === 'strong') result += `**${inner}**`
      else if (tag === 'i' || tag === 'em') result += `*${inner}*`
      else if (tag === 'u') result += `__${inner}__`
      else if (tag === 's' || tag === 'strike' || tag === 'del') result += `~~${inner}~~`
      else if (tag === 'code') result += `\`${inner}\``
      else if (tag === 'pre') result += `\`\`\`\n${inner}\n\`\`\``
      else if (tag === 'a') result += `[${inner}](${(node as HTMLAnchorElement).href})`
      else if (tag === 'br') result += '\n'
      else if (tag === 'li') result += `• ${inner}\n`
      else if (tag === 'ol' || tag === 'ul') result += inner
      else if (tag === 'div' || tag === 'p') result += (result && !result.endsWith('\n') ? '\n' : '') + inner
      else result += inner
    }
  }
  return result
}

function TBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
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
