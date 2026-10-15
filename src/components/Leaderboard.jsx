import { motion } from 'framer-motion'
import Term from './Term'
import { LoadingBlock } from './Spinner'
import SectionHead, { Frame } from './SectionHead'
import { useRegionsSnapshot } from '../hooks/useRegionsSnapshot'

const ROW = 80

/**
 * Leaderboard — every region ranked by renewable share right now.
 *
 * Click a row to make that region the active one. Selecting changes ONLY the
 * highlight here: rows keep their order and size, no layout animation runs,
 * and the sections above hold their heights while new data loads (see
 * Dashboard), so the list never shifts under the pointer.
 */
export default function Leaderboard({ region, onRegion }) {
  const { status, rows, error, retry } = useRegionsSnapshot()
  const sorted = [...rows].sort((a, b) => b.now.renewableShare - a.now.renewableShare)

  return (
    <section id="compare" className="border-t border-orange-900/50">
      <Frame>
        <SectionHead
          index="05"
          label="Comparison"
          blurb={<>Nine cities ranked by current <Term k="renewableShare">renewable share</Term>. Daylight and weather differ by region, so the order shifts through the day. Select a city to load it into the dashboard.</>}
        >
          Cleanest grid <em>right now.</em>
        </SectionHead>

        {/* A fixed-height stage: loading, error and ready all occupy the same box. */}
        <div style={{ minHeight: 9 * ROW }}>
          {status === 'loading' && <LoadingBlock height={9 * ROW} label="Loading all regions" />}
          {status === 'error' && (
            <div className="flex flex-wrap items-center gap-3 p-8 text-sm" role="status">
              <span>The comparison could not be loaded ({error}).</span>
              <button onClick={retry} className="chip hover:bg-amber hover:text-void">Retry</button>
            </div>
          )}
          {status === 'ready' && (
            <ol>
              {sorted.map(({ region: r, now, localTime }, i) => {
                const active = r.id === region.id
                return (
                  <li key={r.id} className="border-b border-orange-900/50 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => !active && onRegion(r)}
                      aria-current={active ? 'true' : undefined}
                      style={{ height: ROW }}
                      className={`relative grid w-full select-none grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 px-5 text-left transition-colors duration-200 sm:grid-cols-[3rem_13rem_minmax(0,1fr)_7rem] sm:px-8 ${
                        active ? 'bg-amber/10' : 'hover:bg-amber/[0.06]'
                      }`}
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 bg-amber transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`} />
                      <span className="text-sm font-bold tabular-nums text-mute">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-xl font-black uppercase tracking-tight">{r.city}</span>
                        <span className="block text-xs text-mute">{localTime} local · {Math.round(now.carbon)} g/kWh</span>
                      </span>
                      {/* Bar: scaleX eased by a spring; never remounts, never re-lays-out */}
                      <span className="hidden h-3 border border-orange-900/50 sm:block">
                        <motion.span
                          className="block h-full origin-left bg-amber"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: Math.max(0.01, now.renewableShare) }}
                          transition={{ type: 'spring', stiffness: 110, damping: 20, delay: i * 0.04 }}
                        />
                      </span>
                      <span className="numeral text-right text-4xl tabular-nums">{Math.round(now.renewableShare * 100)}%</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </Frame>
    </section>
  )
}
