import { AnimatePresence, motion } from 'motion/react'
import type { Engine, Lens } from '../render/engine'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * The two ways of reading the map. Lineage shows who is born of whom; Stories
 * shows what people did to one another. They never draw at the same time.
 */
export function LensBar({ engine, lens, canon, hidden, trail }: {
  engine: Engine; lens: Lens; canon: boolean; hidden: boolean; trail: string[]
}) {
  return (
    <motion.div
      className={`lensbar ${hidden ? 'hidden' : ''}`}
      initial={{ opacity: 0, y: -8 }}
      animate={hidden ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: hidden ? 0 : 0.2, ease }}
    >
      <div className="lens glass" role="tablist" aria-label="How to read the map">
        {(['lineage', 'stories'] as const).map((l) => (
          <button key={l} role="tab" aria-selected={lens === l} className={lens === l ? 'on' : ''} onClick={() => engine.setLens(l)}>
            {lens === l && <motion.span layoutId="lens-pill" className="lens-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="lens-label">
              {l === 'lineage' ? (
                <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden><circle cx="10" cy="4" r="2" fill="currentColor" /><circle cx="5" cy="15" r="2" fill="currentColor" /><circle cx="15" cy="15" r="2" fill="currentColor" /><path d="M10 6v4M10 10 5 13M10 10l5 3" stroke="currentColor" strokeWidth="1.2" strokeDasharray="0.1 2.2" strokeLinecap="round" fill="none" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden><circle cx="4" cy="14" r="2" fill="currentColor" /><circle cx="16" cy="14" r="2" fill="currentColor" /><path d="M5 12.5C7 4 13 4 15 12.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.2 2" strokeLinecap="round" fill="none" /></svg>
              )}
              {l === 'lineage' ? 'Lineage' : 'Stories'}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lens === 'stories' && (
          <motion.label
            className="canon glass"
            initial={{ opacity: 0, x: -8, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, x: -8, width: 0 }}
            transition={{ duration: 0.4, ease }}
            title="Hide episodes that are not in the Critical Edition of the Mahabharata"
          >
            <input type="checkbox" checked={canon} onChange={(e) => engine.setCanonOnly(e.target.checked)} />
            <span className="switch" aria-hidden><i /></span>
            <span className="canon-label">Vyasa’s text only</span>
          </motion.label>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lens === 'stories' && trail.length > 1 && (
          <motion.nav
            className="trail"
            aria-label="Characters you have followed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease }}
          >
            {trail.map((id, i) => (
              <span key={id + i}>
                {i > 0 && <span className="trail-sep">›</span>}
                <button className={i === trail.length - 1 ? 'here' : ''} onClick={() => engine.select(id)}>
                  {engine.graph.byId.get(id)?.name}
                </button>
              </span>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
