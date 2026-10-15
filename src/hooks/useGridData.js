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
 *     year, from Our World in Data's open energy dataset.
 *     This is a real network call that can fail; it degrades independently.
 */

// Our World in Data's open energy dataset, served through jsDelivr because the
// OWID site itself sends no CORS headers (browsers would block a direct fetch).
const DATASET = 'https://cdn.jsdelivr.net/gh/owid/energy-data@master/owid-energy-data.csv'

// One download per page load, shared by every region switch.
let datasetPromise = null
function loadDataset() {
  if (!datasetPromise) {
    datasetPromise = fetch(DATASET)
      .then((r) => {
        if (!r.ok) throw new Error(`Dataset unavailable (${r.status})`)
        return r.text()
      })
      .catch((e) => {
        datasetPromise = null // allow a retry
        throw e
      })
  }
  return datasetPromise
}

/** Pull one country's (year, value) rows for a named column out of the CSV. */
function seriesFor(csv, entity, column) {
  const lines = csv.split('\n')
  const header = lines[0].split(',')
  const yearCol = header.indexOf('year')
  const valueCol = header.indexOf(column)
  if (yearCol < 0 || valueCol < 0) return []
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith(entity + ',')) continue
    const cells = line.split(',')
    if (cells[valueCol] === '' || cells[valueCol] === undefined) continue
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
    loadDataset()
      .then((csv) => {
        if (!alive) return
        const carbon = seriesFor(csv, region.owid, 'carbon_intensity_elec')
        const renewables = seriesFor(csv, region.owid, 'renewables_share_elec')
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
