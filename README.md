# Current

An interactive, browser-only explainer for how electricity grids work. Live weather drives a model of a regional grid; a scroll-driven story and a simulator teach the mechanics along the way.

## What's inside

- **Grid story**: a pinned, scroll-scrubbed lesson on demand, base load, peaks and renewables.
- **Live dashboard**: 48-hour generation forecast, current mix, carbon-intensity gauge and price, with CSV export.
- **Simulator**: sliders for wind, sunlight and temperature that rebuild a whole day on the grid.
- **Planner**: finds the cleanest window in the next 24 hours to run an appliance or charge an EV.
- **Compare**: all regions ranked by renewable share right now, from a single batched request.
- **Quiz** and **plain-language tooltips** for every piece of jargon, plus a glossary.
- Region is shareable via `?r=<region-id>`.

The look is "cinematic brutalism": heavy Inter Black headlines, sharp rectangles divided by 1px warm rust rules, and flat golden-hour amber, gold and sunset on obsidian. No gradients, shadows or glows. Charts are hand-built SVG with smooth monotone curves, animated with GSAP and Framer Motion on a Lenis-smoothed scroll.

## Data

| Layer | Source | Notes |
| --- | --- | --- |
| Weather (wind, solar radiation, cloud, temperature) | [Open-Meteo](https://open-meteo.com/) | Live, keyless, refreshed every 10 minutes |
| National carbon intensity and renewable share, by year | [Our World in Data energy dataset](https://github.com/owid/energy-data) | Open CSV, served via jsDelivr for CORS |
| Generation mix, carbon and price *now and next* | Modelled in `src/lib/gridModel.js` | Derived from the weather; capacities are illustrative, not metered |

If a request fails the interface degrades gracefully: simulated weather is clearly labelled, and the history panel offers a retry.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site is written to `dist/`. Asset paths are relative (`base: './'`), so it works from any sub-path.

## Deploy to GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes automatically. Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Structure

```
src/
  hooks/       useMeteoData, useGridData, useLiveData
  lib/         gridModel (the maths), regions, glossary
  components/  Hero, GridStory, Dashboard, Simulator, Term, charts/
```
