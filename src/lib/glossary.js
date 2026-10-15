/**
 * Plain-language definitions, written for a curious ten-year-old.
 * <Term k="spotPrice"> looks the entry up here, so a definition is
 * written once and explained the same way everywhere.
 */
export const GLOSSARY = {
  spotPrice: {
    label: 'Spot price',
    short: 'What electricity costs right now.',
    long: 'Like surge pricing for power: it’s the price for electricity bought this very moment. When lots of cheap wind and sun are around, it drops. When the grid needs expensive backup plants, it jumps.',
  },
  mwh: {
    label: 'Megawatt-hour',
    short: 'A big bucket of electricity.',
    long: 'One megawatt-hour (MWh) is enough electricity to run about 330 homes for one hour. Power plants and grids are measured in these big buckets.',
  },
  curtailment: {
    label: 'Curtailment',
    short: 'Wasting clean power on purpose.',
    long: 'Sometimes wind and sun make more electricity than anyone can use. Grid operators have to switch some turbines off, like turning down a tap when the bath is full.',
  },
  carbonIntensity: {
    label: 'Carbon intensity',
    short: 'How dirty each unit of power is.',
    long: 'It counts how many grams of carbon dioxide are released for every kilowatt-hour you use. A low number means the electricity is cleaner right now.',
  },
  baseLoad: {
    label: 'Base load',
    short: 'The power we always need.',
    long: 'Even at 3 a.m. fridges hum, hospitals run and streetlights glow. Base load is that steady minimum of electricity a place needs around the clock.',
  },
  peakDemand: {
    label: 'Peak demand',
    short: 'The busiest time on the grid.',
    long: 'Everyone cooks, charges and switches on lights at about the same time in the evening. That rush is the peak, and the grid must be ready for it.',
  },
  capacityFactor: {
    label: 'Capacity factor',
    short: 'How hard a plant is working.',
    long: 'A wind farm could make a lot of power if the wind were perfect. The capacity factor is the share of that maximum it’s actually making right now.',
  },
  meritOrder: {
    label: 'Merit order',
    short: 'The queue of power plants.',
    long: 'The grid asks the cheapest plants to run first: sun and wind cost nothing for fuel, then nuclear, then gas and coal. The last plant switched on sets the price for everyone.',
  },
  shortwave: {
    label: 'Solar radiation',
    short: 'How much sunshine hits the ground.',
    long: 'Measured in watts per square metre. A bright summer noon is about 1,000. Clouds can cut it by more than half, which is why solar output changes so quickly.',
  },
  renewableShare: {
    label: 'Renewable share',
    short: 'The slice of power that never runs out.',
    long: 'The portion of electricity coming from sources nature refills, like wind, sun and flowing water, instead of burning fuel.',
  },
}
