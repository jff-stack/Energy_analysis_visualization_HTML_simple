/** Ticker — a looping strip of the live numbers, so the page never feels static. */
export default function Ticker({ region, now, weather }) {
  const items = now && weather
    ? [
        `${region.city.toUpperCase()}`,
        `${Math.round(now.renewableShare * 100)}% RENEWABLE`,
        `${Math.round(now.carbon)} G CO₂/KWH`,
        `$${Math.round(now.price)}/MWH`,
        `WIND ${Math.round(weather.windKmh)} KM/H`,
        `SUN ${Math.round(weather.radiation)} W/M²`,
        `${Math.round(weather.tempC)}°C`,
      ]
    : ['CURRENT', 'LIVE WEATHER', 'MODELLED GRID', 'OPEN DATA']

  const row = (key) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === 'b'}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center whitespace-nowrap px-6 text-sm font-extrabold uppercase tracking-[0.14em]">
          {t}
          <span className="ml-12 text-amber">◆</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="overflow-hidden border-y border-orange-900/50 bg-amber py-3 text-void" role="marquee" aria-label="Live grid readings">
      <div className="marquee">{[row('a'), row('b')]}</div>
    </div>
  )
}
