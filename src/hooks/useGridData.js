import { useEffect, useMemo, useState } from 'react'
import { computeMix } from '../lib/gridModel'

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
// open energy dataset and shipped with the site (see scripts/build-history.mjs).
// Same-origin and a few kilobytes, so it loads reliably on any network.
const HISTORY_URL = `${import.meta.env.BASE_URL}data/history.json`

let historyPromise = null
function loadHistory() {
  if (!historyPromise) {
    historyPromise = fetch(HISTORY_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`History data unavailable (${r.status})`)
        return r.json()
      })
      .catch((e) => {
        historyPromise = null // allow a retry
        throw e
      })
  }
  return historyPromise
}

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
    let alive = true
    setHistory((h) => ({ ...h, status: 'loading' }))
    loadHistory()
      .then((data) => {
        if (!alive) return
        const entry = data.countries?.[region.owid] ?? {}
        const carbon = entry.carbon ?? []
        const renewables = entry.renewables ?? []
        if (!carbon.length && !renewables.length) throw new Error(`No open data found for ${region.country}`)
        setHistory({ status: 'ready', carbon, renewables, error: null })
      })
      .catch((e) => alive && setHistory({ status: 'error', carbon: [], renewables: [], error: e.message }))
    return () => {
      alive = false
    }
  }, [region, attempt])

  return { model, history, retryHistory: () => setAttempt((a) => a + 1) }
}
