import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Term from './Term'
import CountUp from './CountUp'
import SectionHead, { Frame } from './SectionHead'

/**
 * Planner — "when should I run it?"
 *
 * Slides a window of the chosen length across the next 24 modelled hours and
 * picks the start time with the lowest average carbon intensity, then shows
 * what that saves versus starting right now.
 */
const APPLIANCES = [
  { id: 'dish', label: 'Dishwasher', kwh: 1.2, hours: 2 },
  { id: 'wash', label: 'Laundry', kwh: 1.5, hours: 2 },
  { id: 'water', label: 'Water heater', kwh: 4, hours: 2 },
  { id: 'ev', label: 'EV charge', kwh: 30, hours: 5 },
]

const pad = (h) => String(h % 24).padStart(2, '0')

export default function Planner({ model, region }) {
  const [id, setId] = useState('ev')
  const item = APPLIANCES.find((a) => a.id === id)

  const plan = useMemo(() => {
    if (!model) return null
    const slice = model.hourly.slice(model.nowIndex, model.nowIndex + 24)
    if (slice.length < item.hours + 1) return null
    const windows = []
    for (let s = 0; s + item.hours <= slice.length; s++) {
      const part = slice.slice(s, s + item.hours)
      windows.push({
        start: s,
        hour: slice[s].hour,
        carbon: part.reduce((n, r) => n + r.carbon, 0) / item.hours,
        price: part.reduce((n, r) => n + r.price, 0) / item.hours,
      })
    }
    const best = windows.reduce((a, b) => (b.carbon < a.carbon ? b : a))
    return { slice, best, now: windows[0] }
  }, [model, item])

  if (!plan) return null
  const { best, now, slice } = plan
  const savedG = Math.max(0, (now.carbon - best.carbon) * item.kwh)
  const savedPct = now.carbon > 0 ? Math.max(0, (1 - best.carbon / now.carbon) * 100) : 0
  const costDelta = Math.max(0, ((now.price - best.price) * item.kwh) / 1000)
  const maxC = Math.max(...slice.map((r) => r.carbon), 1)
  const isNow = best.start === 0

  return (
    <section id="planner" className="border-t border-orange-900/50">
      <Frame>
        <SectionHead
          index="04"
          label={`Planner · ${region.city}`}
          blurb="Moving flexible loads to the cleanest hours allows more renewable output to be used directly."
        >
          When to <em>run it.</em>
        </SectionHead>

        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="border-b border-orange-900/50 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap gap-2">
              {APPLIANCES.map((a) => (
                <motion.button
                  key={a.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setId(a.id)}
                  aria-pressed={a.id === id}
                  className={`chip transition-colors ${a.id === id ? '!border-amber !bg-amber !text-void' : 'hover:!border-amber hover:text-amber'}`}
                >
                  {a.label}
                </motion.button>
              ))}
            </div>
            <p className="mt-4 text-xs text-mute">{item.kwh} kWh over {item.hours} hours</p>

            <motion.div key={`${id}-${best.start}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <div className="eyebrow">{isNow ? 'Recommendation' : 'Best start time'}</div>
              <div className="numeral mt-2 text-[6.5rem] uppercase sm:text-[8.5rem]">
                {isNow ? 'Now' : `${pad(best.hour)}:00`}
              </div>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/80">
                {isNow ? (
                  'Starting now is already the lowest-carbon window in the next 24 hours.'
                ) : (
                  <>
                    Starting at that hour lowers the <Term k="carbonIntensity">carbon intensity</Term> of this job by about{' '}
                    <b className="font-extrabold text-amber"><CountUp value={savedPct} />%</b>, avoiding roughly{' '}
                    <b className="font-extrabold text-amber"><CountUp value={savedG} /> g</b> of CO₂.
                  </>
                )}
              </p>
              {costDelta > 0.005 && !isNow && (
                <p className="mt-2 text-sm text-mute">Wholesale energy cost is about ${costDelta.toFixed(2)} lower.</p>
              )}
            </motion.div>
          </div>

          {/* Every hour as a bar; the recommended window is solid amber. */}
          <div className="px-5 py-8 sm:px-8">
            <div className="flex h-72 items-end gap-[3px]" role="img" aria-label="Carbon intensity for each of the next 24 hours, best window highlighted">
              {slice.map((r, i) => {
                const inBest = i >= best.start && i < best.start + item.hours
                return (
                  <motion.div
                    key={i}
                    title={`${pad(r.hour)}:00 · ${Math.round(r.carbon)} g/kWh`}
                    className="flex-1"
                    style={{
                      background: inBest ? '#FFB038' : 'rgb(124 45 18 / 0.55)',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, (r.carbon / maxC) * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 150, damping: 20, delay: i * 0.012 }}
                  />
                )
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-wider text-mute">
              <span>Now</span>
              <span>+12 h</span>
              <span>+24 h</span>
            </div>
            <p className="mt-3 text-xs text-mute">Bar height shows carbon intensity. Amber bars mark the recommended window.</p>
          </div>
        </div>
      </Frame>
    </section>
  )
}
