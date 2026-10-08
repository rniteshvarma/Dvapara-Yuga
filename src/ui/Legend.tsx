import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { DYNASTIES, RELATION_STYLE, STORY_KIND, TRADITION } from '../data/dynasties'
import type { DynastyKey } from '../data/types'
import type { Engine, Lens } from '../render/engine'

const HOUSE_ORDER: DynastyKey[] = [
  'deva', 'lunar', 'kuru', 'pandava', 'kaurava', 'anga', 'yadava', 'panchala',
  'matsya', 'gandhara', 'madra', 'rishi', 'naga', 'asura', 'solar', 'realms',
]

function ThreadSample({ k }: { k: keyof typeof RELATION_STYLE }) {
  const ink = '#4a4558'
  const common = { strokeLinecap: 'round' as const, fill: 'none' }
  switch (k) {
    case 'spouse':
      return (
        <svg viewBox="0 0 44 12" className="ts">
          <path d="M2 4.2H42" stroke="#b0806e" strokeWidth="1.8" strokeDasharray="0.1 5" className="flow slow" {...common} />
          <path d="M2 7.8H42" stroke="#b0806e" strokeWidth="1.8" strokeDasharray="0.1 5" className="flow slow" {...common} />
        </svg>
      )
    case 'divine':
      return (
        <svg viewBox="0 0 44 12" className="ts">
          <path d="M2 6H42" stroke="#c49a2c" strokeWidth="2.2" strokeDasharray="0.1 5" className="flow twinkle" {...common} />
        </svg>
      )
    case 'niyoga':
      return (
        <svg viewBox="0 0 44 12" className="ts">
          <path d="M2 6H42" stroke={ink} strokeWidth="1.8" strokeDasharray="3.5 3.5" className="flow" {...common} />
        </svg>
      )
    case 'adoptive':
      return (
        <svg viewBox="0 0 44 12" className="ts">
          {[5, 12, 19, 26, 33, 40].map((x) => <circle key={x} cx={x} cy="6" r="1.6" stroke={ink} strokeWidth="0.9" fill="none" />)}
        </svg>
      )
    case 'boon':
      return (
        <svg viewBox="0 0 44 12" className="ts">
          <defs><linearGradient id="ember" gradientUnits="userSpaceOnUse" x1="2" x2="42" y1="0" y2="0"><stop offset="0" stopColor="#db6b28" /><stop offset="1" stopColor="#f0a83f" /></linearGradient></defs>
          <path d="M2 6H42" stroke="url(#ember)" strokeWidth="2.2" strokeDasharray="0.1 5" className="flow" {...common} />
        </svg>
      )
    case 'rebirth':
      return (
        <svg viewBox="0 0 44 12" className="ts">
          <defs><linearGradient id="rebirth" gradientUnits="userSpaceOnUse" x1="2" x2="42" y1="0" y2="0"><stop offset="0" stopColor="#8c62b8" /><stop offset="1" stopColor="#d88c66" /></linearGradient></defs>
          <path d="M2 6H42" stroke="url(#rebirth)" strokeWidth="2.2" strokeDasharray="0.1 5" className="flow" {...common} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 44 12" className="ts">
          <path d="M2 6H42" stroke={ink} strokeWidth="1.9" strokeDasharray="0.1 5" className="flow" {...common} />
        </svg>
      )
  }
}

