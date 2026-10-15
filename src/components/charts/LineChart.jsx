import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { smoothBand, smoothLine } from '../../lib/curve'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const W = 560
const H = 210
const PAD = { t: 16, r: 14, b: 28, l: 14 }

/**
 * LineChart — one yearly series as a smooth golden curve that draws itself on
 * (GSAP stroke-dashoffset) over a fading glow. `data` is [{ year, value }].
 */
export default function LineChart({ data, unit = '', decimals = 0, ariaLabel }) {
  const uid = useId().replace(/:/g, '')
  const line = useRef(null)
  const area = useRef(null)
  const reduced = useReducedMotion()
  const [hover, setHover] = useState(null)

  const g = useMemo(() => {
    const years = data.map((d) => d.year)
    const vals = data.map((d) => d.value)
    const lo = Math.min(...vals, 0)
    const hi = Math.max(...vals) * 1.1 || 1
    const x = (yr) => PAD.l + ((yr - years[0]) / Math.max(1, years[years.length - 1] - years[0])) * (W - PAD.l - PAD.r)
    const y = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
    const pts = data.map((d) => [x(d.year), y(d.value)])
    const floor = H - PAD.b
    return {
      x, y,
      d: smoothLine(pts),
      area: smoothBand(pts, pts.map(([px]) => [px, floor])),
    }
  }, [data])

  useEffect(() => {
    if (!line.current || !area.current) return undefined
    if (reduced) {
      gsap.set(line.current, { attr: { 'stroke-dashoffset': 0 } })
      gsap.set(area.current, { opacity: 1 })
      return undefined
    }
    const tl = gsap.timeline()
    tl.fromTo(line.current, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 1.8, ease: 'power2.inOut' })
    tl.fromTo(area.current, { opacity: 0 }, { opacity: 1, duration: 1 }, 0.7)
    return () => tl.kill()
  }, [g, reduced])

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    let best = 0
    data.forEach((d, i) => {
      if (Math.abs(g.x(d.year) - px) < Math.abs(g.x(data[best].year) - px)) best = i
    })
    setHover(best)
  }

  const shown = data[hover ?? data.length - 1]
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const first = data[0]
  const delta = shown.value - first.value

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <span className="numeral text-5xl tabular-nums">{fmt(shown.value)}</span>
        <span className="text-sm text-mute">{unit}</span>
        <span className="text-sm font-medium text-ink/70">{shown.year}</span>
        {shown.year !== first.year && (
          <span className="ml-auto text-xs tabular-nums text-mute">
            {delta > 0 ? '+' : ''}{fmt(delta)} since {first.year}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} stroke="rgb(255 214 170 / 0.09)" />
        ))}
        <path ref={area} d={g.area} fill="#FFB038" fillOpacity="0.14" />
        <path ref={line} d={g.d} fill="none" stroke="#FFB038" strokeWidth="3.5" strokeLinecap="butt" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
        <line x1={g.x(shown.year)} x2={g.x(shown.year)} y1={PAD.t} y2={H - PAD.b} stroke="#FCF3E6" strokeOpacity="0.25" />
        <circle cx={g.x(shown.year)} cy={g.y(shown.value)} r="11" fill="#FFB038" fillOpacity="0.2" />
        <circle cx={g.x(shown.year)} cy={g.y(shown.value)} r="5.5" fill="#FCF3E6" stroke="#FFB038" strokeWidth="2.5" />
        {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) => (
          <text key={d.year} x={g.x(d.year)} y={H - 7} fontSize="11" fill="#B7A896" fontFamily="Inter, sans-serif" textAnchor="middle">{d.year}</text>
        ))}
      </svg>
    </div>
  )
}
