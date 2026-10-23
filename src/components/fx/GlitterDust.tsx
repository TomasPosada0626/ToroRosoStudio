import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { isLowPower, onLowPower } from '../../lib/performance'

/*
 * Polvo de brillo rose gold que flota y titila, como un iluminador en el aire.
 * Partículas pre-renderizadas en sprites para que cueste casi nada dibujarlas.
 */

interface Particle {
  x: number
  y: number
  size: number
  speed: number
  sway: number
  phase: number
  twinkle: number
  star: boolean
  depth: number
}

function makeSprite(star: boolean): HTMLCanvasElement {
  const size = 64
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = size
  const ctx = sprite.getContext('2d')
  if (!ctx) return sprite
  const c = size / 2
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c)
  glow.addColorStop(0, 'rgba(255, 236, 246, 1)')
  glow.addColorStop(0.25, 'rgba(226, 182, 206, 0.55)')
  glow.addColorStop(1, 'rgba(183, 131, 157, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(c, c, star ? c * 0.55 : c, 0, Math.PI * 2)
  ctx.fill()
  if (star) {
    ctx.fillStyle = 'rgba(255, 240, 248, 0.95)'
    ctx.beginPath()
    ctx.moveTo(c, 2)
    ctx.quadraticCurveTo(c, c, size - 2, c)
    ctx.quadraticCurveTo(c, c, c, size - 2)
    ctx.quadraticCurveTo(c, c, 2, c)
    ctx.quadraticCurveTo(c, c, c, 2)
    ctx.fill()
  }
  return sprite
}

export function GlitterDust({ className, density = 1 }: { className?: string; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dot = makeSprite(false)
    const star = makeSprite(true)
    let width = 0
    let height = 0
    let particles: Particle[] = []
    // Imagen fija con "reducir movimiento" o en modo liviano; menos partículas en celulares.
    let still = Boolean(reduceMotion) || isLowPower()
    const touchFactor = window.matchMedia('(pointer: coarse)').matches ? 0.6 : 1

    const spawn = (anywhere: boolean): Particle => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 12,
      size: Math.random() * 5 + 3,
      speed: Math.random() * 0.22 + 0.06,
      sway: Math.random() * 0.7 + 0.2,
      phase: Math.random() * Math.PI * 2,
      twinkle: Math.random() * 1.8 + 0.6,
      star: Math.random() < 0.14,
      depth: Math.random() * 0.8 + 0.2,
    })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(90, Math.round(((width * height) / 15_000) * density * touchFactor))
      particles = Array.from({ length: count }, () => spawn(true))
    }

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const frame = (now: number, moving: boolean) => {
      const t = now / 1000
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        if (moving) {
          p.y -= p.speed
          p.x += Math.sin(t * p.sway + p.phase) * 0.18
          if (p.y < -16) Object.assign(p, spawn(false))
        }
        const glint = 0.25 + 0.75 * Math.pow(Math.sin(t * p.twinkle + p.phase) * 0.5 + 0.5, 3)
        const size = p.star ? p.size * 2.6 : p.size
        ctx.globalAlpha = glint * (p.star ? 0.95 : 0.7)
        ctx.drawImage(
          p.star ? star : dot,
          p.x + pointer.x * 22 * p.depth - size / 2,
          p.y + pointer.y * 14 * p.depth - size / 2,
          size,
          size,
        )
      }
      ctx.globalAlpha = 1
    }

    let raf = 0
    let visible = true
    function loop(now: number) {
      if (!visible || document.hidden) {
        raf = 0
        return
      }
      frame(now, true)
      raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (!still && visible && !document.hidden && !raf) raf = requestAnimationFrame(loop)
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (still) frame(performance.now(), false)
    })
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      wake()
    })
    intersectionObserver.observe(canvas)
    const onPointerMove = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth - 0.5
      pointer.ty = event.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', wake)
    const offLowPower = onLowPower(() => {
      still = true
      cancelAnimationFrame(raf)
      raf = 0
    })

    resize()
    frame(performance.now(), false)
    wake()

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', wake)
      offLowPower()
    }
  }, [density, reduceMotion])

  return <canvas ref={canvasRef} aria-hidden className={cn('pointer-events-none', className)} />
}
