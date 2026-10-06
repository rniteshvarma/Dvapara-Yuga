import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ZOOM_STEP, type Engine, type Lens } from '../render/engine'

const fade = (hidden: boolean, delay = 0) => ({
  initial: { opacity: 0, y: -6 },
  animate: hidden ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay: hidden ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
})

/** Wordmark, search entry, zoom controls and the quiet usage hint. */
export function Chrome({ engine, hidden, lens, onSearch, onRelate }: { engine: Engine; hidden: boolean; lens: Lens; onSearch: () => void; onRelate: () => void }) {
  const [hint, setHint] = useState(true)
  const [input, setInput] = useState<'trackpad' | 'mouse' | null>(engine.inputMode)
  useEffect(() => {
    let moves = 0
    const off = engine.on('zoom', () => {
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
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <>
      <motion.header className="brand" {...fade(hidden)} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
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
      </motion.header>

      <motion.div className="topbar" {...fade(hidden, 0.15)} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
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
      </motion.div>

      <motion.div className="zoombar glass" {...fade(hidden, 0.3)} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
        <button onClick={() => engine.zoomBy(ZOOM_STEP)} aria-label="Zoom in">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => engine.zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <span className="sep" />
        <button onClick={() => engine.fit()} aria-label="See the whole lineage">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4" />
          </svg>
        </button>
      </motion.div>

      <motion.div
        className="hint"
        initial={{ opacity: 0 }}
        key={lens}
        animate={{ opacity: hidden || (!hint && lens === 'lineage') ? 0 : 1 }}
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
      </motion.div>
    </>
  )
}
