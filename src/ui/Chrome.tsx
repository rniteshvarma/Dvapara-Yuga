import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { ZOOM_STEP, type Engine, type Lens } from '../render/engine'
import { onAnthem, toggleAnthem, type AnthemState } from './anthem'

const fade = (hidden: boolean, delay = 0) => ({
  initial: { opacity: 0, y: -6 },
  animate: hidden ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay: hidden ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
})

/** Wordmark, search entry, zoom controls and the quiet usage hint. */
export function Chrome({ engine, hidden, lens, onSearch, onRelate }: { engine: Engine; hidden: boolean; lens: Lens; onSearch: () => void; onRelate: () => void }) {
  const [hint, setHint] = useState(true)
  // the hint steps aside once you are close in, where names fill the foot of the screen
  const [close, setClose] = useState(false)
  const [input, setInput] = useState<'trackpad' | 'mouse' | null>(engine.inputMode)
  useEffect(() => {
    let moves = 0
    const off = engine.on('zoom', (z) => {
      setClose(z > 0.55)
      if (++moves > 60) setHint(false)
    })
    const offInput = engine.on('input', (m) => {
      setInput(m)
      setHint(true)
      moves = 0
    })
    return () => { off(); offInput() }
  }, [engine])
  const zoomHint = input === 'trackpad' ? 'Pinch to zoom' : input === 'mouse' ? 'Wheel to zoom' : 'Pinch or wheel to zoom'
  const moveHint = input === 'trackpad' ? 'Two fingers to move' : 'Drag to move'
  const extraHint = 'Double-click to dive in'
  const [copied, setCopied] = useState(false)
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* no clipboard: the address bar still holds the view */ }
  }
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <>
      <m.header className="brand" {...fade(hidden)} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
        <button className="brand-mark" onClick={() => engine.fit()} aria-label="Show the whole lineage">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
            <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="0.1 3.1" strokeLinecap="round" />
            <circle cx="16" cy="16" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="16" cy="16" r="2" fill="currentColor" />
          </svg>
          <span>
            <b>Dvapara Yuga</b>
            <i>The living lineage of the Mahabharata</i>
          </span>
        </button>
      </m.header>

      <m.div className="topbar" {...fade(hidden, 0.15)} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
        <AnthemButton />
        <button className="relate-trigger glass" onClick={onRelate} aria-label="How are they related?" title="How are they related?">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
            <circle cx="5" cy="5" r="2.2" /><circle cx="15" cy="15" r="2.2" /><path d="M6.6 6.6c2 1 2.4 3.4 3.4 4.4s2.4 1.4 3.4 2.4" strokeDasharray="0.1 2.4" />
          </svg>
          <span>Relate</span>
        </button>
        <button className="search-trigger glass" onClick={onSearch}>
          <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12.6 12.6 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Find a character</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
      </m.div>

      <m.div className="zoombar glass" {...fade(hidden, 0.3)} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
        <button onClick={() => engine.zoomBy(ZOOM_STEP)} aria-label="Zoom in">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => engine.zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <span className="sep" />
        <button onClick={share} aria-label="Copy a link to this view" title="Copy a link to this view">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.8.8M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l.8-.8" />
          </svg>
        </button>
        <button onClick={() => engine.fit()} aria-label="See the whole lineage">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4" />
          </svg>
        </button>
      </m.div>

      <AnimatePresence>
        {copied && (
          <m.div className="toast glass" role="status" style={{ x: "-50%" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            Link to this view copied
          </m.div>
        )}
      </AnimatePresence>

      <m.div
        className="hint"
        initial={{ opacity: 0 }}
        key={lens}
        animate={{ opacity: hidden || close || (!hint && lens === 'lineage') ? 0 : 1 }}
        transition={{ duration: 1.2, delay: hidden ? 0 : 1.2 }}
      >
        {lens === 'lineage' ? (
          <>
            <span>{zoomHint}</span>
            <span className="dot" />
            <span>{moveHint}</span>
            <span className="dot" />
            <span>{extraHint}</span>
            <span className="dot" />
            <span>Hover to awaken a bloodline</span>
          </>
        ) : (
          <>
            <span>Glowing names carry stories</span>
            <span className="dot" />
            <span>Click one to follow its threads</span>
          </>
        )}
      </m.div>
    </>
  )
}

/** Plays “Yada yada hi”; a thin gold ring fills as it sings. */
function AnthemButton() {
  const [st, setSt] = useState<AnthemState>({ playing: false, progress: 0 })
  useEffect(() => onAnthem(setSt), [])
  const C = 2 * Math.PI * 19
  return (
    <button
      className={`anthem-trigger glass ${st.playing ? 'on' : ''}`}
      onClick={toggleAnthem}
      aria-label={st.playing ? 'Pause the chant' : 'Play the chant: Yada yada hi dharmasya'}
      aria-pressed={st.playing}
      title={st.playing ? 'Pause' : 'Play “Yada yada hi dharmasya”'}
    >
      <svg className="anthem-ring" viewBox="0 0 42 42" aria-hidden>
        <circle cx="21" cy="21" r="19" strokeDasharray={`${(C * st.progress).toFixed(1)} ${C.toFixed(1)}`} />
      </svg>
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
        {st.playing
          ? <path d="M7 5v10M13 5v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          : <path d="M7 4.8v10.4l8.4-5.2z" fill="currentColor" />}
      </svg>
    </button>
  )
}
