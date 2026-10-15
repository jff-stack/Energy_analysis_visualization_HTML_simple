import { motion } from 'framer-motion'

/** Spinner — an amber square that turns and steps. `label` is read by screen readers. */
export default function Spinner({ size = 34, label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center ${className}`}>
      <motion.span
        aria-hidden="true"
        className="block"
        style={{
          width: size,
          height: size,
          border: '3px solid rgb(var(--c-amber))',
        }}
        animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 0.72, 1, 0.72, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

/** A ruled placeholder that holds a chart's exact space while it loads. */
export function LoadingBlock({ height = 220, label }) {
  return (
    <div className="flex items-center justify-center border border-orange-900/50" style={{ height }}>
      <Spinner label={label} />
    </div>
  )
}
