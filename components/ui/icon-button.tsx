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
  ghost: 'hover:bg-gray-100 text-gray-900 active:bg-gray-200',
  filled: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700',
  outline: 'border border-gray-200 hover:bg-gray-50 text-gray-900',
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
