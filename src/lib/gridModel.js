/**
 * gridModel.js — a small, transparent model of an electricity grid.
 *
 * Real weather goes in, a modelled generation mix, carbon intensity and
 * wholesale price come out. The same pure function powers both the live
 * dashboard and the simulator, so what you learn by scrubbing a slider is
 * exactly what the live charts are doing.
 *
 * Nothing here is metered data: capacities per region are rounded, illustrative
 * figures. The point is the *shape* of the relationships.
 */

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const gauss = (x, mu, sigma) => Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2))

/** Life-cycle emissions in gCO2 per kWh for each source. */
export const EMISSIONS = { fossil: null /* per region */, nuclear: 12, hydro: 24, wind: 11, solar: 41 }

/** Fraction of a turbine fleet's rated power produced at a 10 m wind speed (km/h). */
export function windCapacityFactor(kmh10m) {
  // Wind is faster at turbine hub height than at the 10 m weather-station level.
  const v = (kmh10m / 3.6) * 1.45
  if (v < 3 || v > 25) return 0 // too gentle to spin, or shut down for safety
  if (v >= 12) return 1 // rated output
  return ((v - 3) / 9) ** 3 // power rises with the cube of wind speed
}

/** Fraction of panel rating produced for a given sunlight (W/m²). */
export function solarCapacityFactor(wm2) {
  return clamp((wm2 / 1000) * 0.82, 0, 1)
}

/** How much of the "typical" demand is in use at a given hour (0–24). */
export function demandShape(hour) {
  const h = ((hour % 24) + 24) % 24
  return 0.6 + 0.2 * gauss(h, 8.5, 2.2) + 0.3 * gauss(h, 19, 2.8)
}

/** Heating and cooling both raise demand: a comfortable 18 °C is the minimum. */
export function temperatureDemand(tempC) {
  return 1 + clamp(Math.abs(tempC - 18) * 0.012, 0, 0.3)
}

/**
 * Work out one moment of the grid.
 * @param {object} i
 * @param {number} i.windKmh      10 m wind speed in km/h
 * @param {number} i.radiation    shortwave radiation in W/m²
 * @param {number} i.hour         hour of day, 0–24
 * @param {number} [i.tempC]      air temperature in °C
 * @param {number} [i.demandScale] extra demand multiplier (simulator)
 * @param {object} i.profile      region profile (see regions.js)
 */
export function computeMix({ windKmh, radiation, hour, tempC = 18, demandScale = 1, profile }) {
  const demand = profile.baseMW * demandShape(hour) * temperatureDemand(tempC) * demandScale

  const windCF = windCapacityFactor(windKmh)
  const solarCF = solarCapacityFactor(radiation)
  let wind = profile.windMW * windCF
  let solar = profile.solarMW * solarCF
  const nuclear = profile.baseMW * profile.nuclearShare
  const hydro = profile.baseMW * profile.hydroShare

  // Merit order: zero-fuel-cost sources run first, fossil plants fill the gap.
  const clean = wind + solar + nuclear + hydro
  let fossil = 0
  let curtailed = 0
  let shortfall = 0

  if (clean >= demand) {
    // Too much supply: the variable sources get turned down (curtailment).
    curtailed = clean - demand
    const variable = wind + solar
    const cut = Math.min(curtailed, variable)
    if (variable > 0) {
      wind -= cut * (wind / variable)
      solar -= cut * (solar / variable)
    }
    curtailed = cut
  } else {
    fossil = demand - clean
    const fossilCap = profile.baseMW * 0.85
    if (fossil > fossilCap) {
      shortfall = fossil - fossilCap
      fossil = fossilCap
    }
  }

  const served = wind + solar + nuclear + hydro + fossil
  const carbon =
    served > 0
      ? (fossil * profile.fossilCI + nuclear * EMISSIONS.nuclear + hydro * EMISSIONS.hydro +
          wind * EMISSIONS.wind + solar * EMISSIONS.solar) / served
      : 0

  // Price: cheap when fuel isn't burning, steeply dearer as fossil plants
  // near their limit, and negative when there's a glut to dump.
  let price
  if (curtailed > 0) {
    price = 12 - 45 * Math.min(1, (curtailed / demand) * 6)
  } else {
    const fossilShare = fossil / demand
    const stress = Math.max(0, fossil / (profile.baseMW * 0.85) - 0.8)
    price = 30 + 120 * fossilShare ** 1.6 + 500 * stress ** 2
  }
  if (shortfall > 0) price += 250 * Math.min(1, shortfall / demand * 10)

  const renewables = wind + solar + hydro
  return {
    demand, wind, solar, hydro, nuclear, fossil, curtailed, shortfall,
    served, windCF, solarCF, carbon, price,
    renewableShare: served > 0 ? renewables / served : 0,
    cleanShare: served > 0 ? (renewables + nuclear) / served : 0,
  }
}

/** Build a 24-point daily curve for the simulator from fixed weather. */
export function dailyCurve({ windKmh, radiation, tempC, demandScale, profile }) {
  return Array.from({ length: 25 }, (_, h) => {
    // The sun follows a bell curve through the day; the slider is the noon peak.
    const sunShape = clamp(Math.sin(((h - 6) / 12) * Math.PI), 0, 1)
    return computeMix({ windKmh, radiation: radiation * sunShape, hour: h, tempC, demandScale, profile })
  })
}

/** Colour ramp for carbon intensity (g/kWh) → a label a person can use. */
export function carbonBand(g) {
  if (g < 80) return { label: 'Very clean', tone: 'leaf' }
  if (g < 200) return { label: 'Clean', tone: 'leaf' }
  if (g < 350) return { label: 'Moderate', tone: 'sun' }
  if (g < 500) return { label: 'Carbon-heavy', tone: 'ember' }
  return { label: 'Very carbon-heavy', tone: 'ember' }
}
