'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-lg',
}

const dotSizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const colors = [
  'bg-[#e74c5a] text-white',
  'bg-[#3b82f6] text-white',
  'bg-[#10b981] text-white',
  'bg-[#f59e0b] text-white',
  'bg-[#8b5cf6] text-white',
  'bg-[#ec4899] text-white',
  'bg-[#6366f1] text-white',
  'bg-[#f97316] text-white',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, name, size = 'md', online }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const showImage = src && !imgError

  return (
    <div className="relative inline-flex shrink-0">
      {showImage ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${getColor(name)} rounded-full flex items-center justify-center font-bold`}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizeClasses[size]} rounded-full border-2 border-white ${
            online ? 'bg-emerald-400' : 'bg-gray-300'
          }`}
        />
      )}
    </div>
  )
}
