/**
 * Regions the dashboard can show. `owid` is the country name used by the
 * open Our World in Data electricity datasets. Capacities are rounded,
 * illustrative figures (MW) used by the grid model.
 */
export const REGIONS = [
  { id: 'toronto', city: 'Toronto', country: 'Canada', owid: 'Canada', lat: 43.65, lon: -79.38,
    profile: { baseMW: 15000, windMW: 5000, solarMW: 1500, nuclearShare: 0.5, hydroShare: 0.2, fossilCI: 490 } },
  { id: 'berlin', city: 'Berlin', country: 'Germany', owid: 'Germany', lat: 52.52, lon: 13.41,
    profile: { baseMW: 60000, windMW: 35000, solarMW: 45000, nuclearShare: 0, hydroShare: 0.04, fossilCI: 640 } },
  { id: 'madrid', city: 'Madrid', country: 'Spain', owid: 'Spain', lat: 40.42, lon: -3.7,
    profile: { baseMW: 32000, windMW: 22000, solarMW: 20000, nuclearShare: 0.2, hydroShare: 0.1, fossilCI: 420 } },
  { id: 'london', city: 'London', country: 'United Kingdom', owid: 'United Kingdom', lat: 51.51, lon: -0.13,
    profile: { baseMW: 34000, windMW: 30000, solarMW: 17000, nuclearShare: 0.14, hydroShare: 0.02, fossilCI: 400 } },
  { id: 'chicago', city: 'Chicago', country: 'United States', owid: 'United States', lat: 41.88, lon: -87.63,
    profile: { baseMW: 30000, windMW: 14000, solarMW: 6000, nuclearShare: 0.38, hydroShare: 0.01, fossilCI: 480 } },
  { id: 'saopaulo', city: 'São Paulo', country: 'Brazil', owid: 'Brazil', lat: -23.55, lon: -46.63,
    profile: { baseMW: 70000, windMW: 30000, solarMW: 15000, nuclearShare: 0.02, hydroShare: 0.55, fossilCI: 450 } },
  { id: 'mumbai', city: 'Mumbai', country: 'India', owid: 'India', lat: 19.08, lon: 72.88,
    profile: { baseMW: 40000, windMW: 9000, solarMW: 12000, nuclearShare: 0.03, hydroShare: 0.08, fossilCI: 750 } },
  { id: 'sydney', city: 'Sydney', country: 'Australia', owid: 'Australia', lat: -33.87, lon: 151.21,
    profile: { baseMW: 26000, windMW: 12000, solarMW: 30000, nuclearShare: 0, hydroShare: 0.06, fossilCI: 700 } },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', owid: 'Japan', lat: 35.68, lon: 139.69,
    profile: { baseMW: 50000, windMW: 1000, solarMW: 20000, nuclearShare: 0.06, hydroShare: 0.08, fossilCI: 560 } },
]

export const DEFAULT_REGION = REGIONS[0]
