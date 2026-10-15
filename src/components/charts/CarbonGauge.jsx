import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import CountUp from '../CountUp'
import { carbonBand } from '../../lib/gridModel'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const MAX = 700 // g/kWh at the far end of the dial
const CX = 120
const CY = 120
const R = 92

// Half-circle arc, left → right across the top.
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

/** CarbonGauge — a dial for grams of CO₂ per kWh: sage (clean) → amber → sunset (heavy). */
export default function CarbonGauge({ value }) {
  const fill = useRef(null)
  const needle = useRef(null)
  const reduced = useReducedMotion()
  const band = carbonBand(value)
  const frac = Math.min(1, Math.max(0, value / MAX))
  const tone = band.tone === 'leaf' ? '#9CBA94' : band.tone === 'sun' ? '#FFB038' : '#FF7A3D'

  useEffect(() => {
    const f = fill.current
    const n = needle.current
    if (!f || !n) return undefined
    if (reduced) {
      gsap.set(f, { attr: { 'stroke-dashoffset': 1 - frac } })
      gsap.set(n, { rotation: -90 + frac * 180, svgOrigin: `${CX} ${CY}` })
      return undefined
    }
    const tl = gsap.timeline({ defaults: { duration: 1.6, ease: 'elastic.out(1, 0.65)' } })
    tl.to(f, { attr: { 'stroke-dashoffset': 1 - frac }, ease: 'power3.out' }, 0)
    tl.to(n, { rotation: -90 + frac * 180, svgOrigin: `${CX} ${CY}` }, 0)
    return () => tl.kill()
  }, [frac, reduced])

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 150" className="w-full max-w-[340px]" role="img" aria-label={`Carbon intensity gauge: ${Math.round(value)} grams per kilowatt-hour, ${band.label}`}>
        <path d={ARC} fill="none" stroke="rgb(255 214 170 / 0.08)" strokeWidth="16" />
        <path ref={fill} d={ARC} fill="none" stroke={tone} strokeWidth="16" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
        {/* Needle points straight up at rotation 0; the dial spans -90°…+90°. */}
        <g ref={needle} transform={`rotate(-90 ${CX} ${CY})`}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 24} stroke="#FCF3E6" strokeWidth="3" strokeLinecap="round" />
          <circle cx={CX} cy={CY} r="8" fill="#FCF3E6" />
          <circle cx={CX} cy={CY} r="3" fill="#1A1512" />
        </g>
        <text x={CX - R} y={CY + 24} textAnchor="middle" fontSize="11" fill="#B7A896" fontFamily="Inter, sans-serif">0</text>
        <text x={CX + R} y={CY + 24} textAnchor="middle" fontSize="11" fill="#B7A896" fontFamily="Inter, sans-serif">{MAX}+</text>
      </svg>
      <div className="mt-1 text-center">
        <div className="numeral text-6xl">
          <CountUp value={value} />
          <span className="ml-2 text-xs font-bold uppercase tracking-wider text-mute">g CO₂/kWh</span>
        </div>
        <div className="mt-2 text-sm font-medium" style={{ color: band.tone === 'leaf' ? 'rgb(var(--c-sage))' : band.tone === 'sun' ? 'rgb(var(--c-amber))' : 'rgb(var(--c-sunset))' }}>
          {band.label}
        </div>
      </div>
    </div>
  )
}
