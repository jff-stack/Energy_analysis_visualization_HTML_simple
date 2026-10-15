import { useEffect, useMemo, useState } from 'react'
import { computeMix } from '../lib/gridModel'
import HISTORY from '../data/history.json'

/**
 * useGridData — turns weather into a grid, and pairs it with open history.
 *
 * Two layers:
 *  1. MODELLED NOW/NEXT — the generation mix, carbon intensity and price for
 *     every hour of the weather series, from the shared grid model. Pure
 *     derivation, so it can never fail once weather exists.
 *  2. MEASURED HISTORY — national carbon intensity and renewable share, per
 *     year, from Our World in Data's open energy dataset (bundled with the site).
 *     Loaded separately, so a failure here never affects the live panels.
 */

// Annual series for the dashboard's countries, taken from Our World in Data's
// open energy dataset (regenerate with `npm run history`). Imported at build
// time, so it ships inside the JavaScript bundle: no request, nothing to fail.
export function useGridData(weather, region) {
  // Layer 1: modelled hourly grid.
  const model = useMemo(() => {
    if (!weather) return null
    const hourly = weather.hourly.map((w) => ({
      ...w,
      ...computeMix({ windKmh: w.windKmh, radiation: w.radiation, hour: w.hour, tempC: w.tempC, profile: region.profile }),
    }))
    const c = weather.current
    const now = computeMix({
      windKmh: c.windKmh, radiation: c.radiation, hour: c.hour, tempC: c.tempC, profile: region.profile,
    })
    return { hourly, now, nowIndex: weather.nowIndex }
  }, [weather, region])

  // Layer 2: measured history.
  const [history, setHistory] = useState({ status: 'loading', carbon: [], renewables: [], error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const entry = HISTORY.countries?.[region.owid]
    if (entry && (entry.carbon.length || entry.renewables.length)) {
      setHistory({ status: 'ready', carbon: entry.carbon, renewables: entry.renewables, error: null })
    } else {
      setHistory({ status: 'error', carbon: [], renewables: [], error: `No open data for ${region.country}` })
    }
  }, [region, attempt])

  return { model, history, retryHistory: () => setAttempt((a) => a + 1) }
}
