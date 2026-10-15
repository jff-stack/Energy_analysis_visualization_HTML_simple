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
 *     year, from Our World in Data's open CSVs (Ember / Energy Institute data).
 *     This is a real network call that can fail; it degrades independently.
 */

const OWID = {
  carbon: 'https://ourworldindata.org/grapher/carbon-intensity-electricity.csv',
  renewables: 'https://ourworldindata.org/grapher/share-electricity-renewables.csv',
}

// One download per dataset per page load, shared by every region switch.
const csvCache = new Map()
function loadCsv(url) {
  if (!csvCache.has(url)) {
    const p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Dataset unavailable (${r.status})`)
        return r.text()
      })
      .catch((e) => {
        csvCache.delete(url) // allow a retry
        throw e
      })
    csvCache.set(url, p)
  }
  return csvCache.get(url)
}

/** Pull one country's (year, value) rows out of an OWID CSV. */
function seriesFor(csv, entity) {
  const lines = csv.split('\n')
  const header = lines[0].split(',')
  const yearCol = header.findIndex((h) => h.trim().toLowerCase() === 'year')
  const valueCol = header.length - 1
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith(entity + ',') && !line.startsWith(`"${entity}",`)) continue
    const cells = line.split(',')
    const year = Number(cells[yearCol])
    const value = Number(cells[valueCol])
    if (Number.isFinite(year) && Number.isFinite(value)) out.push({ year, value })
  }
  return out.sort((a, b) => a.year - b.year)
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
    Promise.all([loadCsv(OWID.carbon), loadCsv(OWID.renewables)])
      .then(([c, r]) => {
        if (!alive) return
        const carbon = seriesFor(c, region.owid)
        const renewables = seriesFor(r, region.owid)
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
