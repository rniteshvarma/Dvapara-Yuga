import { AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Engine, type Lens } from './render/engine'
import { Card } from './ui/Card'
import { Chrome } from './ui/Chrome'
import { EdgePills } from './ui/EdgePills'
import { Intro } from './ui/Intro'
import { Legend } from './ui/Legend'
import { LensBar } from './ui/LensBar'
import { Search } from './ui/Search'
import { StoryPanel } from './ui/StoryPanel'

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

  useEffect(() => {
    let e: Engine
    try {
      e = new Engine(canvasRef.current!, labelsRef.current!)
    } catch (err) {
      setError((err as Error).message)
      return
    }
    setEngine(e)
    if (import.meta.env.DEV) (window as unknown as { __engine: Engine }).__engine = e
    const offs = [
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
    ]
    return () => {
      offs.forEach((f) => f())
      e.destroy()
    }
  }, [])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest('input')) return
      if ((ev.key === 'k' && (ev.metaKey || ev.ctrlKey)) || ev.key === '/') {
        ev.preventDefault()
        engine?.skipIntro()
        setSearchOpen((o) => !o)
      } else if (ev.key === 's' && !ev.metaKey && !ev.ctrlKey && engine) {
        engine.setLens(engine.lens === 'stories' ? 'lineage' : 'stories')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine])

  const storyFocus = lens === 'stories' && selected
  // in Stories the chosen character lives in the panel; the card only peeks at others
  const cardId = storyFocus ? (hovered && hovered !== selected ? hovered : null) : (selected ?? hovered)

  return (
    <div className="stage">
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
          <Chrome engine={engine} hidden={intro} lens={lens} onSearch={() => setSearchOpen(true)} />
          <LensBar engine={engine} lens={lens} canon={canon} hidden={intro} trail={trail} />
          <Legend engine={engine} hidden={intro} lens={lens} />
          {storyFocus && <EdgePills engine={engine} focus={selected} version={`${canon}|${momentId}`} />}
          <Card engine={engine} id={cardId} pinned={!storyFocus && !!selected} lens={lens} />
          <AnimatePresence>
            {storyFocus && (
              <StoryPanel key="story" engine={engine} id={selected} momentId={momentId} onMoment={setMomentId} arcHover={arcHover} />
            )}
          </AnimatePresence>
          <Search engine={engine} open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
      )}
      <Intro active={intro} onSkip={() => engine?.skipIntro()} />
    </div>
  )
}
