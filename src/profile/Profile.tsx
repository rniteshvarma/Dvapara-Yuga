import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DYNASTIES, PARVA_NAMES, STORY_KIND, TRADITION } from '../data/dynasties'
import { evidenceFor, loadEvidence, type EvidenceMap } from '../data/evidence'
import { descriptor, namesakesOf, qualifier } from '../graph/namesakes'
import type { Engine } from '../render/engine'
import { Medallion } from './Medallion'
import { Report } from './Report'
import { PORTRAITS } from './portraits'
import { buildProfile, cite, parvaOfRef, type Fact, type FactIcon, type Profile as P, type SpineNode } from './profileData'
import './profile.css'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * A character's profile: the card grown into a page. The map stays alive behind
 * it, softly blurred, and Esc returns you to exactly where you were.
 */
export default function Profile({ engine, id, onClose, onOpen, onStory, onRelate }: {
  engine: Engine
  id: string
  onClose: () => void
  onOpen: (id: string) => void
  onStory: (momentId: string) => void
  onRelate: (id: string) => void
}) {
  const g = engine.graph
  const p = useMemo(() => buildProfile(g, id, engine.momentsOf(id)), [g, id, engine])
  const [light, setLight] = useState<'day' | 'dusk'>(() => {
    try { return (localStorage.getItem('dy-light') as 'day' | 'dusk') ?? 'day' } catch { return 'day' }
  })
  const [script, setScript] = useState<'en' | 'dv'>('en')
  const prev = useRef<string>(id)
  const [dir, setDir] = useState(1)
  const scroller = useRef<HTMLDivElement>(null)

  // which way the portrait slides when you walk to a relative
  useEffect(() => {
    if (prev.current !== id) {
      const a = g.byId.get(prev.current), b = g.byId.get(id)
      setDir(a && b && b.gen < a.gen ? -1 : 1)
      prev.current = id
      scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [id, g])

  useEffect(() => {
    try { localStorage.setItem('dy-light', light) } catch { /* private mode */ }
  }, [light])

  // the page owns the keyboard while it is open; ⌘K still opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.target as HTMLElement)?.closest?.('input')) return
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
      const tabs = p.kinTabs
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && tabs.length) {
        const i = tabs.findIndex((t) => t.id === id)
        const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i <= 0 ? tabs.length - 1 : i - 1)
        onOpen(tabs[next].id)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, onOpen, p, id])

  const c = p.c
  const color = DYNASTIES[c.dynasty].color

  return (
    <motion.div
      className="profile"
      data-light={light}
      style={{ ['--hc' as string]: color }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      transition={{ duration: 0.5, ease }}
      role="dialog"
      aria-modal="true"
      aria-label={`${c.name} — profile`}
    >
      <div className="pf-scroll" ref={scroller}>
        <motion.div
          className="pf-hero"
          initial={{ y: 24, scale: 0.985 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          <aside className="pf-spine">
            <button className="pf-back" onClick={onClose}>
              <Icon name="back" /> Back to the map
            </button>
            <div className="pf-eyebrow">Lineage</div>
            <Spine engine={engine} p={p} onOpen={onOpen} />
            <HouseCard p={p} engine={engine} onClose={onClose} />
          </aside>

          <section className="pf-main">
            <button className="pf-back pf-mobile-back" onClick={onClose}>
              <Icon name="back" /> Map
            </button>
            <KinTabs engine={engine} p={p} onOpen={onOpen} />
            <Stage p={p} dir={dir} script={script} />
            <div className="pf-rail" role="toolbar" aria-label="Portrait">
              <RailButton label="Show on the map" icon="map" onClick={() => { onClose(); engine.focusOn(id) }} />
              <RailButton label={`How is ${c.name} related to…`} icon="relate" onClick={() => onRelate(id)} />
              <RailButton label={light === 'day' ? 'Lamp: dusk' : 'Lamp: day'} icon="lamp" on={light === 'dusk'} onClick={() => setLight((l) => (l === 'day' ? 'dusk' : 'day'))} />
              <RailButton label={script === 'en' ? 'Show the name in Devanagari' : 'Show the name in English'} icon="script" on={script === 'dv'} onClick={() => setScript((s) => (s === 'en' ? 'dv' : 'en'))} />
            </div>
            <Timeline p={p} onStory={onStory} />
          </section>

          <section className="pf-info">
            <Details engine={engine} p={p} onOpen={onOpen} scroller={scroller} />
          </section>
        </motion.div>

        <More engine={engine} p={p} onOpen={onOpen} onStory={onStory} />
      </div>
    </motion.div>
  )
}

// ───────────────────────────── stage ─────────────────────────────

function Stage({ p, dir, script }: { p: P; dir: number; script: 'en' | 'dv' }) {
  const stage = useRef<HTMLDivElement>(null)
  const c = p.c
  const painted = PORTRAITS[c.id]

  // the portrait leans toward the cursor, just slightly
  const onMove = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    stage.current!.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`)
    stage.current!.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`)
    stage.current!.style.setProperty('--lx', `${(x * 100 + 50).toFixed(1)}%`)
  }
  const onLeave = () => {
    stage.current!.style.setProperty('--rx', '0deg')
    stage.current!.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="pf-stage" ref={stage} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="pf-watermark" aria-hidden>{c.devanagari}</div>
      <div className="pf-shadow" aria-hidden />
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={c.id}
          className="pf-portrait"
          custom={dir}
          initial={{ opacity: 0, x: 90 * dir, scale: 0.6, rotate: 8 * dir }}
          animate={{ opacity: 1, x: 0, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 170, damping: 17, mass: 0.9 } }}
          exit={{ opacity: 0, x: -70 * dir, scale: 0.4, rotate: -10 * dir, transition: { duration: 0.42, ease: [0.55, 0, 0.75, 0.2] } }}
        >
          <div className="pf-breathe">
            {painted ? (
              <img src={painted} alt={`${c.name}, portrait`} className="pf-painting" draggable={false} />
            ) : (
              <Medallion c={c} roles={p.roles} size={420} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.p
          key={c.id + script}
          className="pf-epigraph"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5, ease }}
        >
          {script === 'dv' ? <span className="dv-big">{c.devanagari}</span> : p.epigraph}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function KinTabs({ engine, p, onOpen }: { engine: Engine; p: P; onOpen: (id: string) => void }) {
  if (!p.kinTabs.length) return <div className="pf-tabs empty" />
  return (
    <div className="pf-tabs" role="tablist" aria-label="Kin">
      {p.kinTabs.map((t, i) => {
        const k = engine.graph.byId.get(t.id)!
        return (
          <motion.button
            key={t.id}
            role="tab"
            aria-selected={false}
            aria-label={`${k.name}, ${t.bond}`}
            title={qualifier(engine.graph, k.id, p.c.id) ? `${k.name} — ${qualifier(engine.graph, k.id, p.c.id)}` : undefined}
            className="pf-tab"
            onClick={() => onOpen(t.id)}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.1 + i * 0.04 }}
          >
            <span className="pf-tab-art">
              {PORTRAITS[k.id] ? <img src={PORTRAITS[k.id]} alt="" /> : <Medallion c={k} size={46} still />}
            </span>
            <span className="pf-tab-name">{k.name}</span>
            <span className="pf-tab-bond">{t.bond}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

function RailButton({ label, icon, on, onClick }: { label: string; icon: IconName; on?: boolean; onClick: () => void }) {
  return (
    <button className={`pf-rail-btn ${on ? 'on' : ''}`} aria-label={label} title={label} aria-pressed={on} onClick={onClick}>
      <Icon name={icon} />
    </button>
  )
}

function Timeline({ p, onStory }: { p: P; onStory: (id: string) => void }) {
  const [tip, setTip] = useState<{ x: number; text: string } | null>(null)
  const appears = new Set(p.timeline.filter((m) => m.kind === 'appears').map((m) => m.parva))
  const moments = p.timeline.filter((m) => m.kind === 'moment')
  const pos = (parva: number, i = 0, n = 1) => ((parva - 1 + (i + 1) / (n + 1)) / 18) * 100
  const byParva = new Map<number, typeof moments>()
  for (const m of moments) byParva.set(m.parva, [...(byParva.get(m.parva) ?? []), m])
  // the turning points of a life sit on the line beneath the story marks
  const lifeBy = new Map<number, typeof moments>()
  for (const m of p.timeline.filter((x) => x.kind === 'life')) lifeBy.set(m.parva, [...(lifeBy.get(m.parva) ?? []), m])
  return (
    <div className="pf-timeline" aria-label="Their life across the eighteen books">
      <div className="pf-tl-track">
        {PARVA_NAMES.map((n, i) => (
          <span key={n} className={`pf-tl-seg ${appears.has(i + 1) ? 'on' : ''}`} title={`${n} Parva`} />
        ))}
        {[...lifeBy].flatMap(([parva, ls]) =>
          ls.map((m, i) => (
            <span
              key={`life-${parva}-${i}`}
              className="pf-tl-life"
              tabIndex={0}
              style={{ left: `${pos(parva, i, ls.length)}%` }}
              onMouseEnter={() => setTip({ x: pos(parva, i, ls.length), text: `${m.title} · ${PARVA_NAMES[parva - 1]}` })}
              onMouseLeave={() => setTip(null)}
              onFocus={() => setTip({ x: pos(parva, i, ls.length), text: `${m.title} · ${PARVA_NAMES[parva - 1]}` })}
              onBlur={() => setTip(null)}
              aria-label={`${m.title}, ${PARVA_NAMES[parva - 1]} Parva`}
            />
          )),
        )}
        {[...byParva].flatMap(([parva, ms]) =>
          ms.map((m, i) => (
            <button
              key={m.momentId}
              className={`pf-tl-mark w${m.weight}`}
              style={{ left: `${pos(parva, i, ms.length)}%` }}
              onMouseEnter={() => setTip({ x: pos(parva, i, ms.length), text: `${m.title} · ${PARVA_NAMES[parva - 1]}` })}
              onMouseLeave={() => setTip(null)}
              onFocus={() => setTip({ x: pos(parva, i, ms.length), text: `${m.title} · ${PARVA_NAMES[parva - 1]}` })}
              onBlur={() => setTip(null)}
              onClick={() => onStory(m.momentId!)}
              aria-label={m.title}
            />
          )),
        )}
        <AnimatePresence>
          {tip && (
            <motion.span
              className="pf-tl-tip"
              style={{ left: `${tip.x}%` }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
            >
              {tip.text}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="pf-tl-labels">
        <span>Adi</span>
        <span>Kurukshetra</span>
        <span>Svargarohana</span>
      </div>
    </div>
  )
}

// ───────────────────────────── left column ─────────────────────────────

function Spine({ engine, p, onOpen }: { engine: Engine; p: P; onOpen: (id: string) => void }) {
  const s = p.spine
  const Row = ({ nodes, self, label }: { nodes: SpineNode[]; self?: boolean; label: string }) =>
    nodes.length ? (
      <div className={`pf-sp-row ${self ? 'self' : ''}`}>
        <span className="pf-sp-label">{label}</span>
        <div className="pf-sp-nodes">
          {nodes.map((n) => {
            const k = engine.graph.byId.get(n.id)!
            return (
              <button key={n.id} className="pf-sp-node" onClick={() => !self && onOpen(n.id)} disabled={self} style={{ ['--c' as string]: DYNASTIES[k.dynasty].color }}>
                <i />
                <span>{k.name}{n.note && <em>{n.note}</em>}</span>
              </button>
            )
          })}
        </div>
      </div>
    ) : null
  return (
    <div className="pf-spine-tree">
      <Row nodes={s.grand} label="Grandparents" />
      <Row nodes={s.parents} label="Parents" />
      <Row nodes={[s.self]} self label="" />
      <Row nodes={s.spouses} label={s.spouses.length > 1 ? 'Spouses' : 'Spouse'} />
      <Row nodes={s.children} label="Children" />
      {s.moreChildren > 0 && <span className="pf-sp-more">and {s.moreChildren} more</span>}
    </div>
  )
}

function HouseCard({ p, engine, onClose }: { p: P; engine: Engine; onClose: () => void }) {
  return (
    <div className="pf-house">
      <div className="pf-eyebrow">House</div>
      {p.house.sanskrit && <div className="pf-house-dv">{p.house.sanskrit}</div>}
      <div className="pf-house-name">{p.house.label}</div>
      <p>{p.house.members === 1 ? 'The only one of this house on the map.' : `${p.house.members} of this house on the map.`}</p>
      <button
        className="pf-link"
        onClick={() => {
          onClose()
          if (p.c.dynasty === 'realms' && p.house.label === p.c.house) {
            engine.highlightSet(new Set(engine.graph.chars.filter((x) => x.house === p.c.house).map((x) => x.id)))
            setTimeout(() => engine.highlightSet(null), 4200)
          } else {
            engine.highlightDynasty(p.c.dynasty)
            setTimeout(() => engine.highlightDynasty(null), 4200)
          }
        }}
      >
        Light them on the map <Icon name="arrow" />
      </button>
    </div>
  )
}

// ───────────────────────────── right column ─────────────────────────────

function Details({ engine, p, onOpen, scroller }: { engine: Engine; p: P; onOpen: (id: string) => void; scroller: React.RefObject<HTMLDivElement | null> }) {
  const c = p.c
  return (
    <div className="pf-card">
      <AnimatePresence mode="wait">
        <motion.article
          key={c.id}
          aria-live="polite"
          initial="out"
          animate="in"
          exit="gone"
          variants={{ in: { transition: { staggerChildren: 0.045 } } }}
        >
          <Item className="pf-eyebrow">{c.house}{c.source === 'index' ? ' · from the index' : ''}</Item>
          <Item as="h1" className="pf-name">{c.name}</Item>
          <Item className="pf-dv">{c.devanagari}{c.epithet && <span className="pf-epithet"> · {c.epithet}</span>}</Item>
          {(p.roles.length > 0 || p.versions.length > 0) && (
            <Item className="pf-roles">
              {p.roles.map((r) => <span key={r}>{r}</span>)}
              {p.versions.length > 0 && (
                <button className="pf-versions-chip" onClick={() => scroller.current?.querySelector('#pf-versions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <i aria-hidden>⇄</i> Versions differ
                </button>
              )}
            </Item>
          )}
          <Namesakes engine={engine} id={c.id} onOpen={onOpen} />
          <Item as="p" className="pf-summary">{c.summary}</Item>
          <Item as="h2">Key facts</Item>
          <Item className="pf-facts">
            {p.facts.map((f) => <FactRow key={f.label} f={f} engine={engine} onOpen={onOpen} p={p} />)}
          </Item>
          {p.moments.length > 0 && (
            <Item as="button" className="pf-closeup" onClick={() => scroller.current?.querySelector('#pf-story')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="pf-closeup-lens"><Medallion c={c} size={76} still /></span>
              <span>
                <b>Their story</b>
                <em>{p.moments.length} {p.moments.length === 1 ? 'thread' : 'threads'} — {topKinds(p)}</em>
              </span>
              <Icon name="chevron" />
            </Item>
          )}
        </motion.article>
      </AnimatePresence>
    </div>
  )
}

/** "Not to be confused with Gandhari, wife of Dhritarashtra" — or, on the famous one's page, who else bears the name. */
function Namesakes({ engine, id, onOpen }: { engine: Engine; id: string; onOpen: (id: string) => void }) {
  const g = engine.graph
  const others = namesakesOf(g, id)
  if (!others.length) return null
  const famous = others[0]
  const mine = g.byId.get(id)!
  const outranked = famous.tier < mine.tier || (famous.tier === mine.tier && famous.parvas.length > mine.parvas.length)
  if (outranked && famous.tier <= 2) {
    return (
      <Item className="pf-namesake">
        Not to be confused with{' '}
        <button onClick={() => onOpen(famous.id)}>{famous.name}</button>, {descriptor(famous)}.
      </Item>
    )
  }
  if (outranked) return null
  const shown = others.filter((o) => o.tier <= 3).slice(0, 3)
  const list = shown.length ? shown : others.slice(0, 2)
  const rest = others.length - list.length
  return (
    <Item className="pf-namesake">
      {others.length === 1 ? 'Another bears' : `${others.length} others bear`} the name:{' '}
      {list.map((o, i) => (
        <span key={o.id}>
          <button onClick={() => onOpen(o.id)}>{descriptor(o)}</button>{i < list.length - 1 ? '; ' : ''}
        </span>
      ))}
      {rest > 0 && <> and {rest} more</>}.
    </Item>
  )
}

const topKinds = (p: P) => [...new Set(p.moments.map((m) => STORY_KIND[m.kind].label.split(' ')[0].toLowerCase()))].slice(0, 3).join(', ')

function Item({ as = 'div', className, children, onClick }: { as?: 'div' | 'h1' | 'h2' | 'p' | 'button'; className?: string; children: React.ReactNode; onClick?: () => void }) {
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag
      className={className}
      onClick={onClick}
      variants={{
        out: { opacity: 0, y: 12 },
        in: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
        gone: { opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' } },
      }}
    >
      {children}
    </Tag>
  )
}

function FactRow({ f, engine, onOpen, p }: { f: Fact; engine: Engine; onOpen: (id: string) => void; p: P }) {
  return (
    <div className="pf-fact">
      <FactGlyph name={f.icon} />
      <span className="pf-fact-label">{f.label}</span>
      <span className="pf-fact-value">
        {f.text}
        {f.people?.slice(0, 10).map((x) => {
          const k = engine.graph.byId.get(x.id)!
          // two different people of one name on the same page are always told apart
          const twice = (p.nameCount.get(k.name) ?? 0) > 1
          const note = x.note ?? qualifier(engine.graph, x.id, p.c.id) ?? (twice ? descriptor(k, p.c) : null)
          return (
            <button key={x.id + (x.note ?? '')} className="pf-person" onClick={() => onOpen(x.id)} style={{ ['--c' as string]: DYNASTIES[k.dynasty].color }}>
              {k.name}{note && <em> · {note}</em>}
            </button>
          )
        })}
        {(f.people?.length ?? 0) > 10 && <span className="pf-more-n">+{f.people!.length - 10} more</span>}
        {f.cite && <cite className="pf-fact-cite">{f.cite}</cite>}
      </span>
    </div>
  )
}

// ───────────────────────────── below the fold ─────────────────────────────

/** "The Adi Parva", "Adi, Sabha and Vana Parvas", "All eighteen books but Mausala and Stri" */
function appearsIn(parvas: number[]) {
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0])
  if (!parvas.length) return <span className="pf-faint">Not yet traced to a book.</span>
  if (parvas.length === 18) return <>Every one of the eighteen books.</>
  if (parvas.length >= 12) {
    const missing = PARVA_NAMES.filter((_, i) => !parvas.includes(i + 1))
    return <>Every book but the {list(missing)}<span className="pf-faint"> · {parvas.length} of 18</span></>
  }
  const books = parvas.map((n) => PARVA_NAMES[n - 1])
  return <>{books.length === 1 ? `The ${books[0]} Parva` : `${list(books)} Parvas`}<span className="pf-faint"> · {books.length} of 18</span></>
}

function More({ engine, p, onOpen, onStory }: { engine: Engine; p: P; onOpen: (id: string) => void; onStory: (id: string) => void }) {
  const c = p.c
  const g = engine.graph
  const [allNames, setAllNames] = useState(false)
  const names = allNames ? c.aliases : c.aliases.slice(0, 10)
  return (
    <div className="pf-more">
      <div className="pf-more-main" id="pf-story">
        {p.quotes.length > 0 && (
          <section className="pf-quotes">
            <h2>In their own words</h2>
            {p.quotes.map((q) => (
              <figure key={q.q}>
                <blockquote>“{q.q}”</blockquote>
                <figcaption>{q.w}<cite>{cite(q.b, q.s)} · Ganguli’s translation</cite></figcaption>
              </figure>
            ))}
          </section>
        )}
        {p.life.length > 0 && (
          <section className="pf-life">
            <h2>A life in the eighteen books</h2>
            <ol>
              {p.life.map((l, i) => (
                <li key={i}><span>{PARVA_NAMES[l.parva - 1]}</span>{l.text}</li>
              ))}
            </ol>
          </section>
        )}
        <h2>Their story</h2>
        {p.moments.length > 0 ? (
          <ol className="pf-chapters">
            {p.moments.map((m, i) => {
              const other = g.byId.get(m.from === c.id ? m.to : m.from)!
              const parva = parvaOfRef(m.ref)
              const trad = TRADITION[m.trad]
              return (
                <li key={m.id} style={{ ['--k' as string]: STORY_KIND[m.kind].color }}>
                  <span className="pf-ch-no">{String(i + 1).padStart(2, '0')}</span>
                  <div className="pf-ch-body">
                    <div className="pf-ch-meta">
                      <span className="pf-ch-kind"><i />{STORY_KIND[m.kind].label}</span>
                      {parva && <span className="pf-ch-parva">{PARVA_NAMES[parva - 1]} Parva</span>}
                      {!trad.canon && <span className={`badge ${m.trad}`}>{trad.short}</span>}
                    </div>
                    <h3>{m.title}</h3>
                    <p>{m.text}</p>
                    <div className="pf-ch-foot">
                      <button className="pf-person" onClick={() => onOpen(other.id)} style={{ ['--c' as string]: DYNASTIES[other.dynasty].color }}>
                        {m.from === c.id ? 'With' : 'From'} {other.name}
                      </button>
                      <button className="pf-link" onClick={() => onStory(m.id)}>Trace it on the map <Icon name="arrow" /></button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="pf-empty">
            {c.source === 'index'
              ? `${c.name} is named in the epic, but no episode of their life has been mapped yet.`
              : `No episodes of ${c.name}’s life have been mapped yet — they will arrive as the stories are woven in.`}
          </p>
        )}
        <Bonds engine={engine} p={p} onOpen={onOpen} />
        {p.versions.length > 0 && <Versions p={p} />}
      </div>

      <aside className="pf-more-side">
        <section>
          <h3 className="pf-side-h">Appears in</h3>
          <div className="pf-strip" aria-hidden>
            {PARVA_NAMES.map((n, i) => <span key={n} className={c.parvas.includes(i + 1) ? 'on' : ''} title={`${n} Parva`} />)}
          </div>
          <p className="pf-side-text">
            {appearsIn(c.parvas)}
          </p>
        </section>

        {c.aliases.length > 0 && (
          <section>
            <h3 className="pf-side-h">Also known as</h3>
            <p className="pf-names">
              {names.map((a, i) => (
                <span key={a}>{a}{i < names.length - 1 && <i> · </i>}</span>
              ))}
              {c.aliases.length > 10 && (
                <button className="pf-more-names" onClick={() => setAllNames((v) => !v)}>
                  {allNames ? 'fewer' : `and ${c.aliases.length - 10} more`}
                </button>
              )}
            </p>
          </section>
        )}

        <section>
          <h3 className="pf-side-h">Sources</h3>
          {c.variant && <p className="pf-variant"><b>Variant tradition</b>{c.variant}</p>}
          <p className="pf-side-text pf-faint">
            {c.source === 'index'
              ? <>From S. Sørensen, <i>An Index to the Names in the Mahābhārata</i> (1904){c.indexEntry ? `, entry ${c.indexEntry}` : ''}, which follows the Calcutta edition.</>
              : <>Curated from the critical edition of the Mahabharata{c.indexEntry ? <>; cross-referenced with Sørensen’s Index, entry {c.indexEntry}</> : ''}.</>}
          </p>
        </section>
        <Report c={c} />
      </aside>
    </div>
  )
}

/** Where the tellings disagree: the epic beside the Puranas and the retellings readers know. */
function Versions({ p }: { p: P }) {
  return (
    <section className="pf-versions" id="pf-versions">
      <h2>Where the tellings differ</h2>
      <p className="pf-bonds-lede">The Mahabharata beside the books that continue it and the retellings many readers know best.</p>
      {p.versions.map((v) => (
        <div key={v.topic} className="pf-vtopic">
          <h3>{v.topic}</h3>
          <div className="pf-vgrid">
            {v.readings.map((r, i) => (
              <div key={i} className={`pf-vcell ${r.trad}`}>
                <span className="pf-vtrad">{TRADITION[r.trad].short === 'Vyasa’s text' ? 'The epic · critical edition' : TRADITION[r.trad].label}</span>
                <p>{r.text}</p>
                {r.src && <cite>{r.src}</cite>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/** Each family bond beside the words of the epic that tell it. */
function Bonds({ engine, p, onOpen }: { engine: Engine; p: P; onOpen: (id: string) => void }) {
  const [ev, setEv] = useState<EvidenceMap | null>(null)
  const [all, setAll] = useState(false)
  useEffect(() => { let live = true; loadEvidence().then((m) => live && setEv(m)); return () => { live = false } }, [])
  useEffect(() => setAll(false), [p.c.id])
  if (!p.bonds.length) return null
  const g = engine.graph
  const shown = all ? p.bonds : p.bonds.slice(0, 8)
  const told = ev ? p.bonds.filter((b) => evidenceFor(ev, b.from, b.to, b.type)?.q).length : 0
  return (
    <section className="pf-bonds" id="pf-bonds">
      <h2>Family, as the epic tells it</h2>
      <p className="pf-bonds-lede">
        {ev ? <>{told} of {p.bonds.length} {p.bonds.length === 1 ? 'bond is' : 'bonds are'} found in the text itself; each is shown with the passage that tells it.</> : 'Finding each bond in the text…'}
      </p>
      <ul>
        {shown.map((b) => {
          const k = g.byId.get(b.id)!
          const e = ev ? evidenceFor(ev, b.from, b.to, b.type) : undefined
          const q = qualifier(g, b.id, p.c.id)
          return (
            <li key={b.label + b.id}>
              <div className="pf-bond-who">
                <span className="pf-bond-label">{b.label}</span>
                <button className="pf-person" onClick={() => onOpen(b.id)} style={{ ['--c' as string]: DYNASTIES[k.dynasty].color }}>
                  {k.name}{q && <em> · {q}</em>}
                </button>
              </div>
              {ev && (e?.q ? (
                <blockquote>
                  <p>“{e.q}”</p>
                  <cite>{PARVA_NAMES[(e.b ?? 1) - 1]} Parva{e.s ? ` · section ${e.s}` : ''}</cite>
                </blockquote>
              ) : e?.l ? (
                <p className="pf-bond-src later"><b>Later tradition</b>{e.l}</p>
              ) : (
                <p className="pf-bond-src"><b>Sørensen’s index</b>Recorded in the index to the Calcutta edition; the passage is a list of names the text-matcher cannot read.</p>
              ))}
            </li>
          )
        })}
      </ul>
      {p.bonds.length > 8 && (
        <button className="pf-more-names" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `Show all ${p.bonds.length} bonds`}</button>
      )}
      <p className="pf-bonds-foot">Passages are quoted from Kisari Mohan Ganguli’s English translation of the Mahabharata (1883–1896).</p>
    </section>
  )
}

// ───────────────────────────── icons ─────────────────────────────

type IconName = 'back' | 'map' | 'lamp' | 'script' | 'arrow' | 'chevron' | 'relate'
function Icon({ name }: { name: IconName }) {
  const d: Record<IconName, string> = {
    back: 'M15 18l-6-6 6-6',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
    lamp: 'M12 3v2m0 14v2M5 12H3m18 0h-2M6.3 6.3 4.9 4.9m14.2 14.2-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    script: 'M4 7h16M8 7v10a3 3 0 0 0 6 0M14 7v5',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    chevron: 'm9 6 6 6-6 6',
    relate: 'M6 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM7.5 7.5c3 1.5 3 5 4.5 6.5s3.5 1.5 4.5 2.5',
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d[name]} />
    </svg>
  )
}

function FactGlyph({ name }: { name: FactIcon }) {
  const d: Record<FactIcon, string> = {
    side: 'M5 21V4m0 0h11l-2 4 2 4H5',
    banner: 'M6 21V3m0 1c3-1 5 1 8 0s4-1 4-1v9s-1 1-4 1-5-1-8 0',
    conch: 'M12 4c4 0 7 3 7 7 0 3-2 5-5 5-2 0-3-1-3-3s1-2 2-2M12 4C8 4 5 7 5 12c0 4 3 8 7 8',
    bow: 'M6 3c7 3 7 15 0 18M6 3v18M3 12h15l-3-3m3 3-3 3',
    chariot: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 0v16M4 12h16M6.3 6.3l11.4 11.4m0-11.4L6.3 17.7',
    birth: 'M12 21c-4 0-7-3-7-7 0-5 7-11 7-11s7 6 7 11c0 4-3 7-7 7Z',
    spouse: 'M8.5 14a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm7 5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z',
    child: 'M12 3v6m0 0-4 4m4-4 4 4M8 13v8m8-8v8',
    sibling: 'M7 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm10 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 21v-6a4 4 0 0 1 8 0v6m2 0v-6a4 4 0 0 1 8 0v6',
    house: 'M4 20V10l8-6 8 6v10M9 20v-6h6v6',
    teacher: 'M7 4c-1 3-4 7-1 11 2 3 6 3 8 1M12 21h6M15 11l5-5',
    student: 'M4 7l8-4 8 4-8 4-8-4Zm3 2v5c0 2 2.5 3 5 3s5-1 5-3V9',
    ally: 'M7 11l3-3 4 1 3-3m-10 5 3 3 4-1 3 3M3 12l4-4m14 4-4-4',
    rival: 'M5 19 19 5m0 14L5 5',
    slew: 'M14.5 4.5l5 5L10 19l-5 1 1-5 8.5-10.5Z',
    slain: 'M12 3v10m0 4v.01M5 21h14',
    fate: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2',
    first: 'M5 4h11l3 3v13H5V4Zm4 6h6m-6 4h6',
    kind: 'M12 3l2.5 6 6.5.5-5 4 1.5 6.5L12 16l-5.5 4 1.5-6.5-5-4 6.5-.5L12 3Z',
  }
  return (
    <svg className="pf-fact-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d[name]} />
    </svg>
  )
}
