import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DYNASTIES } from '../data/dynasties'
import type { Character } from '../data/types'
import { relate } from '../graph/relate'
import type { Engine } from '../render/engine'
import { findPeople } from './findPeople'

/**
 * “How are they related?” — pick any two people and walk the chain of family bonds between them.
 * The pair lives in the address (?relate=ghatotkacha~krishna), so a found relationship can be shared.
 */
export function Relate({ engine, open, from, to, onClose, onProfile }: {
  engine: Engine
  open: boolean
  from: string | null
  to: string | null
  onClose: () => void
  onProfile: (id: string) => void
}) {
  const g = engine.graph
  const [a, setA] = useState<string | null>(from)
  const [b, setB] = useState<string | null>(to)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (open) { setA(from); setB(to) } }, [open, from, to])

  // keep the pair in the address while the panel is open
  useEffect(() => {
    if (!open) return
    const url = new URL(location.href)
    url.searchParams.delete('relate')
    const rest = url.searchParams.toString()
    // written by hand so the link reads cleanly: ?relate=ghatotkacha~krishna
    const q = [rest, a && b ? `relate=${encodeURIComponent(a)}~${encodeURIComponent(b)}` : ''].filter(Boolean).join('&')
    history.replaceState(history.state, '', `${url.pathname}${q ? `?${q}` : ''}${url.hash}`)
  }, [open, a, b])

  const rel = useMemo(() => (a && b ? relate(g, a, b) : null), [g, a, b])

  const light = () => {
    if (!rel) return
    const ids = rel.steps.map((s) => s.id)
    onClose()
    engine.select(null, false)
    engine.highlightSet(new Set(ids))
    engine.frameIds(ids)
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* no clipboard */ }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="search-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className="relate glass"
            role="dialog"
            aria-label="How are they related?"
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="relate-head">
              <h2>How are they related?</h2>
              <button className="close" onClick={onClose} aria-label="Close">
                <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </header>
            <div className="relate-pick">
              <Picker engine={engine} value={a} onChange={setA} placeholder="First person — Ghatotkacha" autoFocus={!a} />
              <button className="relate-swap" onClick={() => { setA(b); setB(a) }} aria-label="Swap the two people" title="Swap">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 3v14M6 17l-3-3m3 3 3-3M14 17V3m0 0-3 3m3-3 3 3" /></svg>
              </button>
              <Picker engine={engine} value={b} onChange={setB} placeholder="Second person — Krishna" autoFocus={!!a && !b} />
            </div>

            {a && b && (
              rel ? (
                <div className="relate-result" aria-live="polite">
                  {rel.headline && <p className="relate-headline">{rel.headline}</p>}
                  <ol className="relate-chain">
                    {rel.steps.map((s, i) => {
                      const c = g.byId.get(s.id)!
                      const prev = i > 0 ? g.byId.get(rel.steps[i - 1].id)! : null
                      return (
                        <li key={s.id} style={{ ['--c' as string]: DYNASTIES[c.dynasty].color }}>
                          <i className="relate-dot" aria-hidden />
                          <button className="relate-name" onClick={() => onProfile(s.id)}>{c.name}</button>
                          {prev && s.label && <span className="relate-bond">{prev.name}’s {s.label}</span>}
                        </li>
                      )
                    })}
                  </ol>
                  <div className="relate-actions">
                    <button className="profile-cta" onClick={light}>Light the path on the map</button>
                    <button className="relate-copy" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
                  </div>
                </div>
              ) : (
                <p className="relate-none">No family thread joins {g.byId.get(a)?.name} and {g.byId.get(b)?.name} on the map — they meet only in the stories.</p>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Picker({ engine, value, onChange, placeholder, autoFocus }: {
  engine: Engine
  value: string | null
  onChange: (id: string | null) => void
  placeholder: string
  autoFocus?: boolean
}) {
  const chosen = value ? engine.graph.byId.get(value) : null
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [focus, setFocus] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { setQ(chosen?.name ?? '') }, [chosen])
  useEffect(() => { if (autoFocus) setTimeout(() => ref.current?.focus(), 40) }, [autoFocus])
  const results: Character[] = useMemo(() => (focus && q.trim() && q !== chosen?.name ? findPeople(engine.graph, q, 6) : []), [q, focus, chosen, engine])
  useEffect(() => setActive(0), [q])
  const pick = (c: Character) => { onChange(c.id); setQ(c.name); ref.current?.blur() }
  return (
    <div className="relate-picker">
      <input
        ref={ref}
        value={q}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={results.length > 0}
        onFocus={(e) => { setFocus(true); e.target.select() }}
        onBlur={() => setTimeout(() => setFocus(false), 120)}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((x) => Math.min(results.length - 1, x + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((x) => Math.max(0, x - 1)) }
          else if (e.key === 'Enter' && results[active]) pick(results[active])
        }}
      />
      {results.length > 0 && (
        <ul className="relate-options" role="listbox">
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                role="option"
                aria-selected={i === active}
                className={i === active ? 'on' : ''}
                onMouseDown={(e) => { e.preventDefault(); pick(c) }}
                style={{ ['--c' as string]: DYNASTIES[c.dynasty].color }}
              >
                <i className="swatch" />
                <span>{c.name}</span>
                <em>{c.epithet ?? c.house}</em>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
