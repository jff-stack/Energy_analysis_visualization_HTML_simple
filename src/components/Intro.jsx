import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Intro — the opening sequence. A heavy counter runs 000 → 100 under the
 * wordmark, then the obsidian curtain wipes upward to reveal the hero.
 * Shown once per session; skipped entirely for reduced-motion users.
 */
export default function Intro({ onDone }) {
  const root = useRef(null)
  const count = useRef(null)
  const bar = useRef(null)

  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden' // no scrolling behind the curtain

    const state = { v: 0 }
    const tl = gsap.timeline({
      onComplete: () => {
        html.style.overflow = prev
        onDone()
      },
    })
    tl.fromTo('[data-intro-word] > span', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.06 }, 0)
      .to(state, {
        v: 100,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (count.current) count.current.textContent = String(Math.round(state.v)).padStart(3, '0')
          if (bar.current) bar.current.style.transform = `scaleX(${state.v / 100})`
        },
      }, 0.1)
      .to('[data-intro-word] > span', { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.04 }, 1.75)
      .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.95, ease: 'expo.inOut' }, 2.0)

    return () => {
      tl.kill()
      html.style.overflow = prev
    }
  }, [onDone])

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-void p-5 sm:p-8"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-amber">
        <span>Current</span>
        <span>Live grid explainer</span>
      </div>

      <div>
        <div data-intro-word className="overflow-hidden">
          <span className="display block text-[clamp(4rem,17vw,16rem)]">The grid</span>
        </div>
        <div data-intro-word className="overflow-hidden">
          <span className="display block text-[clamp(4rem,17vw,16rem)] text-amber">in motion</span>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <span ref={count} className="numeral text-[clamp(3rem,8vw,6rem)] tabular-nums">000</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-mute">Loading live data</span>
        </div>
        <div className="h-px w-full bg-orange-900/60">
          <div ref={bar} className="h-full origin-left bg-amber " style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  )
}
