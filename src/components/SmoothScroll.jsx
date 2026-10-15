import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

/**
 * SmoothScroll — mounts Lenis once at the root and hands its clock to GSAP.
 *
 * Why drive Lenis from gsap.ticker? ScrollTrigger reads scroll position on
 * the GSAP tick; feeding Lenis from the same tick keeps pinned sections and
 * scrubbed timelines perfectly in step with the smoothed scroll (no jitter).
 * Users who prefer reduced motion get native scrolling.
 */
export default function SmoothScroll({ children }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [reduced])

  return children
}
