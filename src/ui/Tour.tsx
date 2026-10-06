import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Engine } from '../render/engine'

/**
 * A first visit's three steps: how to read the threads, how to find anyone, how to open a life.
 * Shown once, after the opening, and never over a shared link; “Take the tour” in the key replays it.
 */
const STEPS = [
  {
    target: '.legend-toggle',
    title: 'Read the threads',
    text: 'Every dotted thread is a bond. A dark thread runs from parent to child, a doubled rose thread is a marriage, gold is a god’s child and ember a birth from fire or a rite. This key explains them all.',
  },
  {
    target: '.search-trigger',
    title: 'Find anyone',
    text: 'Search by name, by any spelling, or by an epithet — Partha, Gangeya, Radheya. Press / from anywhere. From search you can also ask how any two people are related.',
  },
  {
    target: '.card .profile-cta',
    title: 'Open a life',
    text: 'Click any name for their card. “Open profile” gives the whole life: family with the passages that tell it, banner and weapons, their own words, and where the tellings differ.',
    before: (e: Engine) => { if (!e.selected) e.select('karna') },
  },
]

const KEY = 'dy-tour'
export const tourSeen = () => { try { return localStorage.getItem(KEY) === '1' } catch { return true } }
const markSeen = () => { try { localStorage.setItem(KEY, '1') } catch { /* private mode */ } }

export function Tour({ engine, active, onDone }: { engine: Engine; active: boolean; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const step = STEPS[i]

  useEffect(() => { if (active) setI(0) }, [active])
  useEffect(() => { if (active) step.before?.(engine) }, [active, step, engine])

  // follow the target as the page settles (the card slides in, the window resizes)
  useLayoutEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      const el = document.querySelector(step.target)
      const r = el?.getBoundingClientRect() ?? null
      setRect((old) => (r && old && Math.abs(r.x - old.x) < 0.5 && Math.abs(r.y - old.y) < 0.5 && r.width === old.width ? old : r))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [active, step])

  const finish = () => { markSeen(); onDone() }
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish())

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); finish() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' && i > 0) { e.stopPropagation(); setI(i - 1) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  // place the card beside the target: below it if there is room, otherwise above
  const W = Math.min(330, window.innerWidth - 32)
  const pad = 10
  let left = 16, top = window.innerHeight / 2 - 90
  if (rect) {
    const ch = card.current?.offsetHeight ?? 260          // the card's real height, so it never covers its target
    left = Math.max(16, Math.min(window.innerWidth - W - 16, rect.left + rect.width / 2 - W / 2))
    top = rect.bottom + 16 + ch < window.innerHeight ? rect.bottom + 16 : Math.max(16, rect.top - 20 - ch)
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div className="tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          {rect && (
            <motion.div
              className="tour-ring"
              aria-hidden
              animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            />
          )}
          <motion.div
            key={i}
            ref={card}
            className="tour-card glass"
            role="dialog"
            aria-live="polite"
            aria-label={`Step ${i + 1} of ${STEPS.length}: ${step.title}`}
            style={{ width: W }}
            initial={{ opacity: 0, y: 8, left, top }}
            animate={{ opacity: 1, y: 0, left, top }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="tour-count">{i + 1} of {STEPS.length}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <div className="tour-actions">
              <button className="tour-skip" onClick={finish}>{i < STEPS.length - 1 ? 'Skip' : ''}</button>
              <div>
                {i > 0 && <button className="tour-back" onClick={() => setI(i - 1)}>Back</button>}
                <button className="profile-cta" onClick={next}>{i < STEPS.length - 1 ? 'Next' : 'Begin'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
