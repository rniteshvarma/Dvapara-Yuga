import { useEffect, useRef, useState } from 'react'
import { Engine } from './render/engine'
import { Card } from './ui/Card'
import { Chrome } from './ui/Chrome'
import { Intro } from './ui/Intro'
import { Legend } from './ui/Legend'
import { Search } from './ui/Search'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const [engine, setEngine] = useState<Engine | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [intro, setIntro] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

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
      e.on('select', setSelected),
      e.on('intro', setIntro),
    ]
    return () => {
      offs.forEach((f) => f())
      e.destroy()
    }
  }, [])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.key === 'k' && (ev.metaKey || ev.ctrlKey)) || (ev.key === '/' && !(ev.target as HTMLElement).closest('input'))) {
        ev.preventDefault()
        engine?.skipIntro()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine])

  const cardId = selected ?? hovered

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
          <Chrome engine={engine} hidden={intro} onSearch={() => setSearchOpen(true)} />
          <Legend engine={engine} hidden={intro} />
          <Card engine={engine} id={cardId} pinned={!!selected} />
          <Search engine={engine} open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
      )}
      <Intro active={intro} onSkip={() => engine?.skipIntro()} />
    </div>
  )
}
