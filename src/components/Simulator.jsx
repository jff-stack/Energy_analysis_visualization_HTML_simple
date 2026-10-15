import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import Term from './Term'
import CountUp from './CountUp'
import SectionHead, { Frame } from './SectionHead'
import { SOURCES } from './charts/palette'
import { Swatch } from './charts/PatternDefs'
import { smoothBand, smoothLine } from '../lib/curve'
import { dailyCurve, windCapacityFactor } from '../lib/gridModel'

/**
 * Simulator — the grid in your hands.
 *
 * The three sliders are *targets*. Each is eased through a Framer Motion
 * spring, and every chart reads the eased value, so the whole picture flows
 * and morphs as you scrub rather than snapping between states. The maths is
 * the exact same `computeMix` that runs the live dashboard.
 */

const PRESETS = [
  { id: 'calm', label: 'Calm and overcast', wind: 4, sun: 120, temp: 12 },
  { id: 'sunny', label: 'Clear summer day', wind: 12, sun: 950, temp: 28 },
  { id: 'storm', label: 'Windy front', wind: 58, sun: 260, temp: 9 },
  { id: 'heat', label: 'Heatwave', wind: 6, sun: 1000, temp: 38 },
  { id: 'glut', label: 'Windy and sunny', wind: 52, sun: 900, temp: 18 },
]

/** Ease a number toward `target` with a spring; returns the in-flight value. */
function useEased(target) {
  const mv = useMotionValue(target)
  const [value, setValue] = useState(target)
  useEffect(() => {
    const controls = animate(mv, target, { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 })
    return () => controls.stop()
  }, [target, mv])
  useEffect(() => mv.on('change', setValue), [mv])
  return value
}

function Slider({ id, label, hint, value, onChange, min, max, step = 1, unit }) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink">{label}</label>
        <span className="numeral text-4xl tabular-nums">
          {value}
          <span className="ml-1 text-xs font-bold uppercase tracking-wider text-mute">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="slider mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="text-xs leading-relaxed text-mute">{hint}</p>
    </div>
  )
}

const CW = 720
const CH = 240
const PH = 80 // price strip height
const PAD = 8

