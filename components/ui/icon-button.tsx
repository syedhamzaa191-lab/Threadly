'use client'

import { ButtonHTMLAttributes } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'filled' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const variantClasses = {
  ghost: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700 active:bg-gray-200',
  filled: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 active:opacity-80 shadow-glow',
  outline: 'border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-gray-700',
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-xl flex items-center justify-center transition-all duration-150 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
