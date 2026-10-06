import { DYNASTIES, HOUSE_ANCHOR } from '../data/dynasties'
import type { Character, RelType } from '../data/types'
import type { Graph } from './model'

export type Vec = { x: number; y: number }

/** Time flows downward. The mythic ages are compressed, the Kuru centuries opened up. */
export const ANCIENT_BAND = 88
export const KURU_BAND = 250
export const KURU_FROM = 29
export function yOfGen(g: number) {
  return g <= KURU_FROM ? g * ANCIENT_BAND : KURU_FROM * ANCIENT_BAND + (g - KURU_FROM) * KURU_BAND
}

export const NODE_RADIUS: Record<Character['tier'], number> = { 1: 10, 2: 7.5, 3: 6, 4: 3.6 }

const HALF_WIDTH: Record<Character['tier'], number> = { 1: 50, 2: 44, 3: 38, 4: 0 }

const PULL: Partial<Record<RelType, number>> = {
  parent: 1, legal: 0.8, divine: 0.04, niyoga: 0.12, adoptive: 0.45, boon: 0.8, rebirth: 0.02, avatar: 0.02,
}

export interface Cluster {
  id: 'kauravas'
  center: Vec
  radius: number
  members: string[]
}

export interface Layout {
  pos: Map<string, Vec>
  cluster: Cluster
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}

const SUPER = '__kauravas'

/** A few roots are fixed so the river has a clear source. */
const PINNED: Record<string, number> = { brahma: 0, vishnu: -170 }

