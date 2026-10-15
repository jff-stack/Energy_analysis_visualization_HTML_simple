import { useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Term from './Term'
import { Swatch } from './charts/PatternDefs'
import { demandShape } from '../lib/gridModel'
import { smoothLine } from '../lib/curve'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

/**
 * GridStory — a pinned, scroll-scrubbed lesson in four chapters.
 *
 * One SVG "day" is built up as you scroll: demand → base load → the evening
 * peak → renewables arriving to carry some of that load. A single GSAP
 * timeline is scrubbed by ScrollTrigger; Lenis (see SmoothScroll) supplies
 * the smoothed scroll position.
 */
const VB_W = 800
const VB_H = 360
const X0 = 40
const X1 = 760
const BASE_Y = 316
const PLOT_H = 250
const BASE_LEVEL = 0.58 // share of plot height that is "always on"

const xOf = (h) => X0 + (h / 24) * (X1 - X0)
const yOf = (f) => BASE_Y - f * PLOT_H
const hours = Array.from({ length: 49 }, (_, i) => i / 2)

const CHAPTERS = [
  {
    n: '01',
    title: 'Demand follows the day.',
    body: (
      <>
        A regional grid supplies homes, transit and industry from one shared network. Aggregate demand rises and falls
        on a daily rhythm, and supply has to match it second by second.
      </>
    ),
  },
  {
    n: '02',
    title: 'A floor that never drops.',
    body: (
      <>
        Overnight, demand does not fall to zero. Refrigeration, hospitals and industry set a minimum known as{' '}
        <Term k="baseLoad">base load</Term>, traditionally met by large plants that run continuously.
      </>
    ),
  },
  {
    n: '03',
    title: 'The evening peak.',
    body: (
      <>
        As people return home, cooking, heating and charging push demand to its daily maximum. Serving a short{' '}
        <Term k="peakDemand">peak</Term> means calling on the most expensive and carbon-intensive generators.
      </>
    ),
  },
  {
    n: '04',
    title: 'Weather joins the supply.',
    body: (
      <>
        Wind and solar have no fuel cost, so they dispatch first in the <Term k="meritOrder">merit order</Term>. The
        more they produce, the less gas the grid burns, which lowers both price and emissions.
      </>
    ),
  },
]

export default function GridStory() {
  const root = useRef(null)
  const reduced = useReducedMotion()

  // Geometry comes from the same demand model the dashboard uses.
  const shapes = useMemo(() => {
    const line = smoothLine(hours.map((h) => [xOf(h), yOf(demandShape(h))]))
    const area = `${line}L${X1},${BASE_Y}L${X0},${BASE_Y}Z`
    const yb = yOf(BASE_LEVEL)
    const sun = smoothLine(
      hours.map((h) => [xOf(h), yOf(BASE_LEVEL + 0.36 * Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)))]),
    )
    const wind = smoothLine(
      hours.map((h) => [xOf(h), yOf(BASE_LEVEL + 0.1 + 0.07 * Math.sin(h * 0.9) + 0.04 * Math.sin(h * 2.1))]),
    )
    return {
      line,
      area,
      sunPath: `${sun}L${X1},${yb}L${X0},${yb}Z`,
      windPath: `${wind}L${X1},${yb}L${X0},${yb}Z`,
    }
  }, [])

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return undefined
    const q = gsap.utils.selector(el)

    const ctx = gsap.context(() => {
      const chapters = q('[data-chapter]')
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

      gsap.set(q('[data-line]'), { attr: { 'stroke-dashoffset': 1 } })
      gsap.set(q('[data-demand-area]'), { opacity: 0 })
      gsap.set(q('[data-base]'), { scaleY: 0, svgOrigin: `0 ${BASE_Y}` })
      gsap.set(q('[data-peak]'), { opacity: 0 })
      gsap.set(q('[data-solar], [data-wind]'), { scaleY: 0, svgOrigin: `0 ${yOf(BASE_LEVEL)}` })
      gsap.set(chapters, { autoAlpha: 0, y: 28 })
      gsap.set(chapters[0], { autoAlpha: 1, y: 0 })

      // Chapter 1 — the day's demand curve is drawn.
      tl.to(q('[data-line]'), { attr: { 'stroke-dashoffset': 0 }, duration: 1 }, 0)
        .to(q('[data-demand-area]'), { opacity: 1, duration: 0.6 }, 0.5)
      // Chapter 2 — the base load floor rises.
      tl.to(chapters[0], { autoAlpha: 0, y: -28, duration: 0.3 }, 1.05)
        .to(chapters[1], { autoAlpha: 1, y: 0, duration: 0.3 }, 1.2)
        .to(q('[data-base]'), { scaleY: 1, duration: 0.9, ease: 'power3.out' }, 1.2)
      // Chapter 3 — the peak lights up.
      tl.to(chapters[1], { autoAlpha: 0, y: -28, duration: 0.3 }, 2.15)
        .to(chapters[2], { autoAlpha: 1, y: 0, duration: 0.3 }, 2.3)
        .to(q('[data-peak]'), { opacity: 1, duration: 0.7 }, 2.3)
      // Chapter 4 — renewables arrive and the fossil peak shrinks.
      tl.to(chapters[2], { autoAlpha: 0, y: -28, duration: 0.3 }, 3.25)
        .to(chapters[3], { autoAlpha: 1, y: 0, duration: 0.3 }, 3.4)
        .to(q('[data-solar]'), { scaleY: 1, duration: 0.9, ease: 'power3.out' }, 3.4)
        .to(q('[data-wind]'), { scaleY: 1, duration: 0.9, ease: 'power3.out' }, 3.55)
        .to(q('[data-peak]'), { opacity: 0.25, duration: 0.9 }, 3.5)
      tl.to({}, { duration: 0.5 }) // a little rest at the end

      const dots = q('[data-dot]')
      tl.eventCallback('onUpdate', () => {
        const t = tl.time()
        const idx = t < 1.1 ? 0 : t < 2.2 ? 1 : t < 3.3 ? 2 : 3
        dots.forEach((d, i) => {
          d.style.background = i <= idx ? 'rgb(var(--c-amber))' : 'rgb(124 45 18 / 0.6)'
        })
      })

      if (reduced) {
        tl.progress(1)
        gsap.set(chapters, { autoAlpha: 1, y: 0, position: 'relative' })
        return
      }

      ScrollTrigger.create({
        animation: tl,
        trigger: el,
        start: 'top top',
        end: '+=320%',
        pin: true,
        scrub: 0.9, // a touch of inertia so scrubbing feels fluid, not mechanical
        anticipatePin: 1,
      })
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={root} id="story" className="relative flex min-h-screen items-center overflow-hidden border-t border-orange-900/50" aria-label="How the grid works, in four steps">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          {/* Progress sits above the text, in its own row, so it can never collide with a chapter. */}
          <div className="mb-8 flex items-center gap-4">
            <span className="eyebrow">01 / The grid story</span>
            <div className="flex flex-1 gap-1.5" aria-hidden="true">
              {CHAPTERS.map((c) => (
                <span key={c.n} data-dot className="h-[3px] flex-1 transition-colors duration-500" style={{ background: 'rgb(124 45 18 / 0.6)' }} />
              ))}
            </div>
          </div>
          <div className={`relative ${reduced ? 'space-y-10' : 'h-[24rem] sm:h-[22rem]'}`}>
            {CHAPTERS.map((c) => (
              <div key={c.n} data-chapter className={reduced ? '' : 'absolute inset-x-0 top-0'}>
                <span className="eyebrow">{c.n} / 04</span>
                <h2 className="display mt-3 text-5xl sm:text-7xl">{c.title}</h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/75">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="slab p-4 sm:p-6">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="A day of electricity demand, built up in layers">
            <defs>
              <clipPath id="story-under-demand">
                <path d={shapes.area} />
              </clipPath>
              <clipPath id="story-above-base">
                <rect x="0" y="0" width={VB_W} height={yOf(BASE_LEVEL)} />
              </clipPath>
            </defs>

            {[0.25, 0.5, 0.75, 1].map((f) => (
              <line key={f} x1={X0} x2={X1} y1={yOf(f)} y2={yOf(f)} stroke="rgb(255 214 170 / 0.09)" />
            ))}
            <line x1={X0} x2={X1} y1={BASE_Y} y2={BASE_Y} stroke="rgb(255 214 170 / 0.3)" />

            <path data-demand-area d={shapes.area} fill="rgb(255 214 170 / 0.08)" />
            {/* Base load: the floor */}
            <g clipPath="url(#story-under-demand)">
              <rect data-base x={X0} y={yOf(BASE_LEVEL)} width={X1 - X0} height={BASE_LEVEL * PLOT_H} fill="#6B4A2C" />
            </g>
            {/* Peak: demand above the floor, in sunset */}
            <g clipPath="url(#story-above-base)">
              <g clipPath="url(#story-under-demand)">
                <rect data-peak x={X0} y="0" width={X1 - X0} height={BASE_Y} fill="#D9501F" />
              </g>
            </g>
            {/* Renewables slide in on top of the base load, never above demand */}
            <g clipPath="url(#story-under-demand)">
              <path data-solar d={shapes.sunPath} fill="#FFB038" fillOpacity="0.95" />
              <path data-wind d={shapes.windPath} fill="#F6E2A8" fillOpacity="0.9" />
            </g>
            <path data-line d={shapes.line} fill="none" stroke="#FCF3E6" strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />

            {[0, 6, 12, 18, 24].map((h) => (
              <text key={h} x={xOf(h)} y={BASE_Y + 24} textAnchor="middle" fontSize="12" fill="#B7A896" fontFamily="Inter, sans-serif">
                {String(h % 24).padStart(2, '0')}:00
              </text>
            ))}
          </svg>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-mute">
            <span className="flex items-center gap-1.5"><Swatch fill="#6B4A2C" />Base load</span>
            <span className="flex items-center gap-1.5"><Swatch fill="#D9501F" />Peak (gas &amp; coal)</span>
            <span className="flex items-center gap-1.5"><Swatch fill="#FFB038" />Solar</span>
            <span className="flex items-center gap-1.5"><Swatch fill="#F6E2A8" />Wind</span>
          </div>
        </div>
      </div>
    </section>
  )
}
