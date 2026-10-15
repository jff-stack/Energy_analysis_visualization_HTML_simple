import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SOURCES } from './palette'
import { Swatch } from './PatternDefs'
import { smoothBand, smoothLine } from '../../lib/curve'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * ForecastChart — a hand-built stacked-area SVG of the grid across 48 hours.
 *
 * Layers stack bottom→top in merit order and are drawn with monotone curves,
 * so the bands flow rather than step. A GSAP clip rect wipes the chart in, the
 * scrubber is spring-smoothed, and the whole plot carries a soft bloom.
 */
const W = 800
const H = 320
const PAD = { t: 18, r: 8, b: 30, l: 8 }
const BEFORE = 12
const SPAN = 48

export default function ForecastChart({ hourly, nowIndex, replayKey }) {
  const uid = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const clipRef = useRef(null)
  const [hover, setHover] = useState(null)

  const rows = useMemo(() => {
    const start = Math.max(0, nowIndex - BEFORE)
    return hourly.slice(start, start + SPAN).map((r, i) => ({ ...r, i, isNow: start + i === nowIndex }))
  }, [hourly, nowIndex])

  const nowI = Math.max(0, rows.findIndex((r) => r.isNow))

  const geometry = useMemo(() => {
    const max = Math.max(...rows.map((r) => Math.max(r.demand, r.nuclear + r.hydro + r.wind + r.solar + r.fossil))) * 1.08
    const x = (i) => PAD.l + (i / (rows.length - 1)) * (W - PAD.l - PAD.r)
    const y = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
    const base = rows.map(() => 0)
    const layers = SOURCES.map((s) => {
      const lower = base.slice()
      const upper = rows.map((r, i) => lower[i] + r[s.key])
      upper.forEach((v, i) => (base[i] = v))
      return {
        s,
        d: smoothBand(upper.map((v, i) => [x(i), y(v)]), lower.map((v, i) => [x(i), y(v)])),
      }
    })
    return { layers, demandPath: smoothLine(rows.map((r, i) => [x(i), y(r.demand)])), x, y, max }
  }, [rows])

  // Wipe-in on mount, region change and refresh.
  useEffect(() => {
    const clip = clipRef.current
    if (!clip) return undefined
    if (reduced) {
      gsap.set(clip, { attr: { width: W } })
      return undefined
    }
    const t = gsap.fromTo(clip, { attr: { width: 0 } }, { attr: { width: W }, duration: 1.8, ease: 'power3.inOut' })
    return () => t.kill()
  }, [replayKey, reduced])

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (rows.length - 1))
    setHover(Math.min(rows.length - 1, Math.max(0, i)))
  }

  const row = rows[hover ?? nowI] ?? rows[0]
  const label = row.isNow ? 'Now' : row.i < nowI ? 'Earlier' : 'Forecast'
  const nowX = geometry.x(nowI)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gold/80">
            {label} · {String(Math.floor(row.hour)).padStart(2, '0')}:00
          </div>
          <div className="mt-1 text-sm text-mute">
            <span className="font-semibold tabular-nums text-ink">{Math.round(row.demand).toLocaleString()} MW</span> demand
            <span className="mx-2 text-white/20">·</span>
            <span className="font-semibold tabular-nums text-ink">${Math.round(row.price)}</span>/MWh
            <span className="mx-2 text-white/20">·</span>
            <span className="font-semibold tabular-nums text-ink">{Math.round(row.carbon)}</span> g CO₂/kWh
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-mute">
          {SOURCES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <Swatch fill={s.fill} />
              {s.label}
              <span className="tabular-nums text-ink/90">{Math.round(row[s.key]).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y select-none"
        role="img"
        aria-label="Stacked area chart of modelled electricity generation by source over 48 hours"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect ref={clipRef} x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => {
          const yy = geometry.y(geometry.max * f)
          return <line key={f} x1={PAD.l} x2={W - PAD.r} y1={yy} y2={yy} stroke="rgb(255 214 170 / 0.09)" />
        })}

        <g clipPath={`url(#clip-${uid})`}>
          {geometry.layers.map(({ s, d }) => (
            <path key={s.key} d={d} fill={s.fill} fillOpacity="0.92" />
          ))}
          <path d={geometry.demandPath} fill="none" stroke="#FCF3E6" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" />
        </g>

        {/* Now marker */}
        <line x1={nowX} x2={nowX} y1={PAD.t} y2={H - PAD.b} stroke="#FFB038" strokeWidth="1.5" />
        <circle cx={nowX} cy={PAD.t} r="4" fill="#FFB038" />
        {hover !== null && (
          <line x1={geometry.x(hover)} x2={geometry.x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#FCF3E6" strokeWidth="1.5" strokeOpacity="0.85" />
        )}

        {rows.map((r, i) =>
          r.hour % 6 === 0 ? (
            <text key={i} x={geometry.x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#B7A896" fontFamily="Inter, sans-serif">
              {String(r.hour).padStart(2, '0')}:00
            </text>
          ) : null,
        )}
      </svg>
      <p className="mt-3 text-xs text-mute">Dotted line is demand. Hover or drag across the chart to read any hour.</p>
    </div>
  )
}