export function computeLayout(g: Graph): Layout {
  const members = g.chars.filter((c) => c.cluster === 'kauravas').map((c) => c.id)
  const discRadius = 15.5 * Math.sqrt(members.length)

  // ── layout nodes (cluster collapsed into one super-node) ──
  type LNode = { id: string; gen: number; anchor: number; hw: number; x: number; nb: [string, number][] }
  const nodes = new Map<string, LNode>()

  // Households: a wife with a single marriage in the same band travels with her
  // husband during ordering, and is unfolded beside him at the end.
  const attached = new Map<string, string>()
  const wivesOf = new Map<string, string[]>()
  for (const c of g.chars) {
    const sp = g.spousesOf.get(c.id)
    if (c.sex !== 'f' || c.cluster || !sp?.length) continue
    // a wife of several brothers (Draupadi) sits in the middle of their household
    const h = g.byId.get(sp[sp.length > 1 ? Math.floor((sp.length - 1) / 2) : 0])!
    if (h.cluster || h.sex === 'f' || h.gen !== c.gen) continue
    attached.set(c.id, h.id)
    wivesOf.set(h.id, [...(wivesOf.get(h.id) ?? []), c.id])
  }
  const hwOf = (c: Character) => (c.kind === 'gap' ? 46 : HALF_WIDTH[c.tier])
  const rep = (id: string) => (g.byId.get(id)?.cluster ? SUPER : attached.get(id) ?? id)

  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

  for (const c of g.chars) {
    if (c.cluster || attached.has(c.id)) continue
    const anchor = HOUSE_ANCHOR[c.house] ?? DYNASTIES[c.dynasty].anchor
    let hw = hwOf(c)
    for (const w of wivesOf.get(c.id) ?? []) hw += hwOf(g.byId.get(w)!)
    nodes.set(c.id, {
      id: c.id, gen: c.gen, anchor, hw,
      x: anchor + (rand() - 0.5) * 60, nb: [],
    })
  }
  nodes.set(SUPER, { id: SUPER, gen: 33.4, anchor: DYNASTIES.kaurava.anchor, hw: discRadius + 36, x: DYNASTIES.kaurava.anchor, nb: [] })

  // directed pulls: A is drawn toward B with weight w
  const pull = (a: string, b: string, w: number) => {
    const A = nodes.get(rep(a)), B = nodes.get(rep(b))
    if (!A || !B || A === B) return
    A.nb.push([B.id, w])
  }
  const spouseCount = (id: string) => g.spousesOf.get(id)?.length ?? 0
  const seenSuper = new Set<string>()
  for (const r of g.relations) {
    const a = g.byId.get(r.from)!, b = g.byId.get(r.to)!
    if (r.type === 'spouse') {
      // a spouse shares their pull among all their marriages
      pull(r.from, r.to, 3 / spouseCount(r.from))
      pull(r.to, r.from, 3 / spouseCount(r.to))
      continue
    }
    if (r.type === 'sibling') { pull(r.from, r.to, 1.2); pull(r.to, r.from, 1.2); continue }
    let w = PULL[r.type] ?? 0.5
    const span = Math.abs(a.gen - b.gen)
    if (span > 2.5) w *= 0.15
    // a daughter who married out lives beside her husband; her thread home may run long
    const marriedOut = b.sex === 'f' && spouseCount(b.id) > 0
    // the cluster pulls on its parents as a single child, not a hundred
    if (b.cluster) {
      if (seenSuper.has(r.from)) continue
      seenSuper.add(r.from)
      w *= 2
    }
    pull(r.to, r.from, marriedOut ? w * 0.3 : w)          // child drawn under parent
    pull(r.from, r.to, (marriedOut ? w * 0.3 : w) * 0.55) // parent drawn over child
  }

  // ── bands ──
  const bands = new Map<number, LNode[]>()
  for (const n of nodes.values()) {
    const b = bands.get(n.gen)
    if (b) b.push(n)
    else bands.set(n.gen, [n])
  }

  const resolveBand = (band: LNode[]) => {
    band.sort((a, b) => a.x - b.x)
    // Pool-adjacent-violators: closest positions to the current ones that respect the gaps.
    const off: number[] = [0]
    for (let i = 1; i < band.length; i++) off[i] = off[i - 1] + band[i - 1].hw + band[i].hw
    const blocks: { sum: number; n: number; start: number }[] = []
    for (let i = 0; i < band.length; i++) {
      blocks.push({ sum: band[i].x - off[i], n: 1, start: i })
      while (blocks.length > 1) {
        const b = blocks[blocks.length - 1], a = blocks[blocks.length - 2]
        if (a.sum / a.n <= b.sum / b.n) break
        a.sum += b.sum
        a.n += b.n
        blocks.pop()
      }
    }
    for (const b of blocks) {
      const v = b.sum / b.n
      for (let i = b.start; i < b.start + b.n; i++) band[i].x = v + off[i]
    }
  }

  const list = [...nodes.values()]
  const ITER = 220
  for (let it = 0; it < ITER; it++) {
    const step = it < ITER * 0.7 ? 0.55 : 0.3
    for (const n of list) {
      let tw = 0
      for (const [, w] of n.nb) tw += w
      let sw = tw ? 0.12 * tw + 0.08 : 1
      let sx = n.anchor * sw
      for (const [o, w] of n.nb) {
        sx += nodes.get(o)!.x * w
        sw += w
      }
      n.x += (sx / sw - n.x) * step
      if (n.id in PINNED) n.x = PINNED[n.id]
    }
    for (const band of bands.values()) resolveBand(band)
  }

  // ── world positions ──
  const pos = new Map<string, Vec>()
  for (const n of list) {
    if (n.id === SUPER) continue
    const wives = wivesOf.get(n.id)
    if (!wives) {
      pos.set(n.id, { x: n.x, y: yOfGen(n.gen) })
      continue
    }
    // unfold the household: each wife sits on the side her own family lies
    const pref = (w: string) => {
      let sx = 0, sw = 0
      for (const r of g.parentsOf.get(w) ?? []) {
        const o = nodes.get(rep(r.from))
        if (o && o.id !== n.id) { sx += o.x; sw++ }
      }
      for (const sib of g.siblingsOf.get(w) ?? []) {
        const o = nodes.get(rep(sib))
        if (o) { sx += o.x; sw++ }
      }
      return sw ? sx / sw - n.x : 0
    }
    const ranked = wives.map((w, i) => ({ w, p: pref(w) || (i % 2 ? 1 : -1) * 0.001 * (i + 1) })).sort((a, b) => a.p - b.p)
    let nLeft = ranked.filter((r) => r.p < 0).length
    if (ranked.length > 1) nLeft = Math.min(Math.max(nLeft, Math.floor(ranked.length / 2)), Math.ceil(ranked.length / 2))
    const row = [...ranked.slice(0, nLeft).map((r) => r.w), n.id, ...ranked.slice(nLeft).map((r) => r.w)]
    let x = n.x - n.hw
    for (const id of row) {
      const hw = hwOf(g.byId.get(id)!)
      pos.set(id, { x: x + hw, y: yOfGen(n.gen) })
      x += hw * 2
    }
  }

  const sup = nodes.get(SUPER)!
  const center = { x: sup.x, y: yOfGen(33.4) + 34 }
  members.forEach((id, i) => {
    const r = 15.5 * Math.sqrt(i + 0.7)
    const a = i * 2.399963 + 0.4
    pos.set(id, { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r * 0.92 })
  })

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of pos.values()) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  return { pos, cluster: { id: 'kauravas', center, radius: discRadius, members }, bounds: { minX, maxX, minY, maxY } }
}

