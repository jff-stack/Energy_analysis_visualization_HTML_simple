import { motion } from 'framer-motion'
import { REGIONS } from '../lib/regions'

/** Nav — a hard-ruled top bar: wordmark, source status, section links, region. */
export default function Nav({ region, onRegion, status, simulated }) {
  const live = status === 'ready'
  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-40 border-b border-orange-900/50 bg-void/95"
    >
      <nav className="mx-auto flex max-w-[1500px] items-stretch lg:border-x lg:border-orange-900/50">
        <a href="#top" className="flex items-center gap-2.5 border-r border-orange-900/50 px-5 py-3 text-base font-black uppercase tracking-tight">
          <span className="h-3 w-3 bg-amber" />
          Current
        </a>

        <span className="hidden items-center gap-2 border-r border-orange-900/50 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/80 sm:flex" aria-live="polite">
          {live ? <span className="pulse-dot" /> : <span className={`h-2.5 w-2.5 ${simulated ? 'bg-sunset' : 'bg-gold'}`} />}
          {live ? 'Live weather' : simulated ? 'Simulated' : 'Loading'}
        </span>

        <div className="hidden items-stretch lg:flex">
          {[['Story', '#story'], ['Dashboard', '#live'], ['Simulator', '#simulator'], ['Compare', '#compare']].map(([l, h]) => (
            <a key={h} href={h} className="flex items-center border-r border-orange-900/50 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70 transition-colors hover:bg-amber hover:text-void">
              {l}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-stretch border-l border-orange-900/50">
          <label className="sr-only" htmlFor="region">Region</label>
          <select
            id="region"
            value={region.id}
            onChange={(e) => onRegion(REGIONS.find((r) => r.id === e.target.value))}
            className="cursor-pointer appearance-none bg-void px-5 py-3 pr-10 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber outline-none transition-colors hover:bg-amber hover:text-void"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0h10L5 6z' fill='%23FFB038'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.city}</option>
            ))}
          </select>
        </div>
      </nav>
    </motion.header>
  )
}
