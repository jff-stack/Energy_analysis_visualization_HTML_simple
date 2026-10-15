import { motion } from 'framer-motion'
import Term from './Term'
import CountUp from './CountUp'
import Spinner, { LoadingBlock } from './Spinner'
import Reveal from './Reveal'
import SectionHead, { Frame } from './SectionHead'
import ForecastChart from './charts/ForecastChart'
import MixDonut from './charts/MixDonut'
import CarbonGauge from './charts/CarbonGauge'
import LineChart from './charts/LineChart'
import { windCapacityFactor } from '../lib/gridModel'

/** Panel — a ruled cell with an eyebrow + slammed heading row. */
function Panel({ eyebrow, title, aside, className = '', children }) {
  return (
    <div className={`px-5 py-8 sm:px-8 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h3 className="mt-2 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">{title}</h3>
        </div>
        {aside}
      </div>
      <div className="mt-7">{children}</div>
    </div>
  )
}

function Kpi({ label, unit, note, loading, children }) {
  return (
    <div className="bg-void px-5 py-6 sm:px-8">
      <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-mute">{label}</div>
      {/* Fixed height: the cell never changes size when its number arrives. */}
      <div className="mt-3 flex h-[4.5rem] items-center">
        {loading ? (
          <Spinner size={26} />
        ) : (
          <div className="numeral text-[4rem] sm:text-[4.5rem]">
            {children}
            <span className="ml-2 text-xs font-bold uppercase tracking-[0.14em] text-mute">{unit}</span>
          </div>
        )}
      </div>
      <div className="mt-2 h-4 text-xs text-mute">{note}</div>
    </div>
  )
}

function Notice({ children, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="flex flex-wrap items-center gap-3 border border-sunset bg-sunset/10 px-4 py-3 text-sm text-ink/90"
    >
      <span>{children}</span>
      {action}
    </motion.div>
  )
}

const RetryButton = ({ onClick }) => (
  <button onClick={onClick} className="chip hover:bg-amber hover:text-void">Try again</button>
)

/** Download the modelled hourly series as a CSV the browser builds locally. */
function downloadCsv(region, hourly) {
  const cols = ['time', 'windKmh', 'radiation', 'cloud', 'tempC', 'demand', 'wind', 'solar', 'hydro', 'nuclear', 'fossil', 'carbon', 'price']
  const lines = [cols.join(',')].concat(
    hourly.map((r) => cols.map((c) => (typeof r[c] === 'number' ? r[c].toFixed(2) : r[c])).join(',')),
  )
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `current-${region.id}-forecast.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export default function Dashboard({ region, weather, model, history, retryHistory }) {
  const loading = weather.status === 'loading' && !weather.data
  const refreshing = weather.status === 'loading' && !!weather.data
  const now = model?.now
  const w = weather.data?.current
  const hasHistory = history.carbon.length > 1 || history.renewables.length > 1

  return (
    <section id="live" className="border-t border-orange-900/50">
      <Frame>
        <SectionHead
          index="02"
          label={`Dashboard · ${region.city}`}
          blurb={`Real wind, sun and temperature from Open-Meteo drive a model of ${region.city}'s generation fleet. Refreshed every ten minutes.`}
        >
          What the grid is <em>doing.</em>
        </SectionHead>

        {/* Status strip: constant height, so nothing below it ever jumps. */}
        <div className="flex min-h-[3.75rem] items-center border-b border-orange-900/50 px-5 py-3 sm:px-8">
          {weather.simulated ? (
            <Notice action={<RetryButton onClick={weather.refresh} />}>
              Couldn&rsquo;t reach the weather service ({weather.error}). Showing a simulated day so you can keep exploring.
            </Notice>
          ) : (
            <p className="text-xs leading-relaxed text-mute">
              {weather.status === 'ready' && weather.updatedAt
                ? `Observed ${w?.time?.replace('T', ' ')} local · refreshed ${weather.updatedAt.toLocaleTimeString()} · generation, price and carbon are modelled from this weather, not metered.`
                : 'Fetching live conditions…'}
            </p>
          )}
        </div>

        {/* Data dims gently while a new region loads, rather than swapping out. */}
        <motion.div animate={{ opacity: refreshing ? 0.5 : 1 }} transition={{ duration: 0.35 }}>
          <div className="grid grid-cols-2 gap-px border-b border-orange-900/50 bg-orange-900/50 lg:grid-cols-4">
            <Kpi loading={loading} label={<Term k="renewableShare">Renewable share</Term>} unit="%" note="Wind + solar + hydro">
              {now && <CountUp value={now.renewableShare * 100} />}
            </Kpi>
            <Kpi loading={loading} label={<Term k="carbonIntensity">Carbon intensity</Term>} unit="g/kWh" note="Per unit of electricity used">
              {now && <CountUp value={now.carbon} />}
            </Kpi>
            <Kpi loading={loading} label={<Term k="spotPrice">Spot price</Term>} unit="$/MWh" note={now?.curtailed > 0 ? 'Surplus: price falling' : 'Modelled wholesale price'}>
              {now && <CountUp value={now.price} />}
            </Kpi>
            <Kpi loading={loading} label={<Term k="capacityFactor">Wind output</Term>} unit="%" note={w ? `${Math.round(w.windKmh)} km/h at ground level` : ''}>
              {w && <CountUp value={windCapacityFactor(w.windKmh) * 100} />}
            </Kpi>
          </div>

          <div className="border-b border-orange-900/50">
            <Reveal>
              <Panel
                eyebrow="48 hours"
                title="Generation, hour by hour"
                aside={
                  model && (
                    <button onClick={() => downloadCsv(region, model.hourly)} className="btn btn-ghost !px-4 !py-2.5 !text-[11px]">
                      Export CSV ↓
                    </button>
                  )
                }
              >
                {loading || !model ? (
                  <LoadingBlock height={420} label="Loading forecast" />
                ) : (
                  <ForecastChart hourly={model.hourly} nowIndex={model.nowIndex} replayKey={`${region.id}-${weather.updatedAt?.getTime()}`} />
                )}
              </Panel>
            </Reveal>
          </div>

          <div className="grid border-b border-orange-900/50 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <Reveal className="border-b border-orange-900/50 lg:border-b-0 lg:border-r">
              <Panel eyebrow="This hour" title="Where the power comes from">
                {now ? <MixDonut mix={now} /> : <LoadingBlock height={210} label="Loading mix" />}
              </Panel>
            </Reveal>
            <Reveal delay={0.08}>
              <Panel eyebrow="This hour" title="How clean is it?">
                {now ? <CarbonGauge value={now.carbon} /> : <LoadingBlock height={210} label="Loading gauge" />}
              </Panel>
            </Reveal>
          </div>
        </motion.div>

        {/* Measured history: keeps the previous country's charts on screen
            (dimmed) while the next resolves, and holds a minimum height. */}
        <Reveal>
          <Panel
            eyebrow={`Measured · ${region.country}`}
            title="The long road to cleaner power"
            aside={<span className="text-xs text-mute">Yearly national data · Our World in Data</span>}
          >
            <div className="min-h-[330px]">
              {!hasHistory && history.status === 'loading' && <LoadingBlock height={330} label="Loading history" />}
              {history.status === 'error' && (
                <Notice action={<RetryButton onClick={retryHistory} />}>
                  The open history dataset couldn&rsquo;t be loaded ({history.error}). Everything else still works.
                </Notice>
              )}
              {hasHistory && (
                <motion.div
                  animate={{ opacity: history.status === 'loading' ? 0.45 : 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-10 md:grid-cols-2"
                >
                  {history.carbon.length > 1 && (
                    <div>
                      <div className="mb-3 text-sm text-mute"><Term k="carbonIntensity">Carbon intensity</Term> of electricity</div>
                      <LineChart key={`c-${region.id}-${history.carbon.length}`} data={history.carbon} unit="g CO₂/kWh" ariaLabel={`Carbon intensity of electricity in ${region.country} by year`} />
                    </div>
                  )}
                  {history.renewables.length > 1 && (
                    <div>
                      <div className="mb-3 text-sm text-mute"><Term k="renewableShare">Renewable share</Term> of electricity</div>
                      <LineChart key={`r-${region.id}-${history.renewables.length}`} data={history.renewables} unit="%" decimals={1} ariaLabel={`Renewable share of electricity in ${region.country} by year`} />
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </Panel>
        </Reveal>
      </Frame>
    </section>
  )
}
