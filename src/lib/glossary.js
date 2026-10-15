/**
 * Plain-language definitions, written so a ten-year-old could follow them.
 * <Term k="spotPrice"> looks the entry up here, so each concept is explained
 * once and identically wherever it appears.
 */
export const GLOSSARY = {
  spotPrice: {
    label: 'Spot price',
    short: 'What electricity costs right now.',
    long: 'The price paid for electricity delivered at this moment. It rises when expensive backup plants are needed and falls when wind and sunshine are plentiful.',
  },
  mwh: {
    label: 'Megawatt-hour',
    short: 'A large unit of electrical energy.',
    long: 'One megawatt-hour (MWh) is roughly the electricity that 330 homes use in an hour. Grids and power stations are measured in these units.',
  },
  curtailment: {
    label: 'Curtailment',
    short: 'Clean power deliberately switched off.',
    long: 'When wind and solar produce more than can be used or stored, operators turn some turbines and panels down, much like closing a tap when a bath is full.',
  },
  carbonIntensity: {
    label: 'Carbon intensity',
    short: 'How much carbon each unit of power releases.',
    long: 'The grams of carbon dioxide emitted for every kilowatt-hour generated. A lower number means the electricity is cleaner at that moment.',
  },
  baseLoad: {
    label: 'Base load',
    short: 'The power a region always needs.',
    long: 'The minimum level of demand that continues around the clock, from refrigeration, hospitals, street lighting and industry.',
  },
  peakDemand: {
    label: 'Peak demand',
    short: 'The busiest period on the grid.',
    long: 'The short window, usually in the evening, when cooking, heating, lighting and charging all overlap. The grid must be sized to meet it.',
  },
  capacityFactor: {
    label: 'Capacity factor',
    short: 'How hard a plant is working.',
    long: 'The share of a plant’s maximum output that it is producing right now. A wind farm in a light breeze might run at 10%.',
  },
  meritOrder: {
    label: 'Merit order',
    short: 'The ranking of power plants by cost.',
    long: 'The grid calls on the cheapest sources first: wind and solar, then nuclear and hydro, then gas and coal. The last plant needed sets the price for everyone.',
  },
  shortwave: {
    label: 'Solar radiation',
    short: 'How much sunlight reaches the ground.',
    long: 'Measured in watts per square metre. A clear summer midday is close to 1,000. Cloud can cut it by more than half, which is why solar output changes quickly.',
  },
  renewableShare: {
    label: 'Renewable share',
    short: 'The portion of power from sources that renew.',
    long: 'The fraction of electricity produced from wind, sunlight and flowing water rather than from burning fuel.',
  },
}
