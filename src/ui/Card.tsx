import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { DYNASTIES, PARVA_NAMES } from '../data/dynasties'
import type { Character, RelType } from '../data/types'
import { kinOf } from '../graph/model'
import { qualifier } from '../graph/namesakes'
import type { Engine, Lens } from '../render/engine'

const ease = [0.22, 1, 0.36, 1] as const

const KIND_LABEL: Partial<Record<Character['kind'], string>> = {
  divine: 'Celestial', sage: 'Sage', naga: 'Naga', asura: 'Asura', apsara: 'Apsara', gap: 'Lineage',
}

const PARENT_NOTE: Partial<Record<RelType, string>> = {
  legal: 'legal father', divine: 'divine father', niyoga: 'by niyoga', adoptive: 'foster',
  boon: 'born of a rite', rebirth: 'former life', avatar: 'incarnation of',
}
const CHILD_NOTE: Partial<Record<RelType, string>> = {
  legal: 'legal heir', divine: 'divine son', niyoga: 'by niyoga', adoptive: 'fostered',
  boon: 'born of a rite', rebirth: 'reborn as', avatar: 'incarnated as',
}

/**
 * The story card. On hover it is a light, passive preview that follows the
 * medallion; once a character is chosen it becomes an anchored, explorable page.
 */
