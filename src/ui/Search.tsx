import Fuse from 'fuse.js'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DYNASTIES } from '../data/dynasties'
import type { Character } from '../data/types'
import type { Engine } from '../render/engine'

const SUGGESTED = ['krishna', 'arjuna', 'karna', 'bhishma', 'draupadi', 'vyasa', 'duryodhana', 'shakuntala']

/** ⌘K palette: understands epithets and alternate names (Partha, Gangeya, Radheya…). */
export function Search({ engine, open, onClose }: { engine: Engine; open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const fuse = useMemo(
    () =>
      new Fuse(engine.graph.chars.filter((c) => c.kind !== 'gap'), {
        keys: [
          { name: 'name', weight: 3 },
          { name: 'aliases', weight: 2 },
          { name: 'epithet', weight: 1 },
          { name: 'house', weight: 0.5 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [engine],
  )

  const results: Character[] = useMemo(() => {
    if (!q.trim()) return SUGGESTED.map((id) => engine.graph.byId.get(id)!).filter(Boolean)
    return fuse
      .search(q.trim(), { limit: 24 })
      .sort((a, b) => (a.score! - b.score!) || a.item.tier - b.item.tier)
      .slice(0, 8)
      .map((r) => r.item)
  }, [q, fuse, engine])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])
  useEffect(() => setActive(0), [q])

  const choose = (c: Character) => {
    onClose()
    engine.select(c.id)
  }

  const matchedAlias = (c: Character) => {
    const s = q.trim().toLowerCase()
    if (!s || c.name.toLowerCase().includes(s)) return null
    return c.aliases.find((a) => a.toLowerCase().includes(s)) ?? null
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="search-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className="search glass"
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="search-field">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
                <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12.6 12.6 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                autoFocus
                value={q}
                placeholder="Search by name or epithet — Partha, Gangeya, Radheya…"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose()
                  else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
                  else if (e.key === 'Enter' && results[active]) choose(results[active])
                }}
              />
              <kbd>esc</kbd>
            </div>
            {!q.trim() && <div className="search-caption">Begin with</div>}
            <ul className="results">
              {results.map((c, i) => {
                const alias = matchedAlias(c)
                return (
                  <li key={c.id}>
                    <button
                      className={i === active ? 'on' : ''}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(c)}
                      style={{ ['--c' as string]: DYNASTIES[c.dynasty].color }}
                    >
                      <i className="swatch" />
                      <span className="r-name">
                        {c.name}
                        {alias && <em> “{alias}”</em>}
                      </span>
                      <span className="r-dv">{c.devanagari}</span>
                      <span className="r-house">{c.house}</span>
                    </button>
                  </li>
                )
              })}
              {results.length === 0 && <li className="empty">No one by that name in the lineage — yet.</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