/** A key to the visual language. Hovering a house lights every member of it. */
export function Legend({ engine, hidden, lens, onTour, onText }: { engine: Engine; hidden: boolean; lens: Lens; onTour: () => void; onText: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <m.div
      className="legend-wrap"
      initial={{ opacity: 0, y: 8 }}
      animate={hidden ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: hidden ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: hidden ? 'none' : 'auto' }}
    >
      <AnimatePresence>
        {open && (
          <m.div
            className="legend glass"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {lens === 'lineage' ? (
              <section>
                <h3>Family threads</h3>
                <ul className="threads">
                  {(Object.keys(RELATION_STYLE) as (keyof typeof RELATION_STYLE)[]).map((k) => (
                    <li key={k}>
                      <ThreadSample k={k} />
                      <span>{RELATION_STYLE[k].label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <>
                <section>
                  <h3>Story threads <small>flow from the one who acts</small></h3>
                  <ul className="threads kinds">
                    {(Object.keys(STORY_KIND) as (keyof typeof STORY_KIND)[]).map((k) => (
                      <li key={k} style={{ ['--k' as string]: STORY_KIND[k].color }}>
                        <svg viewBox="0 0 44 12" className="ts"><path d="M2 6H42" stroke="var(--k)" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round" className="flow" fill="none" /></svg>
                        <span>{STORY_KIND[k].label}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Sources</h3>
                  <ul className="sources">
                    {(Object.keys(TRADITION) as (keyof typeof TRADITION)[]).map((t) => (
                      <li key={t}><span className={`badge ${t}`}>{TRADITION[t].short}</span>{TRADITION[t].label}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}
            <section>
              <h3>Houses <small>point or tap to illuminate</small></h3>
              <ul className="houses" onMouseLeave={() => engine.highlightDynasty(null)}>
                {HOUSE_ORDER.map((k) => (
                  <li key={k} onMouseEnter={() => engine.highlightDynasty(k)} onClick={() => engine.highlightDynasty(engine.dynastyFocus === k ? null : k)} style={{ ['--c' as string]: DYNASTIES[k].color }}>
                    <i />
                    {DYNASTIES[k].label}
                  </li>
                ))}
              </ul>
            </section>
            <section className="frames">
              <h3>Frames
                <button className="legend-tour" onClick={() => { setOpen(false); onTour() }}>Take the tour</button>
                <button className="legend-tour" onClick={() => { setOpen(false); onText() }}>Read as text</button>
              </h3>
              <div className="frame-row">
                <span><svg viewBox="0 0 24 24" width="22"><circle cx="12" cy="12" r="6" fill="#fffdf8" stroke="#4a4558" strokeWidth="1.2" /><circle cx="12" cy="12" r="2.4" fill="#4a4558" /></svg>Mortal</span>
                <span><svg viewBox="0 0 24 24" width="22"><circle cx="12" cy="12" r="5" fill="#fffdf8" stroke="#4a4558" strokeWidth="1.2" /><circle cx="12" cy="12" r="2" fill="#4a4558" /><circle cx="12" cy="12" r="8.4" fill="none" stroke="#4a4558" strokeWidth="0.7" opacity="0.6" /></svg>Royal</span>
                <span><svg viewBox="0 0 24 24" width="22"><circle cx="12" cy="12" r="6" fill="#fffdf8" stroke="#4a4558" strokeWidth="1.2" /><circle cx="12" cy="12" r="3.3" fill="none" stroke="#4a4558" strokeWidth="0.7" /><circle cx="12" cy="12" r="1.2" fill="#4a4558" /></svg>Sage</span>
                <span><svg viewBox="0 0 24 24" width="22"><circle cx="12" cy="12" r="5" fill="#fffdf8" stroke="#b8913a" strokeWidth="1.2" /><circle cx="12" cy="12" r="2" fill="#b8913a" />{Array.from({ length: 8 }).map((_, i) => <ellipse key={i} cx="12" cy="4.4" rx="1.6" ry="2.6" fill="none" stroke="#c49a2c" strokeWidth="0.6" transform={`rotate(${i * 45} 12 12)`} />)}</svg>Celestial</span>
              </div>
            </section>
          </m.div>
        )}
      </AnimatePresence>
      <button className={`legend-toggle glass ${open ? 'on' : ''}`} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
          <circle cx="5" cy="10" r="1.4" fill="currentColor" /><circle cx="10" cy="10" r="1.4" fill="currentColor" /><circle cx="15" cy="10" r="1.4" fill="currentColor" />
        </svg>
        <span>{open ? 'Hide the key' : 'How to read the threads'}</span>
      </button>
    </m.div>
  )
}