export function Card({ engine, id, pinned, lens, onProfile }: { engine: Engine; id: string | null; pinned: boolean; lens: Lens; onProfile: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const g = engine.graph
  const c = id ? g.byId.get(id) ?? null : null

  // follow the medallion every frame without re-rendering React
  useEffect(() => {
    if (!id) return
    const place = () => {
      const el = ref.current
      const s = engine.screenOf(id)
      if (!el || !s) return
      const W = window.innerWidth, H = window.innerHeight
      if (W < 720) {
        el.style.transform = ''
        return
      }
      const cw = el.offsetWidth, ch = el.offsetHeight
      if (pinned) {
        // a chosen story docks to the right; the camera keeps the medallion beside it
        el.style.transform = `translate3d(${W - cw - 20}px, 84px, 0)`
        return
      }
      const gap = s.r + 30
      let x = s.x + gap
      if (x + cw > W - 20) x = s.x - gap - cw
      x = Math.max(16, Math.min(W - cw - 16, x))
      const y = Math.max(84, Math.min(H - ch - 20, s.y - Math.min(ch * 0.32, 120)))
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }
    place()
    return engine.on('frame', place)
  }, [engine, id, pinned])

  useLayoutEffect(() => {
    // first placement before paint so the card never flashes at the origin
    if (id && ref.current && window.innerWidth >= 720) {
      const s = engine.screenOf(id)
      if (pinned) ref.current.style.transform = `translate3d(${window.innerWidth - ref.current.offsetWidth - 20}px, 84px, 0)`
      else if (s) ref.current.style.transform = `translate3d(${s.x + s.r + 30}px, ${Math.max(76, s.y - 100)}px, 0)`
    }
  }, [engine, id, pinned])

  const kin = useMemo(() => (c ? kinOf(g, c.id) : null), [g, c])
  const threads = c ? engine.storyCount(c.id) : 0

  return (
    <AnimatePresence>
      {c && kin && (
        <motion.aside
          key="card"
          ref={ref}
          className={`card glass ${pinned ? 'pinned' : 'peek'}`}
          style={{ ['--c' as string]: DYNASTIES[c.dynasty].color }}
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)', transition: { duration: 0.22 } }}
          transition={{ duration: 0.45, ease }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={c.id}
              className="card-inner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              <div className="card-top">
                <span className="house"><i />{c.house}</span>
                {KIND_LABEL[c.kind] && <span className="kind">{KIND_LABEL[c.kind]}</span>}
                {pinned && (
                  <button className="close" onClick={() => engine.select(null, false)} aria-label="Close">
                    <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>

              <h2 className="name">{c.name}</h2>
              <div className="dv">{c.devanagari}</div>
              {c.epithet && <div className="epithet">{c.epithet}</div>}

              <p className="summary">{c.summary}</p>
              {pinned && (
                <button className="profile-cta" onClick={() => onProfile(c.id)}>
                  <span>Open profile</span>
                  <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
              {pinned && (c.group || c.island) && (
                <button className="part-of" onClick={() => { engine.select(null, false); engine.flyToGroup(c.group ?? c.island!) }}>
                  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="0.1 2.6" strokeLinecap="round" /><circle cx="10" cy="10" r="1.8" fill="currentColor" /></svg>
                  <span>Part of <b>{engine.layout.groups.find((x) => x.id === c.group)?.title ?? engine.layout.islands.find((x) => x.id === c.island)?.title}</b></span>
                </button>
              )}

              {pinned && (
                <>
                  {c.aliases.length > 0 && (
                    <div className="aliases">
                      <span className="label">Also known as</span>
                      <div>
                        {c.aliases.slice(0, 8).join(' · ')}
                        {c.aliases.length > 8 && <span className="more-names"> · and {c.aliases.length - 8} more names</span>}
                      </div>
                    </div>
                  )}
                  <KinRow engine={engine} self={c.id} label="Parents" items={kin.parents.map((p) => ({ id: p.id, note: PARENT_NOTE[p.type] }))} />
                  <KinRow engine={engine} self={c.id} label={kin.spouses.length > 1 ? 'Spouses' : 'Spouse'} items={kin.spouses.map((id) => ({ id }))} />
                  <KinRow engine={engine} self={c.id} label="Children" items={kin.children.map((p) => ({ id: p.id, note: CHILD_NOTE[p.type] }))} limit={14} />
                  <KinRow engine={engine} self={c.id} label="Siblings" items={kin.siblings.map((id) => ({ id }))} limit={10} />
                  {c.fate && (
                    <div className="fate">
                      <span className="label">Fate</span>
                      <p>{c.fate}</p>
                    </div>
                  )}
                  {c.variant && <p className="variant"><span>Variant tradition</span>{c.variant}</p>}
                  {c.parvas.length > 0 && (
                    <div className="kin">
                      <span className="label">Appears in</span>
                      <div className="parvas">
                        {PARVA_NAMES.map((n, i) => (
                          <span key={n} className={c.parvas.includes(i + 1) ? 'on' : ''} title={`${n} Parva`}>{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="provenance">
                    {c.source === 'index'
                      ? <>From Sørensen’s <i>Index to the Names in the Mahābhārata</i> (1904){c.indexEntry ? `, entry ${c.indexEntry}` : ''}.{c.group || c.island ? ' Named in the epic without a family on the map.' : ''}</>
                      : <>Curated for this map{c.indexEntry ? <> · Sørensen’s Index, entry {c.indexEntry}</> : ''}.</>}
                  </p>
                  {threads > 0 && (
                    <button className="story-cta" onClick={() => engine.setLens('stories')}>
                      <span>
                        <b>Follow {c.name}’s story</b>
                        <em>{threads} {threads === 1 ? 'thread' : 'threads'} — teachers, rivals, vows, curses</em>
                      </span>
                      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  )}
                </>
              )}
              {!pinned && c.source === 'index' && c.parvas.length > 0 && (
                <div className="peek-parvas">Named in {c.parvas.slice(0, 4).map((p) => PARVA_NAMES[p - 1]).join(', ')}{c.parvas.length > 4 ? ` and ${c.parvas.length - 4} more` : ''}</div>
              )}
              {!pinned && (
                <div className="peek-hint">
                  {lens === 'stories'
                    ? threads > 0 ? `${threads} story ${threads === 1 ? 'thread' : 'threads'} · click to follow` : 'No story threads woven yet'
                    : 'Click for their card · then open the full profile'}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function KinRow({ engine, label, items, limit = 99, self }: { engine: Engine; label: string; items: { id: string; note?: string }[]; limit?: number; self?: string }) {
  if (!items.length) return null
  const g = engine.graph
  const shown = items.slice(0, limit)
  return (
    <div className="kin">
      <span className="label">{label}</span>
      <div className="chips">
        {shown.map(({ id, note }) => {
          const k = g.byId.get(id)!
          const q = note ?? qualifier(g, id, self)
          return (
            <button key={id + (note ?? '')} className="chip" title={q ? `${k.name} — ${q}` : undefined} style={{ ['--c' as string]: DYNASTIES[k.dynasty].color }} onClick={() => engine.select(id)}>
              <i />
              {k.name}
              {q && <em>{q}</em>}
            </button>
          )
        })}
        {items.length > limit && <span className="more">+{items.length - limit} more</span>}
      </div>
    </div>
  )
}