function SimChart({ curve }) {
  const g = useMemo(() => {
    const demandMax = Math.max(...curve.map((c) => c.demand))
    const max = Math.max(demandMax * 1.15, 1)
    const x = (i) => PAD + (i / 24) * (CW - PAD * 2)
    const y = (v) => 10 + (1 - v / max) * (CH - 10 - 24)
    const base = curve.map(() => 0)
    const layers = SOURCES.map((s) => {
      const lower = base.slice()
      const upper = curve.map((c, i) => lower[i] + c[s.key])
      upper.forEach((v, i) => (base[i] = v))
      return {
        s,
        d: smoothBand(upper.map((v, i) => [x(i), y(v)]), lower.map((v, i) => [x(i), y(v)])),
      }
    })
    const demand = smoothLine(curve.map((c, i) => [x(i), y(c.demand)]))

    const prices = curve.map((c) => c.price)
    const pLo = Math.min(...prices, 0)
    const pHi = Math.max(...prices, 60)
    const py = (p) => 8 + (1 - (p - pLo) / (pHi - pLo)) * (PH - 16)
    const price = smoothLine(prices.map((p, i) => [x(i), py(p)]))
    const priceArea = smoothBand(prices.map((p, i) => [x(i), py(p)]), prices.map((_, i) => [x(i), PH - 4]))
    return { layers, demand, price, priceArea, zeroY: py(0), pHi, pLo, x }
  }, [curve])

  return (
    <div>
      <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" role="img" aria-label="Simulated generation by source across one day">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={CW - PAD} y1={10 + f * (CH - 34)} y2={10 + f * (CH - 34)} stroke="rgb(124 45 18 / 0.45)" />
        ))}
        {g.layers.map(({ s, d }) => (
          <path key={s.key} d={d} fill={s.fill} fillOpacity="0.92" />
        ))}
        <path d={g.demand} fill="none" stroke="#FCF3E6" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" />
        {[0, 6, 12, 18, 24].map((h) => (
          <text key={h} x={g.x(h)} y={CH - 6} fontSize="11" textAnchor="middle" fill="#B7A896" fontFamily="Inter, sans-serif">
            {String(h % 24).padStart(2, '0')}:00
          </text>
        ))}
      </svg>

      <div className="mt-5 flex items-center justify-between text-xs text-mute">
        <span className="eyebrow">Wholesale price over the day</span>
        <span className="tabular-nums">${Math.round(g.pLo)} to ${Math.round(g.pHi)} /MWh</span>
      </div>
      <svg viewBox={`0 0 ${CW} ${PH}`} className="mt-1 w-full" role="img" aria-label="Simulated wholesale price across one day">
        {g.pLo < 0 && <line x1={PAD} x2={CW - PAD} y1={g.zeroY} y2={g.zeroY} stroke="#FCF3E6" strokeOpacity="0.35" strokeDasharray="3 5" />}
        <path d={g.priceArea} fill="#FF7A3D" fillOpacity="0.18" />
        <path d={g.price} fill="none" stroke="#FF7A3D" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function Simulator({ region, start, seed }) {
  const [wind, setWind] = useState(Math.round(start?.windKmh ?? 25))
  const [sun, setSun] = useState(Math.round((start?.radiation ?? 600) / 10) * 10)
  const [temp, setTemp] = useState(Math.round(start?.tempC ?? 16))
  const [preset, setPreset] = useState(null)

  // When a new region's weather arrives, glide the sliders to it. Nothing
  // remounts, so switching region never flashes or re-lays-out the section.
  const lastSeed = useRef(seed)
  useEffect(() => {
    if (!seed || seed === lastSeed.current || !start) return
    lastSeed.current = seed
    setPreset(null)
    setWind(Math.round(Math.min(80, start.windKmh)))
    setSun(Math.round(Math.min(1000, Math.max(0, start.radiation)) / 10) * 10)
    setTemp(Math.round(start.tempC))
  }, [seed, start])

  const w = useEased(wind)
  const s = useEased(sun)
  const t = useEased(temp)

  const curve = useMemo(
    () => dailyCurve({ windKmh: w, radiation: s, tempC: t, demandScale: 1, profile: region.profile }),
    [w, s, t, region],
  )

  // Day summaries (hours 0–23, each hour weighted equally).
  const day = useMemo(() => {
    const hrs = curve.slice(0, 24)
    const sum = (k) => hrs.reduce((n, c) => n + c[k], 0)
    const served = sum('served') || 1
    return {
      renewable: ((sum('wind') + sum('solar') + sum('hydro')) / served) * 100,
      carbon: hrs.reduce((n, c) => n + c.carbon * c.served, 0) / served,
      price: hrs.reduce((n, c) => n + c.price * c.demand, 0) / (sum('demand') || 1),
      curtailed: sum('curtailed'),
      shortfall: sum('shortfall'),
      fossilShare: sum('fossil') / served,
      shares: SOURCES.map((src) => (sum(src.key) / served) * 100),
    }
  }, [curve])

  const turbine = Math.round(windCapacityFactor(w) * 100)

  const story =
    day.shortfall > 0
      ? 'Demand exceeds available capacity. Prices spike as the system draws on emergency supply.'
      : day.curtailed > 0
      ? 'Renewable output exceeds demand. Operators curtail wind and solar, and prices fall towards zero or below.'
      : day.fossilShare > 0.35
      ? 'Wind and solar output is low, so gas and coal plants fill the gap and the marginal plant sets a high price.'
      : 'Renewables cover most of the day, with fossil plants needed mainly to meet the evening peak.'

  const apply = (p) => {
    setPreset(p.id)
    setWind(p.wind)
    setSun(p.sun)
    setTemp(p.temp)
  }
  const manual = (set) => (v) => {
    setPreset(null)
    set(v)
  }

  return (
    <section id="simulator" className="border-t border-orange-900/50">
      <Frame>
        <SectionHead
          index="03"
          label={`Simulator · ${region.city}`}
          blurb={<>Change wind, sunlight and temperature to see how a full day on {region.city}&rsquo;s grid responds: the generation mix, carbon intensity and <Term k="spotPrice">spot price</Term>.</>}
        >
          Adjust the <em>weather.</em>
        </SectionHead>

        <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          {/* Controls */}
          <div className="space-y-8 border-b border-orange-900/50 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => apply(p)}
                  aria-pressed={preset === p.id}
                  className={`chip transition-colors ${preset === p.id ? '!border-amber !bg-amber !text-void' : 'hover:!border-amber hover:text-amber'}`}
                >
                  {p.label}
                </motion.button>
              ))}
            </div>

            <Slider
              id="sim-wind" label="Wind speed" unit="km/h" min={0} max={80} value={wind}
              onChange={manual(setWind)}
              hint={<>Turbines are producing {turbine}% of rated output (<Term k="capacityFactor">capacity factor</Term>).</>}
            />
            <Slider
              id="sim-sun" label="Peak solar radiation" unit="W/m²" min={0} max={1000} step={10} value={sun}
              onChange={manual(setSun)}
              hint={<>Peak midday <Term k="shortwave">solar radiation</Term>. Cloud cover reduces it.</>}
            />
            <Slider
              id="sim-temp" label="Temperature" unit="°C" min={-15} max={42} value={temp}
              onChange={manual(setTemp)}
              hint="Heating and cooling loads both raise demand as temperatures move away from a mild 18 °C."
            />

            <motion.p
              key={story}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-l-4 border-amber bg-amber/10 p-4 text-sm leading-relaxed text-ink/90"
            >
              {story}
            </motion.p>
          </div>

          {/* Output */}
          <div>
            <div className="grid grid-cols-2 gap-px border-b border-orange-900/50 bg-orange-900/50 sm:grid-cols-4">
              <Stat label={<Term k="renewableShare">Renewable</Term>}>
                <CountUp value={day.renewable} duration={0.4} /><small>%</small>
              </Stat>
              <Stat label={<Term k="carbonIntensity">Carbon</Term>}>
                <CountUp value={day.carbon} duration={0.4} /><small>g/kWh</small>
              </Stat>
              <Stat label={<Term k="spotPrice">Average price</Term>}>
                $<CountUp value={day.price} duration={0.4} /><small>/MWh</small>
              </Stat>
              <Stat label={<Term k="curtailment">Curtailed</Term>}>
                <CountUp value={day.curtailed / 1000} decimals={1} duration={0.4} /><small>GWh</small>
              </Stat>
            </div>

            <div className="px-5 py-8 sm:px-8">
              <SimChart curve={curve} />

              {/* The day's energy split, springing between values */}
              <div className="mt-6 flex h-3 w-full border border-orange-900/50" aria-hidden="true">
                {SOURCES.map((src, i) => (
                  <motion.svg
                    key={src.key}
                    height="100%"
                    animate={{ width: `${day.shares[i]}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                  >
                    <rect width="100%" height="100%" fill={src.fill} />
                  </motion.svg>
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-mute">
                {SOURCES.map((src) => (
                  <li key={src.key} className="flex items-center gap-1.5">
                    <Swatch fill={src.fill} />
                    {src.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Frame>
    </section>
  )
}

function Stat({ label, children }) {
  return (
    <div className="bg-void px-5 py-5">
      <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-mute">{label}</div>
      <div className="numeral mt-1 text-[2.6rem] [&_small]:ml-1 [&_small]:text-[11px] [&_small]:font-bold [&_small]:uppercase [&_small]:tracking-wider [&_small]:text-mute ">
        {children}
      </div>
    </div>
  )
}
