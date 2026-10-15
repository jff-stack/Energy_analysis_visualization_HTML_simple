import { useCallback, useState } from 'react'
import SmoothScroll from './components/SmoothScroll'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Intro from './components/Intro'
import Ticker from './components/Ticker'
import GridStory from './components/GridStory'
import Dashboard from './components/Dashboard'
import Simulator from './components/Simulator'
import Planner from './components/Planner'
import Leaderboard from './components/Leaderboard'
import Quiz from './components/Quiz'
import Glossary from './components/Glossary'
import ErrorBoundary from './components/ErrorBoundary'
import { useLiveData } from './hooks/useLiveData'
import { DEFAULT_REGION, REGIONS } from './lib/regions'

/** The intro plays once per session, and never for reduced-motion users. */
const shouldIntro = () => {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (window.sessionStorage.getItem('current-intro')) return false
    window.sessionStorage.setItem('current-intro', '1')
  } catch {
    /* storage blocked: just play it */
  }
  return true
}

/** Region is shareable: `?r=berlin` selects it on load and tracks changes. */
const initialRegion = () => {
  try {
    const id = new URLSearchParams(window.location.search).get('r')
    return REGIONS.find((r) => r.id === id) ?? DEFAULT_REGION
  } catch {
    return DEFAULT_REGION
  }
}

/**
 * App — composition root.
 *
 * Data flows one way: the picked region → useLiveData (weather + model +
 * history) → presentational sections. Sections never fetch for themselves,
 * except the leaderboard, which owns its own one-request snapshot.
 */
export default function App() {
  const [region, setRegionState] = useState(initialRegion)
  const [intro, setIntro] = useState(shouldIntro)
  const endIntro = useCallback(() => setIntro(false), [])
  const { weather, model, history, retryHistory } = useLiveData(region)

  const setRegion = (r) => {
    setRegionState(r)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('r', r.id)
      window.history.replaceState(null, '', url)
    } catch {
      /* non-critical: sharing the link just won't reflect the region */
    }
  }

  return (
    <SmoothScroll>
      <div className="ambient" aria-hidden="true" />
      {intro && <Intro onDone={endIntro} />}
      <Nav region={region} onRegion={setRegion} status={weather.status} simulated={weather.simulated} />

      <main id="top">
        <ErrorBoundary label="The introduction">
          <Hero region={region} now={model?.now} loading={!model} go={!intro} />
          <Ticker region={region} now={model?.now} weather={weather.data?.current} />
        </ErrorBoundary>
        <ErrorBoundary label="The story">
          <GridStory />
        </ErrorBoundary>
        <ErrorBoundary label="The dashboard">
          <Dashboard region={region} weather={weather} model={model} history={history} retryHistory={retryHistory} />
        </ErrorBoundary>
        <ErrorBoundary label="The simulator">
          {/* Not re-keyed: sliders glide to a new region's weather once it has loaded. */}
          <Simulator
            region={region}
            start={weather.data?.current}
            seed={weather.status === 'ready' ? `${region.id}-${weather.updatedAt?.getTime()}` : null}
          />
        </ErrorBoundary>
        <ErrorBoundary label="The planner">
          <Planner model={model} region={region} />
        </ErrorBoundary>
        <ErrorBoundary label="The comparison">
          <Leaderboard region={region} onRegion={setRegion} />
        </ErrorBoundary>
        <ErrorBoundary label="The quiz">
          <Quiz />
        </ErrorBoundary>
        <ErrorBoundary label="The glossary">
          <Glossary />
        </ErrorBoundary>
      </main>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-mute sm:flex-row sm:justify-between">
          <span>Current. An interactive explainer on how electricity grids work.</span>
          <span>
            Weather:{' '}
            <a className="underline decoration-white/30 hover:text-ink" href="https://open-meteo.com/">Open-Meteo</a>
            {' · '}History:{' '}
            <a className="underline decoration-white/30 hover:text-ink" href="https://ourworldindata.org/electricity-mix">Our World in Data</a>
          </span>
        </div>
      </footer>
    </SmoothScroll>
  )
}
