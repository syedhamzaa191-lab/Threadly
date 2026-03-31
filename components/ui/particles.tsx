'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  pulse: number
  pulseSpeed: number
  color: string
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    const PARTICLE_COUNT = 90
    const CONNECTION_DIST = 150
    const MOUSE_ATTRACT_DIST = 200
    const MOUSE = { x: -1000, y: -1000, active: false }

    const colors = [
      '200, 180, 255',  // light purple
      '167, 139, 250',  // violet
      '139, 92, 246',   // purple
      '99, 102, 241',   // indigo
      '255, 255, 255',  // white
    ]

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    const createParticles = () => {
      particles = []
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.4 + 0.15,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.015 + 0.008,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        // Mouse attraction — particles gently follow cursor
        if (MOUSE.active) {
          const dx = MOUSE.x - p.x
          const dy = MOUSE.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_ATTRACT_DIST) {
            const force = (1 - dist / MOUSE_ATTRACT_DIST) * 0.015
            p.vx += dx * force
            p.vy += dy * force
          }
        }

        // Friction to prevent runaway speed
        p.vx *= 0.98
        p.vy *= 0.98

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.5) {
          p.vx = (p.vx / speed) * 1.5
          p.vy = (p.vy / speed) * 1.5
        }

        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        // Wrap around edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const pulseOpacity = p.opacity + Math.sin(p.pulse) * 0.12

        // Draw glow first
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color}, ${pulseOpacity * 0.1})`
        ctx.fill()

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color}, ${pulseOpacity})`
        ctx.fill()
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.2
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(167, 139, 250, ${opacity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Draw mouse glow when hovering
      if (MOUSE.active) {
        const gradient = ctx.createRadialGradient(MOUSE.x, MOUSE.y, 0, MOUSE.x, MOUSE.y, MOUSE_ATTRACT_DIST)
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)')
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')
        ctx.beginPath()
        ctx.arc(MOUSE.x, MOUSE.y, MOUSE_ATTRACT_DIST, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw connections from mouse to nearby particles
        for (const p of particles) {
          const dx = MOUSE.x - p.x
          const dy = MOUSE.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_ATTRACT_DIST * 0.8) {
            const opacity = (1 - dist / (MOUSE_ATTRACT_DIST * 0.8)) * 0.3
            ctx.beginPath()
            ctx.moveTo(MOUSE.x, MOUSE.y)
            ctx.lineTo(p.x, p.y)
            ctx.strokeStyle = `rgba(200, 180, 255, ${opacity})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      MOUSE.x = e.clientX - rect.left
      MOUSE.y = e.clientY - rect.top
      MOUSE.active = true
    }

    const handleLeave = () => {
      MOUSE.active = false
    }

    resize()
    createParticles()
    draw()

    window.addEventListener('resize', () => { resize(); createParticles() })
    canvas.addEventListener('mousemove', handleMouse)
    canvas.addEventListener('mouseleave', handleLeave)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouse)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-none"
      style={{ pointerEvents: 'auto' }}
    />
  )
}
