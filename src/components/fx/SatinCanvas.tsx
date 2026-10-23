import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { createFrameMonitor, isLowPower, onLowPower } from '../../lib/performance'

/*
 * Satén ciruela líquido en WebGL: la tela drapeada de la identidad de Toro Roso Studio,
 * en movimiento. Se dibuja a media resolución (la tela es suave, no lo nota el ojo),
 * se pausa fuera de pantalla y queda estático con "reducir movimiento".
 */

const VERTEX = `attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform float uScale;

float fold(vec2 p, float t) {
  float v = sin(p.x * 1.1 + t * 0.21 + sin(p.y * 0.85 + t * 0.13) * 1.6) * 0.62;
  v += sin(p.y * 1.65 - t * 0.17 + sin(p.x * 1.25 - t * 0.11) * 1.3) * 0.34;
  v += sin((p.x * 0.9 + p.y * 1.4) * 1.9 + t * 0.29) * 0.14;
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y) * uScale;
  p += (uMouse - 0.5) * vec2(0.4, -0.4);
  float t = uTime;
  vec2 q = p + vec2(sin(p.y * 0.7 + t * 0.07), cos(p.x * 0.6 - t * 0.06)) * 0.55;

  float e = 0.02;
  float h = fold(q, t);
  vec3 n = normalize(vec3(
    (h - fold(q + vec2(e, 0.0), t)) / e * 0.7,
    (h - fold(q + vec2(0.0, e), t)) / e * 0.7,
    1.0));
  vec3 light = normalize(vec3(-0.45, 0.62, 0.65));
  float diff = max(dot(n, light), 0.0);
  float spec = pow(max(dot(n, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 56.0);
  float rim = pow(clamp(1.0 - n.z, 0.0, 1.0), 1.6);

  vec3 deep  = vec3(0.016, 0.006, 0.014);
  vec3 plum  = vec3(0.150, 0.052, 0.128);
  vec3 satin = vec3(0.360, 0.165, 0.300);
  vec3 rose  = vec3(0.718, 0.514, 0.616);
  vec3 pearl = vec3(0.985, 0.910, 0.950);

  vec3 col = mix(deep, plum, smoothstep(0.15, 0.9, diff));
  col = mix(col, satin, smoothstep(0.62, 1.0, diff) * 0.55);
  col += rose * rim * 0.12;
  col += mix(rose, pearl, 0.5) * spec * 0.32;

  float vignette = 1.0 - smoothstep(0.2, 1.1, length((uv - 0.5) * vec2(1.05, 1.0)));
  col *= mix(0.3, 1.0, vignette) * uIntensity;
  gl_FragColor = vec4(col, 1.0);
}`

interface SatinCanvasProps {
  className?: string
  /** Brillo general (1 = normal). */
  intensity?: number
  /** Velocidad del movimiento (1 = normal). */
  speed?: number
  /** Tamaño de los pliegues: más alto = pliegues más pequeños. */
  scale?: number
}

export function SatinCanvas({ className, intensity = 1, speed = 1, scale = 2.4 }: SatinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!canvas || !gl || gl.isContextLost()) return

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
    }
    const vs = compile(gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT)
    const program = gl.createProgram()
    if (!vs || !fs || !program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uMouse = gl.getUniformLocation(program, 'uMouse')
    gl.uniform1f(gl.getUniformLocation(program, 'uIntensity'), intensity)
    gl.uniform1f(gl.getUniformLocation(program, 'uScale'), scale)

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }
    const start = performance.now() - 8_000
    // Imagen fija con "reducir movimiento" o en modo liviano.
    let still = Boolean(reduceMotion) || isLowPower()
    const monitor = createFrameMonitor()
    const draw = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.035
      mouse.y += (mouse.ty - mouse.y) * 0.035
      gl.uniform1f(uTime, ((now - start) / 1000) * speed)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      // Siempre: los uniforms pertenecen a cada programa y el efecto puede re-ejecutarse
      // sobre el mismo canvas (StrictMode o cambio de opciones) sin que cambie su tamaño.
      gl.viewport(0, 0, width, height)
      gl.uniform2f(uRes, width, height)
      if (still) draw(performance.now())
    }

    let raf = 0
    let visible = true
    function loop(now: number) {
      if (!visible || document.hidden) {
        raf = 0
        return
      }
      monitor(now)
      draw(now)
      raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (!still && visible && !document.hidden && !raf) raf = requestAnimationFrame(loop)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        wake()
      },
      { rootMargin: '120px' },
    )
    intersectionObserver.observe(canvas)
    const onPointerMove = (event: PointerEvent) => {
      mouse.tx = event.clientX / window.innerWidth
      mouse.ty = event.clientY / window.innerHeight
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', wake)
    // Si el navegador libera la GPU, se oculta el canvas y queda el degradado de respaldo.
    const onContextLost = (event: Event) => {
      event.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
      canvas.dataset.ready = 'false'
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    const offLowPower = onLowPower(() => {
      still = true
      cancelAnimationFrame(raf)
      raf = 0
    })

    resize()
    draw(performance.now())
    canvas.dataset.ready = 'true'
    wake()

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', wake)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      offLowPower()
      // Libera la GPU solo si el canvas salió del documento (en StrictMode el mismo canvas se reutiliza).
      window.setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
      }, 0)
    }
  }, [intensity, speed, scale, reduceMotion])

  return (
    <div aria-hidden className={cn('satin-fallback pointer-events-none overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full opacity-0 transition-opacity duration-1400 data-[ready=true]:opacity-100"
      />
    </div>
  )
}
