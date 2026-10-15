import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * CountUp — ticks a number from its previous value to the new one with GSAP.
 * Writes straight to the DOM node (no React re-render per frame).
 */
export default function CountUp({ value, decimals = 0, duration = 1.1, prefix = '', className }) {
  const ref = useRef(null)
  const last = useRef(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const fmt = (n) => `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
    if (reduced || !Number.isFinite(value)) {
      el.textContent = fmt(Number.isFinite(value) ? value : 0)
      last.current = value
      return undefined
    }
    const state = { v: last.current }
    const tween = gsap.to(state, {
      v: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = fmt(state.v)
      },
      onComplete: () => {
        last.current = value
      },
    })
    return () => {
      tween.kill()
      last.current = state.v
    }
  }, [value, decimals, duration, prefix, reduced])

  return <span ref={ref} className={`tabular-nums ${className ?? ''}`}>0</span>
}
