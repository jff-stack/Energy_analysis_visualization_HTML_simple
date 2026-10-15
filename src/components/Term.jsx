import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GLOSSARY } from '../lib/glossary'

const WIDTH = 288
const MARGIN = 12

/**
 * Term — wraps a jargon word and explains it instantly on hover, focus or tap.
 *
 *   <Term k="spotPrice">spot price</Term>
 *
 * The bubble clamps itself inside the viewport so it never clips on phones.
 */
export default function Term({ k, children }) {
  const entry = GLOSSARY[k]
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [shift, setShift] = useState(0)

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const centre = r.left + r.width / 2
    const left = centre - WIDTH / 2
    const right = centre + WIDTH / 2
    const maxRight = window.innerWidth - MARGIN
    if (left < MARGIN) setShift(MARGIN - left)
    else if (right > maxRight) setShift(maxRight - right)
    else setShift(0)
  }, [open])

  if (!entry) return children

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="cursor-help border-b border-dotted border-amber/70 text-inherit transition-colors hover:border-amber hover:text-amber"
        aria-describedby={open ? `tip-${k}` : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
      >
        {children ?? entry.label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={`tip-${k}`}
            role="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.6 }}
            style={{ width: WIDTH, left: '50%', marginLeft: -WIDTH / 2 + shift }}
            className="pointer-events-none absolute bottom-full z-50 mb-3 block border border-amber bg-[#120E0B] p-4 text-left font-sans font-normal normal-case tracking-normal text-ink"
          >
            <span className="block text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber">{entry.label}</span>
            <span className="mt-1 block text-[16px] font-extrabold leading-snug">{entry.short}</span>
            <span className="mt-1.5 block text-[13px] leading-relaxed text-mute">{entry.long}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
