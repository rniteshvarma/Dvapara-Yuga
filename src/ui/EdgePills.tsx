import { useEffect, useMemo, useRef } from 'react'
import type { Engine } from '../render/engine'

/**
 * When someone a story reaches is off-screen, a small pill waits at the edge of
 * the view, pointing toward them. Clicking it travels there.
 */
export function EdgePills({ engine, focus, version }: { engine: Engine; focus: string; version: string }) {
  const partners = useMemo(() => engine.arcPartners(), [engine, focus, version])
  const refs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    const place = () => {
      const W = window.innerWidth, H = window.innerHeight
      const mobile = W < 720
      const L = 16, T = mobile ? 116 : 84, R = mobile ? W - 16 : W - 412, B = mobile ? H * 0.42 : H - 80
      const cx = (L + R) / 2, cy = (T + B) / 2
      const placed: { el: HTMLButtonElement; x: number; y: number; w: number; h: number; edge: number }[] = []
      for (const p of partners) {
        const el = refs.current.get(p.id)
        const s = engine.screenOf(p.id)
        if (!el || !s) continue
        const inside = s.x > L && s.x < R && s.y > T && s.y < B
        if (inside) {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
          continue
        }
        // where the ray from the centre toward them leaves the view
        const dx = s.x - cx, dy = s.y - cy
        const k = Math.min(dx ? ((dx > 0 ? R : L) - cx) / dx : Infinity, dy ? ((dy > 0 ? B : T) - cy) / dy : Infinity)
        const x = cx + dx * k, y = cy + dy * k
        const w = el.offsetWidth, h = el.offsetHeight
        const px = Math.max(L, Math.min(R - w, x - w / 2)), py = Math.max(T, Math.min(B - h, y - h / 2))
        // 0 top · 1 right · 2 bottom · 3 left
        const edge = py <= T + 1 ? 0 : px + w >= R - 1 ? 1 : py + h >= B - 1 ? 2 : 3
        placed.push({ el, x: px, y: py, w, h, edge })
        el.style.opacity = '1'
        el.style.pointerEvents = 'auto'
        el.style.setProperty('--a', `${Math.atan2(dy, dx)}rad`)
      }
      // pills sharing an edge queue up side by side instead of piling on one another
      for (let e = 0; e < 4; e++) {
        const row = placed.filter((q) => q.edge === e)
        const horizontal = e === 0 || e === 2
        row.sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y))
        for (let i = 1; i < row.length; i++) {
          const a = row[i - 1], b = row[i]
          if (horizontal && b.x < a.x + a.w + 8) b.x = a.x + a.w + 8
          if (!horizontal && b.y < a.y + a.h + 6) b.y = a.y + a.h + 6
        }
        const last = row[row.length - 1]
        if (last) {
          const over = horizontal ? last.x + last.w - R : last.y + last.h - B
          if (over > 0) for (const q of row) horizontal ? (q.x = Math.max(L, q.x - over)) : (q.y = Math.max(T, q.y - over))
        }
      }
      for (const q of placed) q.el.style.transform = `translate3d(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px, 0)`
    }
    place()
    return engine.on('frame', place)
  }, [engine, partners])

  return (
    <div className="edge-pills">
      {partners.map((p) => (
        <button
          key={p.id}
          ref={(el) => { if (el) refs.current.set(p.id, el); else refs.current.delete(p.id) }}
          className="edge-pill glass"
          style={{ ['--k' as string]: p.color }}
          title={p.title}
          onClick={() => engine.flyToCharacter(p.id)}
        >
          <i />
          {engine.graph.byId.get(p.id)?.name}
          <svg viewBox="0 0 12 12" width="10" height="10" className="edge-arrow" aria-hidden><path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      ))}
    </div>
  )
}
