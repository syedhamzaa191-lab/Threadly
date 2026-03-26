import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4b5fd',
          300: '#a78bfa',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#fafafe',
          tertiary: '#f4f4f8',
          hover: '#f0f0f5',
          active: '#e8e8f0',
          border: '#e5e5ef',
        },
        content: {
          DEFAULT: '#1a1a2e',
          secondary: '#64748b',
          tertiary: '#94a3b8',
          inverse: '#ffffff',
        },
        sidebar: {
          bg: '#0f0a1a',
          hover: 'rgba(255,255,255,0.06)',
          active: 'rgba(255,255,255,0.12)',
          border: 'rgba(255,255,255,0.08)',
          text: 'rgba(255,255,255,0.7)',
          'text-active': '#ffffff',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.08)',
        soft: '0 2px 8px rgba(0,0,0,0.06)',
        glow: '0 0 20px rgba(124,58,237,0.15)',
        'glow-lg': '0 0 40px rgba(124,58,237,0.2)',
        premium: '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'premium-hover': '0 8px 40px rgba(0,0,0,0.1)',
        toast: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        toolbar: '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0f0a1a 0%, #1a1030 50%, #0f0a1a 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #130d20 0%, #0f0a1a 100%)',
        'gradient-accent': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #f0f0ff 0%, #faf5ff 100%)',
      },
    },
  },
  plugins: [],
}
export default config
