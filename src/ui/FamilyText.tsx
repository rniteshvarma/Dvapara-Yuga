import { AnimatePresence, m } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { kinOf } from '../graph/model'
import { descriptor } from '../graph/namesakes'
import type { Engine } from '../render/engine'
import { findPeople } from './findPeople'

/**
 * The family tree as plain text: one person at a time, with their parents, spouses, siblings and
 * children as lists of links. It is the map for anyone using a screen reader or the keyboard — and a
 * quick way for anyone to read a family without the canvas.
 */
export function FamilyText({ engine, open, start, onClose, onProfile }: {
  engine: Engine
  open: boolean
  start: string | null
  onClose: () => void
  onProfile: (id: string) => void
}) {
  const g = engine.graph
  const [id, setId] = useState(start ?? 'shantanu')
  const [path, setPath] = useState<string[]>([])
  const [q, setQ] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (open) { setId(start ?? 'shantanu'); setPath([]); setQ('') } }, [open, start])
  useEffect(() => { if (open) setTimeout(() => heading.current?.focus(), 60) }, [open, id])

  const c = g.byId.get(id)
  const kin = useMemo(() => (c ? kinOf(g, c.id) : null), [g, c])
  const found = useMemo(() => (q.trim() ? findPeople(g, q, 6) : []), [g, q])
  const go = (next: string) => { setPath((p) => [...p, id]); setId(next); setQ('') }
  const back = () => { const p = [...path]; const prev = p.pop(); if (prev) { setPath(p); setId(prev) } }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      e.stopPropagation()                      // the map underneath does not move while reading
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  const List = ({ title, ids }: { title: string; ids: { id: string; note?: string }[] }) =>
    ids.length ? (
      <section>
        <h3>{title} <small>({ids.length})</small></h3>
        <ul>
          {ids.map((x) => {
            const k = g.byId.get(x.id)!
            return (
              <li key={x.id + (x.note ?? '')}>
                <button onClick={() => go(x.id)}>{k.name}</button>
                <span>{x.note ? `${x.note} · ` : ''}{descriptor(k, c)}</span>
              </li>
            )
          })}
        </ul>
      </section>
    ) : null

  const NOTE: Record<string, string> = { legal: 'legal', divine: 'divine', niyoga: 'by niyoga', adoptive: 'foster', boon: 'born of a rite', rebirth: 'former life', avatar: 'incarnation' }

  return (
    <AnimatePresence>
      {open && c && kin && (
        <m.div className="search-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <m.div
            className="famtext glass"
            role="dialog"
            aria-modal="true"
            aria-label="The family, as text"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="famtext-head">
              <span className="famtext-eyebrow">The family, as text</span>
              <button className="close" onClick={onClose} aria-label="Close the text view">
                <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </header>
            <label className="famtext-find">
              <span className="sr-only">Go to someone</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Go to someone — type a name" />
            </label>
            {found.length > 0 && (
              <ul className="famtext-found" aria-label="Matches">
                {found.map((k) => <li key={k.id}><button onClick={() => go(k.id)}>{k.name}</button> <span>{k.epithet ?? k.house}</span></li>)}
              </ul>
            )}
            <article aria-live="polite">
              <h2 ref={heading} tabIndex={-1}>{c.name}</h2>
              <p className="famtext-sub">{[c.epithet, c.house].filter(Boolean).join(' · ')}</p>
              <p className="famtext-summary">{c.summary}</p>
              <div className="famtext-actions">
                {path.length > 0 && <button onClick={back}>← Back to {g.byId.get(path[path.length - 1])?.name}</button>}
                <button onClick={() => { onClose(); engine.select(c.id) }}>Show on the map</button>
                <button onClick={() => { onClose(); onProfile(c.id) }}>Open profile</button>
              </div>
              <List title="Parents" ids={kin.parents.map((p) => ({ id: p.id, note: NOTE[p.type] }))} />
              <List title="Spouses" ids={kin.spouses.map((s) => ({ id: s }))} />
              <List title="Siblings" ids={kin.siblings.map((s) => ({ id: s }))} />
              <List title="Children" ids={kin.children.map((p) => ({ id: p.id, note: NOTE[p.type] }))} />
              {!kin.parents.length && !kin.spouses.length && !kin.siblings.length && !kin.children.length && (
                <p className="famtext-summary">No family is recorded for {c.name} on the map.</p>
              )}
            </article>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
