import { AnimatePresence } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { loadCensus } from './data/census'
import { Engine, type Lens } from './render/engine'
import { Card } from './ui/Card'
import { Chrome } from './ui/Chrome'
import { EdgePills } from './ui/EdgePills'
import { FamilyText } from './ui/FamilyText'
import { Intro } from './ui/Intro'
import { Legend } from './ui/Legend'
import { LensBar } from './ui/LensBar'
import { Relate } from './ui/Relate'
import { Search } from './ui/Search'
import { StoryPanel } from './ui/StoryPanel'
import { Tour, tourSeen } from './ui/Tour'
import { hasSharedView, useShareableView } from './ui/useShareableView'

const Profile = lazy(() => import('./profile/Profile'))

/** /c/:id opens a character's profile */
const profileFromPath = () => decodeURIComponent(location.pathname.match(/^\/c\/([^/]+)/)?.[1] ?? '') || null

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const [engine, setEngine] = useState<Engine | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [intro, setIntro] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [lens, setLens] = useState<Lens>('lineage')
  const [canon, setCanon] = useState(false)
  const [momentId, setMomentId] = useState<string | null>(null)
  const [arcHover, setArcHover] = useState<string | null>(null)
  const [trail, setTrail] = useState<string[]>([])
  const skipEarly = useRef(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  // ?relate=a~b opens the relationship finder on that pair
  const [relate, setRelate] = useState<{ open: boolean; a: string | null; b: string | null }>(() => {
    const m = new URLSearchParams(location.search).get('relate')?.split('~')
    return { open: !!m, a: m?.[0] ?? null, b: m?.[1] ?? null }
  })
  const openRelate = useCallback((a: string | null = null, b: string | null = null) => setRelate({ open: true, a, b }), [])
  const closeRelate = useCallback(() => {
    setRelate((r) => ({ ...r, open: false }))
    const url = new URL(location.href)
    url.searchParams.delete('relate')
    history.replaceState(history.state, '', url)
  }, [])
  const pushed = useRef(0)
  // a first visit gets the three-step tour, unless it arrived on a shared link
  const [tour, setTour] = useState(false)
  const [textView, setTextView] = useState(false)
  const [announce, setAnnounce] = useState('')
  const tourChecked = useRef(false)

  const openProfile = useCallback((id: string) => {
    setProfileId(id)
    history.pushState({ profile: id }, '', `/c/${encodeURIComponent(id)}`)
    pushed.current++
  }, [])
  const closeProfile = useCallback(() => {
    setProfileId(null)
    if (pushed.current > 0) {
      // unwind every profile we stepped through, back to the map
      history.go(-pushed.current)
      pushed.current = 0
    } else history.replaceState(null, '', '/')
  }, [])

  // the browser's own back and forward walk between profiles and the map
  useEffect(() => {
    const onPop = () => {
      const id = profileFromPath()
      setProfileId(id)
      if (!id) pushed.current = 0
      else pushed.current = Math.max(0, pushed.current - 1)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // keep the map's focus on whoever the profile is about
  useEffect(() => {
    if (engine && profileId && engine.graph.byId.has(profileId) && engine.selected !== profileId) engine.select(profileId)
  }, [engine, profileId])

  useEffect(() => {
    let e: Engine | null = null
    let cancelled = false
    const offs: (() => void)[] = []
    // the census (thousands of characters) streams in while the title is still on screen
    loadCensus()
      .catch(() => undefined)
      .then((census) => {
        if (cancelled) return
        try {
          e = new Engine(canvasRef.current!, labelsRef.current!, census)
        } catch (err) {
          setError((err as Error).message)
          return
        }
        start(e)
        // a click or key pressed while the census was loading still skips the opening
        if (skipEarly.current) e.skipIntro()
        // a shared link straight to a profile skips the opening and opens it
        const deep = profileFromPath()
        if (new URLSearchParams(location.search).has('relate')) e.skipIntro()
        if (deep && e.graph.byId.has(deep)) {
          e.skipIntro()
          setProfileId(deep)
        }
      })
    return () => {
      cancelled = true
      offs.forEach((f) => f())
      e?.destroy()
    }

    function start(e: Engine) {
    setEngine(e)
    if (import.meta.env.DEV) (window as unknown as { __engine: Engine }).__engine = e
    offs.push(
      e.on('hover', setHovered),
      e.on('select', (id) => {
        setSelected(id)
        setMomentId((m) => (m && id && e.moment(m) && [e.moment(m)!.from, e.moment(m)!.to].includes(id) ? m : null))
        if (id) setTrail((t) => (t[t.length - 1] === id ? t : [...t.filter((x) => x !== id), id].slice(-5)))
        else setTrail([])
      }),
      e.on('intro', setIntro),
      e.on('lens', (l) => {
        setLens(l)
        setMomentId(null)
      }),
      e.on('canon', setCanon),
      e.on('moment', (id) => {
        setMomentId(id)
        e.frameMoment(id)
      }),
      e.on('arc', setArcHover),
      e.on('open', (id) => openProfile(id)),
      e.on('announce', setAnnounce),
    )
    }
  }, [])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest('input')) return
      if (!engine) skipEarly.current = true
      if ((ev.key === 'k' && (ev.metaKey || ev.ctrlKey)) || ev.key === '/') {
        ev.preventDefault()
        engine?.skipIntro()
        setSearchOpen((o) => !o)
      } else if (ev.key === 't' && !ev.metaKey && !ev.ctrlKey && engine && !profileFromPath()) {
        setTextView(true)
      } else if (ev.key === 's' && !ev.metaKey && !ev.ctrlKey && engine) {
        engine.setLens(engine.lens === 'stories' ? 'lineage' : 'stories')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine])

  useEffect(() => {
    if (intro || tourChecked.current) return
    tourChecked.current = true
    if (!tourSeen() && !hasSharedView() && !profileFromPath() && !relate.open) setTimeout(() => setTour(true), 900)
  }, [intro, relate.open])

  // tell screen readers who has been chosen and how to move on from them
  useEffect(() => {
    if (!engine || !selected) return
    const c = engine.graph.byId.get(selected)
    if (!c) return
    const k = engine.graph.parentsOf.get(selected)?.map((r) => engine.graph.byId.get(r.from)?.name).filter(Boolean) ?? []
    setAnnounce(`${c.name}${c.epithet ? `, ${c.epithet}` : ''}${k.length ? `. Child of ${k.join(' and ')}` : ''}. Arrow keys walk the family; Enter opens the profile; T opens the text view.`)
  }, [engine, selected])

  useShareableView(engine, { selected, lens, momentId, paused: !!profileId || relate.open, onMoment: setMomentId })

  const storyFocus = lens === 'stories' && selected
  // in Stories the chosen character lives in the panel; the card only peeks at others
  const cardId = profileId ? null : storyFocus ? (hovered && hovered !== selected ? hovered : null) : (selected ?? hovered)

  return (
    <div className={`stage ${profileId ? 'profile-open' : ''}`}>
      <button className="skip-link" onClick={() => { engine?.skipIntro(); setTextView(true) }}>Skip to the family tree as text</button>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
      <canvas ref={canvasRef} className="sky" />
      <div ref={labelsRef} className="labels" aria-hidden />
      {error && (
        <div className="fatal">
          <p>This experience needs WebGL 2.</p>
          <small>{error}</small>
        </div>
      )}
      {engine && (
        <>
          <Chrome engine={engine} hidden={intro} lens={lens} onSearch={() => setSearchOpen(true)} onRelate={() => openRelate(selected)} />
          <LensBar engine={engine} lens={lens} canon={canon} hidden={intro} trail={trail} />
          <Legend engine={engine} hidden={intro} lens={lens} onTour={() => setTour(true)} onText={() => setTextView(true)} />
          {storyFocus && !profileId && <EdgePills engine={engine} focus={selected} version={`${canon}|${momentId}`} />}
          <Card engine={engine} id={cardId} pinned={!storyFocus && !!selected} lens={lens} onProfile={openProfile} />
          <AnimatePresence>
            {storyFocus && !profileId && (
              <StoryPanel key="story" engine={engine} id={selected} momentId={momentId} onMoment={setMomentId} arcHover={arcHover} onProfile={openProfile} />
            )}
          </AnimatePresence>
          <FamilyText engine={engine} open={textView} start={selected} onClose={() => setTextView(false)} onProfile={openProfile} />
          <Tour engine={engine} active={tour && !profileId} onDone={() => setTour(false)} />
          <Search engine={engine} open={searchOpen} onClose={() => setSearchOpen(false)} onRelate={() => openRelate(selected)} />
          <Relate
            engine={engine}
            open={relate.open && !intro}
            from={relate.a}
            to={relate.b}
            onClose={closeRelate}
            onProfile={(id) => { closeRelate(); openProfile(id) }}
          />
          <Suspense fallback={null}>
            <AnimatePresence>
              {profileId && engine.graph.byId.has(profileId) && (
                <Profile
                  key="profile"
                  engine={engine}
                  id={profileId}
                  onClose={closeProfile}
                  onOpen={openProfile}
                  onRelate={(id) => openRelate(id)}
                  onStory={(m) => {
                    closeProfile()
                    engine.setLens('stories')
                    const mo = engine.moment(m)
                    if (mo && engine.selected !== mo.from && engine.selected !== mo.to) engine.select(mo.from, false)
                    setMomentId(m)
                    engine.frameMoment(m)
                  }}
                />
              )}
            </AnimatePresence>
          </Suspense>
        </>
      )}
      <Intro active={intro} onSkip={() => { skipEarly.current = true; engine?.skipIntro() }} />
    </div>
  )
}
