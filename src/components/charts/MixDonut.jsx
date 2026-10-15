import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SOURCES } from './palette'
import { Swatch } from './PatternDefs'
import CountUp from '../CountUp'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const R = 74
const C = 2 * Math.PI * R
const GAP = 4 // px between arcs

/**
 * MixDonut — the generation mix as arcs. Each arc is a circle
 * whose dash length and offset GSAP tweens whenever the mix changes, so the
 * ring flows from one mix to the next instead of snapping.
 */
export default function MixDonut({ mix }) {
  const arcs = useRef({})
  const shown = useRef(Object.fromEntries(SOURCES.map((s) => [s.key, 0])))
  const reduced = useReducedMotion()

  const total = SOURCES.reduce((n, s) => n + mix[s.key], 0) || 1
  const target = Object.fromEntries(SOURCES.map((s) => [s.key, mix[s.key] / total]))

  useEffect(() => {
    const paint = (vals) => {
      let offset = 0
      SOURCES.forEach((s) => {
        const len = Math.max(0.01, vals[s.key] * C - (vals[s.key] > 0.003 ? GAP : 0))
        const el = arcs.current[s.key]
        if (el) {
          el.setAttribute('stroke-dasharray', `${len} ${C - len}`)
          el.setAttribute('stroke-dashoffset', String(-(offset + GAP / 2)))
          el.style.opacity = vals[s.key] > 0.003 ? '1' : '0'
        }
        offset += vals[s.key] * C
      })
    }
    if (reduced) {
      shown.current = { ...target }
      paint(shown.current)
      return undefined
    }
    const t = gsap.to(shown.current, { ...target, duration: 1.4, ease: 'power3.out', onUpdate: () => paint(shown.current) })
    return () => t.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(target), reduced])

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row">
      <div className="relative h-[210px] w-[210px] shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label="Donut chart of the current generation mix">
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgb(255 214 170 / 0.07)" strokeWidth="18" />
          {SOURCES.map((s) => (
            <circle
              key={s.key}
              ref={(el) => (arcs.current[s.key] = el)}
              cx="100" cy="100" r={R} fill="none" stroke={s.fill} strokeWidth="18" strokeLinecap="butt"
              strokeDasharray={`0.01 ${C}`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="numeral text-5xl">
            <CountUp value={mix.renewableShare * 100} />
            <span className="text-2xl text-ink/50">%</span>
          </div>
          <div className="mt-1 text-xs text-mute">renewable</div>
        </div>
      </div>
      <ul className="w-full text-sm">
        {SOURCES.map((s) => (
          <li key={s.key} className="flex items-center gap-3 border-b border-orange-900/40 py-2.5 last:border-0">
            <Swatch fill={s.fill} size={14} />
            <span className="text-ink/90">{s.label}</span>
            <span className="ml-auto tabular-nums text-mute">{Math.round(mix[s.key]).toLocaleString()} MW</span>
            <span className="w-11 text-right font-semibold tabular-nums">{Math.round(target[s.key] * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
