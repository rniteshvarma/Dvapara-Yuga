import Fuse from 'fuse.js'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DYNASTIES } from '../data/dynasties'
import type { Character } from '../data/types'
import type { Engine } from '../render/engine'
import { findPeople, spellKey } from './findPeople'

export { spellKey } from './findPeople'

const SUGGESTED = ['krishna', 'arjuna', 'karna', 'bhishma', 'draupadi', 'vyasa', 'duryodhana', 'shakuntala']

/** ⌘K palette: understands epithets and alternate names (Partha, Gangeya, Radheya…). */
export function Search({ engine, open, onClose, onRelate }: { engine: Engine; open: boolean; onClose: () => void; onRelate: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const galleries = useMemo(
    () => [
      ...engine.layout.groups.map((g) => ({ id: g.id, title: g.title, sub: `${g.members.length} · ${g.sub}` })),
      ...engine.layout.islands.map((g) => ({ id: g.id, title: g.title, sub: `${g.members.length} · a family from the tales` })),
    ],
    [engine],
  )
  const galleryFuse = useMemo(() => new Fuse(galleries, { keys: ['title', 'sub'], threshold: 0.3, ignoreLocation: true }), [galleries])
  const places = useMemo(() => {
    const qk = spellKey(q)
    if (qk.length < 3) return []
    return galleryFuse.search(q.trim(), { limit: 4 }).map((r) => r.item)
      .filter((p) => p.title.split(/[\s&,]+/).some((w) => spellKey(w).startsWith(qk))).slice(0, 2)
  }, [q, galleryFuse])

  const results: Character[] = useMemo(
    () => (q.trim() ? findPeople(engine.graph, q) : SUGGESTED.map((id) => engine.graph.byId.get(id)!).filter(Boolean)),
    [q, engine],
  )

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])
  useEffect(() => setActive(0), [q])
  // a closing palette lets go of the keyboard at once, not when its fade ends
  useEffect(() => { if (!open) inputRef.current?.blur() }, [open])

  const choose = (c: Character) => {
    onClose()
    engine.select(c.id)
  }

  const matchedAlias = (c: Character) => {
    const s = spellKey(q)
    if (!s || spellKey(c.name).includes(s)) return null
    return c.aliases.find((a) => spellKey(a).includes(s)) ?? null
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div className="search-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <m.div
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
            {places.length > 0 && (
              <ul className="results places">
                {places.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => { onClose(); engine.flyToGroup(p.id) }}>
                      <i className="swatch star" />
                      <span className="r-name">{p.title}</span>
                      <span className="r-house">{p.sub.split(' · ')[0]} people</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
            <button className="search-relate" onClick={() => { onClose(); onRelate() }}>
              <span>How are two people related?</span>
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M4 10h12m-4-4 4 4-4 4" /></svg>
            </button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
