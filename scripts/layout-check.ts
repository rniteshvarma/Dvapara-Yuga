/* Lays out the full census headlessly and reports timing and geometry. `npx tsx scripts/layout-check.ts` */
import { readFileSync } from 'node:fs'
import type { CensusData } from '../src/data/census'
import { buildDrawEdges, computeLayout } from '../src/graph/layout'
import { buildGraph } from '../src/graph/model'

const census = JSON.parse(readFileSync('src/data/census.json', 'utf8')) as CensusData
let t = performance.now()
const g = buildGraph(census)
const tg = performance.now() - t
t = performance.now()
const L = computeLayout(g)
const tl = performance.now() - t
t = performance.now()
const E = buildDrawEdges(g, L)
const te = performance.now() - t
const missing = g.chars.filter((c) => !L.pos.has(c.id))
console.log(`characters ${g.chars.length} · relations ${g.relations.length} · stories ${g.stories.length} · threads ${E.length}`)
console.log(`graph ${tg.toFixed(0)}ms · layout ${tl.toFixed(0)}ms · threads ${te.toFixed(0)}ms · unplaced ${missing.length}`, missing.slice(0, 5).map((c) => c.id))
const r = (b: typeof L.bounds) => `x ${Math.round(b.minX)}…${Math.round(b.maxX)}  y ${Math.round(b.minY)}…${Math.round(b.maxY)}`
console.log('tree  ', r(L.treeBounds))
console.log('world ', r(L.bounds))
for (const c of L.groups) console.log(`  ✦ ${c.title.padEnd(32)} ${String(c.members.length).padStart(4)}  at ${Math.round(c.center.x)}, ${Math.round(c.center.y)}  r ${Math.round(c.radius)}`)
console.log(`  islands ${L.islands.length}: ${L.islands.slice(0, 6).map((i) => i.title).join(', ')}…`)
const bands = new Map<number, number>()
for (const c of g.chars) if (!c.group && !c.island && !c.cluster) bands.set(c.gen, (bands.get(c.gen) ?? 0) + 1)
console.log('widest bands', [...bands].sort((a, b) => b[1] - a[1]).slice(0, 6))
console.log('broods', L.broods.size, [...L.broods.values()].map((b) => `${b.members.length}`).join(' '))
const rowW = new Map<number, [number, number]>()
for (const c of g.chars) {
  if (c.group || c.island || c.cluster || L.broodOf.has(c.id)) continue
  const p = L.pos.get(c.id)!
  const r = rowW.get(c.gen) ?? [Infinity, -Infinity]
  rowW.set(c.gen, [Math.min(r[0], p.x), Math.max(r[1], p.x)])
}
console.log('widest rows (world units)', [...rowW].map(([g, [a, b]]) => [g, Math.round(b - a)]).sort((a, b) => b[1] - a[1]).slice(0, 8))
