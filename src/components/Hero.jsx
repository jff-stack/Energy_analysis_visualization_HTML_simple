import { motion } from 'framer-motion'
import CountUp from './CountUp'
import Spinner from './Spinner'
import { Frame } from './SectionHead'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
// Each headline line rises out of its own mask, like a title card.
const lineIn = {
  hidden: { yPercent: 108 },
  show: { yPercent: 0, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } },
}
const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } } }

const Line = ({ children }) => (
  <span className="block overflow-hidden pb-[0.04em]">
    <motion.span variants={lineIn} className="block">{children}</motion.span>
  </span>
)

/** Hero — a slammed headline over a breathing sun, then a ruled stat band. */
export default function Hero({ region, now, loading, go }) {
  return (
    <section className="relative overflow-hidden pt-[57px]">
      <motion.div variants={container} initial="hidden" animate={go ? 'show' : 'hidden'} className="relative">
        <Frame>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-900/50 px-5 py-4 sm:px-8">
            <motion.span variants={fade} className="chip">
              <span className="pulse-dot" /> Live · {region.city}, {region.country}
            </motion.span>
            <motion.span variants={fade} className="text-[11px] font-bold uppercase tracking-[0.2em] text-mute">
              {Math.abs(region.lat).toFixed(2)}°{region.lat >= 0 ? 'N' : 'S'} {Math.abs(region.lon).toFixed(2)}°{region.lon >= 0 ? 'E' : 'W'}
            </motion.span>
          </div>

          <h1 className="display px-5 pb-8 pt-10 text-[clamp(3.6rem,15.5vw,15rem)] sm:px-8">
            <Line>The grid.</Line>
            <Line>Explained</Line>
            <Line><em>live.</em></Line>
          </h1>

          <div className="grid border-t border-orange-900/50 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)_minmax(0,3fr)]">
            <motion.div variants={fade} className="border-b border-orange-900/50 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r">
              <p className="max-w-lg text-xl leading-snug text-ink/80">
                Electricity is generated at the moment it is consumed. This explainer pairs live weather observations with
                a model of a regional grid to show how wind, sunlight and demand set the price and carbon intensity of power.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#story" className="btn btn-primary">Read the story ↓</a>
                <a href="#simulator" className="btn btn-ghost">Open the simulator</a>
              </div>
            </motion.div>

            <motion.div variants={fade} className="border-b border-orange-900/50 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r">
              <div className="eyebrow">Renewable share now</div>
              {loading || !now ? (
                <Spinner className="h-28 justify-start" label="Loading live data" />
              ) : (
                <div className="numeral mt-2 text-[6.5rem] sm:text-[8rem]">
                  <CountUp value={now.renewableShare * 100} />
                  <span className="text-4xl text-ink/40">%</span>
                </div>
              )}
            </motion.div>

            <motion.dl variants={fade} className="grid grid-cols-3 divide-x divide-orange-900/50 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
              {[
                ['Wind', now && <><CountUp value={now.wind} /> MW</>],
                ['Solar', now && <><CountUp value={now.solar} /> MW</>],
                ['CO₂', now && <><CountUp value={now.carbon} /> g</>],
              ].map(([label, value]) => (
                <div key={label} className="px-5 py-5 sm:px-6">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-mute">{label}</dt>
                  <dd className="mt-1 text-2xl font-black tabular-nums tracking-tight">{value ?? '—'}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </Frame>
      </motion.div>
    </section>
  )
}
