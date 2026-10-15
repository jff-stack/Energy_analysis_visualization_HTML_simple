import { useCallback, useEffect, useState } from 'react'
import { fetchJson } from './useMeteoData'
import { REGIONS } from '../lib/regions'
import { computeMix } from '../lib/gridModel'

/**
 * useRegionsSnapshot — current conditions for every region in ONE request.
 * Open-Meteo accepts comma-separated coordinates and returns an array, so the
 * leaderboard costs a single call no matter how many regions we add.
 */
export function useRegionsSnapshot() {
  const [state, setState] = useState({ status: 'loading', rows: [], error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState((s) => ({ ...s, status: 'loading' }))
    const q = new URLSearchParams({
      latitude: REGIONS.map((r) => r.lat).join(','),
      longitude: REGIONS.map((r) => r.lon).join(','),
      current: 'temperature_2m,wind_speed_10m,shortwave_radiation',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
    })
    fetchJson(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: ctrl.signal })
      .then((json) => {
        const list = Array.isArray(json) ? json : [json]
        const rows = REGIONS.map((region, i) => {
          const c = list[i]?.current
          if (!c) return null
          const hour = Number(c.time.slice(11, 13)) + Number(c.time.slice(14, 16)) / 60
          const now = computeMix({
            windKmh: c.wind_speed_10m, radiation: c.shortwave_radiation, hour, tempC: c.temperature_2m, profile: region.profile,
          })
          return { region, now, localTime: c.time.slice(11, 16) }
        }).filter(Boolean)
        if (!rows.length) throw new Error('Unexpected weather response')
        setState({ status: 'ready', rows, error: null })
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return
        // Never leave the section empty: show a modelled snapshot, clearly labelled.
        const utcHour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60
        const rows = REGIONS.map((region) => {
          const hour = (utcHour + region.lon / 15 + 24) % 24
          const sun = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
          const now = computeMix({ windKmh: 18, radiation: 700 * sun, hour, tempC: 15, profile: region.profile })
          const hh = String(Math.floor(hour)).padStart(2, '0')
          const mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0')
          return { region, now, localTime: `${hh}:${mm}` }
        })
        setState({ status: 'fallback', rows, error: e.message })
      })
    return () => ctrl.abort()
  }, [tick])

  const retry = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, retry }
}
