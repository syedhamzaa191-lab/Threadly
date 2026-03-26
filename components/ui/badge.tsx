'use client'

interface BadgeProps {
  count: number
  variant?: 'primary' | 'muted'
}

export function Badge({ count, variant = 'primary' }: BadgeProps) {
  if (count <= 0) return null

  const variantClasses = {
    primary: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm',
    muted: 'bg-white/20 text-white/90',
  }

  return (
    <span
      className={`${variantClasses[variant]} text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
