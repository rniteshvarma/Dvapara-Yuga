import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { loadCensus } from './data/census'
import './styles.css'

// the census is the bulk of the data: ask for it before React does anything else
loadCensus().catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
