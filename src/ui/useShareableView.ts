import { useEffect, useRef } from 'react'
import type { Engine, Lens } from '../render/engine'

/**
 * The map's state lives in its address, so any view can be shared:
 *
 *   ?at=x,y,zoom     where the camera is
 *   &c=karna         who is selected
 *   &lens=stories    the Stories lens
 *   &story=kirata    a story moment, open in the panel
 *
 * Profiles keep their own path (/c/karna) and the finder its ?relate=a~b; this leaves both alone.
 */
export function readShared() {
  const p = new URLSearchParams(location.search)
  const at = p.get('at')?.split(',').map(Number)
  return {
    at: at && at.length === 3 && at.every(Number.isFinite) ? { x: at[0], y: at[1], z: at[2] } : null,
    c: p.get('c'),
    lens: (p.get('lens') === 'stories' ? 'stories' : null) as Lens | null,
    story: p.get('story'),
  }
}

export const hasSharedView = () => {
  const s = readShared()
  return !!(s.at || s.c || s.lens || s.story)
}

/** Restore a shared view once the map is ready, then keep the address up to date as the reader moves. */
export function useShareableView(engine: Engine | null, state: { selected: string | null; lens: Lens; momentId: string | null; paused: boolean; onMoment: (id: string) => void }) {
  const restored = useRef(false)
  const latest = useRef(state)
  latest.current = state

  // restore — after the opening has hurried out of the way
  useEffect(() => {
    if (!engine || restored.current) return
    restored.current = true
    const s = readShared()
    if (!(s.at || s.c || s.lens || s.story)) return
    engine.skipIntro()
    const t = setTimeout(() => {
      if (s.lens) engine.setLens(s.lens)
      if (s.c && engine.graph.byId.has(s.c)) engine.select(s.c, !s.at)
      if (s.story && engine.moment(s.story)) {
        const m = engine.moment(s.story)!
        if (!s.c) engine.select(m.from, false)
        latest.current.onMoment(s.story)
        if (!s.at) engine.frameMoment(s.story)
      }
      if (s.at) engine.cam.flyTo(s.at.x, s.at.y, s.at.z, 1)
    }, 1150)
    return () => clearTimeout(t)
  }, [engine])

  // write — whenever the camera comes to rest
  useEffect(() => {
    if (!engine) return
    let last = ''
    let wait = 0
    const off = engine.on('frame', () => {
      if (++wait < 30) return                      // twice a second is plenty
      wait = 0
      const { selected, lens, momentId, paused } = latest.current
      if (paused || engine.introActive || engine.cam.busy || location.pathname !== '/') return
      const p = new URLSearchParams(location.search)
      for (const k of ['at', 'c', 'lens', 'story']) p.delete(k)
      const { x, y, zoom } = engine.cam
      p.set('at', `${Math.round(x)},${Math.round(y)},${zoom.toFixed(3)}`)
      if (selected) p.set('c', selected)
      if (lens === 'stories') p.set('lens', 'stories')
      if (momentId) p.set('story', momentId)
      const q = p.toString().replace(/%2C/g, ',').replace(/%7E/gi, '~')
      if (q === last) return
      last = q
      history.replaceState(history.state, '', `/?${q}`)
    })
    return off
  }, [engine])
}
