import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useMeteoData — live weather from Open-Meteo (free, keyless, CORS-friendly).
 *
 * Returns the current conditions plus a 72-hour series (yesterday, today,
 * tomorrow) for solar radiation, 10 m wind speed, cloud cover and temperature.
 *
 * Status contract (shared with useGridData):
 *   'loading' → first request in flight
 *   'ready'   → live data
 *   'error'   → request failed; `data` is a clearly-labelled simulated day
 *               so the interface never goes blank
 */

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const REFRESH_MS = 10 * 60 * 1000

const buildUrl = ({ lat, lon }) => {
  const q = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,wind_speed_10m,shortwave_radiation,cloud_cover',
    hourly: 'temperature_2m,wind_speed_10m,shortwave_radiation,cloud_cover',
    wind_speed_unit: 'kmh',
    past_days: 1,
    forecast_days: 2,
    timezone: 'auto',
  })
  return `${ENDPOINT}?${q}`
}

/** fetch() with a timeout and a readable error for non-2xx responses. */
export async function fetchJson(url, { signal, timeout = 12000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  signal?.addEventListener('abort', () => ctrl.abort())
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/** Normalise Open-Meteo's column-oriented payload into row objects. */
function parse(json) {
  const h = json.hourly
  if (!h?.time?.length || !json.current) throw new Error('Unexpected weather response')
  const hourly = h.time.map((t, i) => ({
    time: t,
    hour: Number(t.slice(11, 13)),
    windKmh: h.wind_speed_10m[i] ?? 0,
    radiation: h.shortwave_radiation[i] ?? 0,
    cloud: h.cloud_cover[i] ?? 0,
    tempC: h.temperature_2m[i] ?? 15,
  }))
  const nowKey = json.current.time.slice(0, 13)
  let nowIndex = hourly.findIndex((r) => r.time.startsWith(nowKey))
  if (nowIndex < 0) nowIndex = Math.min(24, hourly.length - 1)
  const c = json.current
  return {
    current: {
      windKmh: c.wind_speed_10m,
      radiation: c.shortwave_radiation,
      cloud: c.cloud_cover,
      tempC: c.temperature_2m,
      time: c.time,
      hour: Number(c.time.slice(11, 13)) + Number(c.time.slice(14, 16)) / 60,
    },
    hourly,
    nowIndex,
  }
}

/** A plausible, deterministic day used only when the network is unavailable. */
function simulatedWeather() {
  const hourly = Array.from({ length: 72 }, (_, i) => {
    const hour = i % 24
    const sun = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
    return {
      time: `sim-${i}`,
      hour,
      windKmh: Math.max(0, 18 + 12 * Math.sin(i / 5) + 6 * Math.sin(i / 2.3)),
      radiation: 780 * sun * (0.75 + 0.25 * Math.sin(i / 7)),
      cloud: 40 + 30 * Math.sin(i / 9),
      tempC: 14 + 6 * Math.sin(((hour - 9) / 24) * 2 * Math.PI),
    }
  })
  const now = new Date()
  const nowIndex = 24 + now.getHours()
  return {
    current: { ...hourly[nowIndex], hour: now.getHours() + now.getMinutes() / 60, time: now.toISOString() },
    hourly,
    nowIndex,
  }
}

export function useMeteoData(region) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null, updatedAt: null, forRegion: null })
  const [tick, setTick] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const ctrl = new AbortController()
    // Keep showing the previous region's data (dimmed by the UI) while loading.
    setState((s) => ({ ...s, status: 'loading' }))

    fetchJson(buildUrl(region), { signal: ctrl.signal })
      .then((json) => {
        if (!alive.current) return
        setState({ status: 'ready', data: parse(json), error: null, updatedAt: new Date(), forRegion: region })
      })
      .catch((err) => {
        if (!alive.current || ctrl.signal.aborted) return
        setState({
          status: 'error',
          data: simulatedWeather(),
          error: err?.name === 'AbortError' ? 'The weather service timed out' : err.message,
          updatedAt: new Date(),
          forRegion: region,
        })
      })

    return () => {
      alive.current = false
      ctrl.abort()
    }
  }, [region, tick])

  // Quietly refresh in the background.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  const refresh = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, refresh, simulated: state.status === 'error' }
}
