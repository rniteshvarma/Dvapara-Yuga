import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { DYNASTIES, STORY_KIND, TRADITION } from '../data/dynasties'
import type { StoryKind, StoryMoment } from '../data/types'
import type { Engine } from '../render/engine'

const ease = [0.22, 1, 0.36, 1] as const
const KIND_ORDER = Object.keys(STORY_KIND) as StoryKind[]

/**
 * The story panel: everyone a character dealt with, grouped by the nature of
 * the bond — and, one level deeper, the moment itself.
 */
export function StoryPanel({ engine, id, momentId, onMoment, arcHover, onProfile }: {
  engine: Engine
  id: string
  momentId: string | null
  onMoment: (id: string | null) => void
  arcHover: string | null
  onProfile: (id: string) => void
}) {
  const g = engine.graph
  const c = g.byId.get(id)!
  const moments = engine.momentsOf(id)
  const moment = momentId ? engine.moment(momentId) : null

  // keep the open moment's arc lit while it is being read
  useEffect(() => {
    engine.pinMoment(momentId)
    engine.hoverMoment(null)
    return () => engine.pinMoment(null)
  }, [engine, momentId])

  const groups = useMemo(() => {
    const by = new Map<StoryKind, StoryMoment[]>()
    for (const m of moments) by.set(m.kind, [...(by.get(m.kind) ?? []), m])
    return KIND_ORDER.filter((k) => by.has(k)).map((k) => [k, by.get(k)!] as const)
  }, [moments])

  const outside = moments.filter((m) => !TRADITION[m.trad].canon && m.trad !== 'index').length
  const indexed = moments.filter((m) => m.trad === 'index').length

  const open = (m: StoryMoment) => {
    if (m.from !== id && m.to !== id) engine.select(m.from, false)
    onMoment(m.id)
    engine.frameMoment(m.id)
  }

  return (
    <motion.aside
      className="card glass pinned story-panel"
      style={{ ['--c' as string]: DYNASTIES[c.dynasty].color }}
      initial={{ opacity: 0, x: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 24, filter: 'blur(6px)', transition: { duration: 0.22 } }}
      transition={{ duration: 0.45, ease }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {moment ? (
          <MomentView key={moment.id} engine={engine} m={moment} focus={id} onBack={() => onMoment(null)} onOpen={open} />
        ) : (
          <motion.div
            key={'list-' + id}
            className="card-inner"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="card-top">
              <span className="house"><i />{c.house}</span>
              <button className="close" onClick={() => engine.select(null, false)} aria-label="Close">
                <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <h2 className="name">{c.name}</h2>
            <div className="dv">{c.devanagari}</div>
            {c.epithet && <div className="epithet">{c.epithet}</div>}
            <button className="profile-cta" onClick={() => onProfile(id)}>
              <span>Open profile</span>
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            {moments.length > 0 ? (
              <>
                <p className="thread-count">
                  {moments.length} {moments.length === 1 ? 'thread' : 'threads'} through the story
                  {outside > 0 && <span> · {outside} from later traditions</span>}
                  {indexed > 0 && <span className="ix"> · {indexed} from Sørensen’s index</span>}
                </p>
                {groups.map(([kind, ms]) => (
                  <section className="thread-group" key={kind} style={{ ['--k' as string]: STORY_KIND[kind].color }}>
                    <h3><i />{STORY_KIND[kind].label}</h3>
                    <ul>
                      {ms.map((m) => {
                        const other = g.byId.get(m.from === id ? m.to : m.from)!
                        return (
                          <li key={m.id}>
                            <button
                              className={`thread ${arcHover === m.id ? 'on' : ''}`}
                              onMouseEnter={() => engine.hoverMoment(m.id)}
                              onMouseLeave={() => engine.hoverMoment(null)}
                              onFocus={() => engine.hoverMoment(m.id)}
                              onBlur={() => engine.hoverMoment(null)}
                              onClick={() => open(m)}
                            >
                              <span className="thread-who">
                                {m.from === id ? <em>to</em> : <em>from</em>} {other.name}
                              </span>
                              <span className="thread-title">{m.title}</span>
                              {!TRADITION[m.trad].canon && <span className={`badge ${m.trad}`}>{TRADITION[m.trad].short}</span>}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </>
            ) : (
              <div className="no-threads">
                <p>{c.summary}</p>
                <p className="muted">
                  {engine.canonOnly
                    ? 'No episodes from Vyasa’s text are mapped for this character yet.'
                    : 'Their story threads have not been woven in yet — they will arrive as the census of characters grows.'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

function MomentView({ engine, m, focus, onBack, onOpen }: {
  engine: Engine; m: StoryMoment; focus: string; onBack: () => void; onOpen: (m: StoryMoment) => void
}) {
  const g = engine.graph
  const from = g.byId.get(m.from)!, to = g.byId.get(m.to)!
  const kind = STORY_KIND[m.kind]
  const trad = TRADITION[m.trad]
  const next = (m.next ?? []).map((n) => engine.moment(n)).filter((x): x is StoryMoment => !!x)
  const led = engine.momentsOf(m.from).concat(engine.momentsOf(m.to)).filter((x) => x.next?.includes(m.id))
  const prev = [...new Map(led.map((x) => [x.id, x])).values()]
  const Person = ({ id }: { id: string }) => {
    const p = g.byId.get(id)!
    return (
      <button className="chip" style={{ ['--c' as string]: DYNASTIES[p.dynasty].color }} onClick={() => { engine.select(id) }}>
        <i />{p.name}
      </button>
    )
  }

  return (
    <motion.div
      className="card-inner moment"
      style={{ ['--k' as string]: kind.color }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.38, ease }}
    >
      <div className="card-top">
        <button className="back" onClick={onBack}>
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {g.byId.get(focus)!.name}’s threads
        </button>
      </div>
      <div className="moment-kind"><i />{kind.label}</div>
      <h2 className="moment-title">{m.title}</h2>
      <div className="moment-who">
        <Person id={m.from} />
        <svg viewBox="0 0 40 10" width="40" height="10" className="moment-arrow" aria-hidden>
          <path d="M1 5h34" stroke="var(--k)" strokeWidth="1.6" strokeDasharray="4 3" strokeLinecap="round" />
          <path d="M33 1.5 38 5l-5 3.5" stroke="var(--k)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Person id={m.to} />
      </div>
      <p className="moment-text">{m.text}</p>
      <div className={`source ${m.trad}`}>
        <span className="source-badge">{trad.short}</span>
        <span>{m.ref ? `${m.ref}${trad.canon ? '' : ` · ${trad.label}`}` : trad.label}</span>
      </div>

      {prev.length > 0 && (
        <div className="kin">
          <span className="label">Grew out of</span>
          <div className="chain">
            {prev.map((x) => <ChainLink key={x.id} engine={engine} m={x} onOpen={onOpen} />)}
          </div>
        </div>
      )}
      {next.length > 0 && (
        <div className="kin">
          <span className="label">Led to</span>
          <div className="chain">
            {next.map((x) => <ChainLink key={x.id} engine={engine} m={x} onOpen={onOpen} />)}
          </div>
        </div>
      )}
      <p className="moment-foot">{from.name} · {to.name}</p>
    </motion.div>
  )
}

function ChainLink({ engine, m, onOpen }: { engine: Engine; m: StoryMoment; onOpen: (m: StoryMoment) => void }) {
  const g = engine.graph
  const hidden = engine.canonOnly && !TRADITION[m.trad].canon
  if (hidden) return null
  return (
    <button className="chain-link" style={{ ['--k' as string]: STORY_KIND[m.kind].color }} onClick={() => onOpen(m)}>
      <i />
      <span>
        <b>{m.title}</b>
        <em>{g.byId.get(m.from)!.name} → {g.byId.get(m.to)!.name}</em>
      </span>
      <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden><path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
    </button>
  )
}
