/**
 * Regenerates src/data/history.json — the annual carbon-intensity and
 * renewable-share series the dashboard charts — from Our World in Data's open
 * energy dataset (https://github.com/owid/energy-data, CC BY 4.0).
 *
 * Shipping this slice with the site means the long-term charts never depend
 * on a third-party download at runtime.
 *
 *   node scripts/build-history.mjs
 */
import { writeFileSync } from 'node:fs'

const SOURCE = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv'
const COUNTRIES = ['Canada', 'Germany', 'Spain', 'United Kingdom', 'United States', 'Brazil', 'India', 'Australia', 'Japan']

const csv = await (await fetch(SOURCE)).text()
const lines = csv.split('\n')
const head = lines[0].split(',')
const col = (name) => head.indexOf(name)
const [yearCol, carbonCol, renewCol] = [col('year'), col('carbon_intensity_elec'), col('renewables_share_elec')]

const countries = {}
for (const name of COUNTRIES) {
  const rows = lines.filter((l) => l.startsWith(name + ',')).map((l) => l.split(','))
  const series = (c) =>
    rows
      .filter((r) => r[c] !== '' && Number.isFinite(Number(r[c])))
      .map((r) => ({ year: Number(r[yearCol]), value: Math.round(Number(r[c]) * 10) / 10 }))
      .sort((a, b) => a.year - b.year)
  countries[name] = { carbon: series(carbonCol), renewables: series(renewCol) }
}

writeFileSync(
  new URL('../src/data/history.json', import.meta.url),
  JSON.stringify({ source: 'Our World in Data energy dataset', url: 'https://github.com/owid/energy-data', retrieved: new Date().toISOString().slice(0, 10), countries }),
)
console.log('wrote history.json for', Object.keys(countries).length, 'countries')
