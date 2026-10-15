import { useMeteoData } from './useMeteoData'
import { useGridData } from './useGridData'

/**
 * useLiveData — the one hook the UI needs. It composes the weather feed and
 * the grid model so components receive a single, ready-to-render object.
 */
export { useMeteoData, useGridData }

export function useLiveData(region) {
  const weather = useMeteoData(region)
  // Model with the region the weather actually belongs to. While a new region
  // loads, the previous region's weather stays on screen with ITS OWN profile,
  // so numbers never flash through a mismatched weather/profile combination.
  const grid = useGridData(weather.data, weather.forRegion ?? region)
  return { weather, ...grid }
}
