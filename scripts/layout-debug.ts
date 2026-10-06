/* Prints the left-to-right order of each Kuru-era band. `npx tsx scripts/layout-debug.ts` */
import { computeLayout } from '../src/graph/layout'
import { buildGraph } from '../src/graph/model'

const g = buildGraph()
const L = computeLayout(g)
const rows = new Map<number, [number, string][]>()
for (const c of g.chars) {
  if (c.cluster || c.gen < +(process.argv[2] ?? 29)) continue
  const p = L.pos.get(c.id)!
  rows.set(c.gen, [...(rows.get(c.gen) ?? []), [p.x, c.id]])
}
for (const [gen, r] of [...rows].sort((a, b) => a[0] - b[0])) {
  console.log(`\n${gen}: ` + r.sort((a, b) => a[0] - b[0]).map(([x, id]) => `${id}(${Math.round(x)})`).join(' '))
}
console.log('\nbounds', L.bounds, 'cluster', Math.round(L.cluster.center.x))
