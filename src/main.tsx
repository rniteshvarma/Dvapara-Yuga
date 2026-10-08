import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion } from 'motion/react'
import App from './App'
import { loadCensus } from './data/census'
import './styles.css'

// the census is the bulk of the data: ask for it before React does anything else
loadCensus().catch(() => undefined)

// the animation engine arrives in its own file, fetched alongside the app's first paint
const motionFeatures = () => import('./motionFeatures').then((r) => r.default)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={motionFeatures} strict>
      <App />
    </LazyMotion>
  </StrictMode>,
)