// ─────────────────────────── drawable threads ───────────────────────────

/** Visual style of a thread (matches the shader's style switch). */
export const STYLE = {
  parent: 0, spouse: 1, divine: 2, niyoga: 3, adoptive: 4, boon: 5, rebirth: 6, legal: 7, sibling: 8,
} as const

export interface DrawEdge {
  style: number
  /** cubic bezier control points */
  p0: Vec; p1: Vec; p2: Vec; p3: Vec
  /** characters at the upper / elder end (one or two) and the lower end */
  up: string[]
  down: string
  color: string
  faint: boolean
}

const bez = (a: Vec, b: Vec, c: Vec, d: Vec, t: number): Vec => {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}

function hangingArc(a: Vec, b: Vec, sagSign = 1) {
  const [l, r] = a.x <= b.x ? [a, b] : [b, a]
  const dx = r.x - l.x
  const sag = sagSign * (Math.min(dx * 0.16, 46) + 10)
  const p1 = { x: l.x + dx / 3, y: l.y + sag }
  const p2 = { x: r.x - dx / 3, y: r.y + sag }
  return { p0: l, p1, p2, p3: r, mid: bez(l, p1, p2, r, 0.5) }
}

function descent(from: Vec, to: Vec, via?: Vec) {
  const dy = Math.max(to.y - from.y, 40)
  if (via) return { p0: from, p1: { x: from.x, y: from.y + dy * 0.45 }, p2: via, p3: to }
  return { p0: from, p1: { x: from.x, y: from.y + dy * 0.5 }, p2: { x: to.x, y: to.y - dy * 0.5 }, p3: to }
}

export function buildDrawEdges(g: Graph, L: Layout): DrawEdge[] {
  const out: DrawEdge[] = []
  const P = (id: string) => L.pos.get(id)!
  const col = (id: string) => DYNASTIES[g.byId.get(id)!.dynasty].color
  const isDeva = (id: string) => g.byId.get(id)!.kind === 'divine' || g.byId.get(id)!.kind === 'apsara'

  // marriages first: their midpoints become the knots that children hang from
  const unionMid = new Map<string, Vec>()
  const key = (a: string, b: string) => (a < b ? a + '|' + b : b + '|' + a)
  for (const r of g.relations) {
    if (r.type !== 'spouse' && r.type !== 'sibling') continue
    const arc = hangingArc(P(r.from), P(r.to), r.type === 'spouse' ? 1 : -1)
    if (r.type === 'spouse') unionMid.set(key(r.from, r.to), arc.mid)
    out.push({
      style: r.type === 'spouse' ? STYLE.spouse : STYLE.sibling,
      p0: arc.p0, p1: arc.p1, p2: arc.p2, p3: arc.p3,
      up: [r.from, r.to], down: r.to, color: r.type === 'spouse' ? '#b0806e' : '#7d7a86', faint: false,
    })
  }

  const hub = { x: L.cluster.center.x, y: L.cluster.center.y - L.cluster.radius * 0.2 }

  for (const c of g.chars) {
    const rels = g.parentsOf.get(c.id) ?? []
    if (!rels.length) continue
    const fam = rels.filter((r) => r.type === 'parent' || r.type === 'legal')
    const handled = new Set<typeof rels[number]>()
    const via = c.cluster ? hub : undefined
    const longSpan = (from: string) => Math.abs(g.byId.get(from)!.gen - c.gen) > 5

    if (fam.length === 2) {
      const mid = unionMid.get(key(fam[0].from, fam[1].from))
      if (mid) {
        const d = descent(mid, P(c.id), via)
        const both = [fam[0].from, fam[1].from]
        out.push({
          style: both.every(isDeva) ? STYLE.divine : STYLE.parent, ...d,
          up: both, down: c.id, color: col(c.id), faint: !!c.cluster || longSpan(both[0]),
        })
        handled.add(fam[0]); handled.add(fam[1])
      }
    }
    for (const r of rels) {
      if (handled.has(r)) continue
      let style: number = STYLE[r.type as keyof typeof STYLE] ?? STYLE.parent
      if (r.type === 'avatar') style = STYLE.divine
      if (r.type === 'parent' && isDeva(r.from)) style = STYLE.divine
      const d = descent(P(r.from), P(c.id), via)
      out.push({
        style, ...d, up: [r.from], down: c.id,
        color: style === STYLE.divine ? '#c29a3a' : col(c.id), faint: !!c.cluster || longSpan(r.from),
      })
    }
  }
  return out
}

export { bez }
