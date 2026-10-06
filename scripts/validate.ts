/* Checks the lineage dataset for structural mistakes. Run with `npm run validate`. */
import { CHARACTERS, RELATIONS } from '../src/data/characters'
import { DYNASTIES, STORY_KIND, TRADITION } from '../src/data/dynasties'
import { STORIES } from '../src/data/stories'
import { PARENTAL } from '../src/data/types'

const errors: string[] = []
const warnings: string[] = []
const ids = new Map<string, (typeof CHARACTERS)[number]>()

for (const c of CHARACTERS) {
  if (ids.has(c.id)) errors.push(`duplicate id: ${c.id}`)
  ids.set(c.id, c)
  if (!DYNASTIES[c.d]) errors.push(`${c.id}: unknown dynasty ${c.d}`)
  if (!c.dv) warnings.push(`${c.id}: missing Devanagari`)
}

const all: [string, string, string][] = []
for (const c of CHARACTERS) for (const p of c.p ?? []) all.push([p, c.id, 'parent'])
for (const r of RELATIONS) all.push(r)

const linked = new Set<string>()
const pairSeen = new Set<string>()
for (const [a, b, t] of all) {
  const A = ids.get(a), B = ids.get(b)
  if (!A) errors.push(`relation ${a} → ${b} (${t}): unknown "${a}"`)
  if (!B) errors.push(`relation ${a} → ${b} (${t}): unknown "${b}"`)
  if (!A || !B) continue
  linked.add(a); linked.add(b)
  const k = [a, b, t].join('|')
  if (pairSeen.has(k)) errors.push(`duplicate relation ${k}`)
  pairSeen.add(k)
  if (PARENTAL.has(t as never) && A.g >= B.g) errors.push(`${a} (${A.g}) is not above child ${b} (${B.g}) [${t}]`)
  if (t === 'spouse' && Math.abs(A.g - B.g) > 1.01) warnings.push(`spouses ${a} & ${b} sit ${Math.abs(A.g - B.g)} bands apart`)
}

for (const c of CHARACTERS) if (!linked.has(c.id)) warnings.push(`${c.id} has no relations (floats free)`)

const nameCount = new Map<string, string[]>()
for (const c of CHARACTERS) for (const n of [c.n, ...(c.al ?? [])]) {
  const k = n.toLowerCase()
  nameCount.set(k, [...(nameCount.get(k) ?? []), c.id])
}
for (const [n, who] of nameCount) if (who.length > 1) warnings.push(`name "${n}" shared by ${who.join(', ')}`)

const momentIds = new Set<string>()
for (const m of STORIES) {
  if (momentIds.has(m.id)) errors.push(`duplicate story id ${m.id}`)
  momentIds.add(m.id)
  for (const end of [m.from, m.to]) if (!ids.has(end)) errors.push(`story ${m.id}: unknown character "${end}"`)
  if (!STORY_KIND[m.kind]) errors.push(`story ${m.id}: unknown kind ${m.kind}`)
  if (!TRADITION[m.trad]) errors.push(`story ${m.id}: unknown tradition ${m.trad}`)
  if (m.trad === 'critical' && !m.ref) warnings.push(`story ${m.id}: critical-edition episode without a reference`)
}
for (const m of STORIES) for (const n of m.next ?? []) if (!momentIds.has(n)) errors.push(`story ${m.id}: next "${n}" does not exist`)

console.log(`${CHARACTERS.length} characters, ${all.length} relations, ${STORIES.length} story moments`)
for (const w of warnings) console.log('  ⚠ ' + w)
for (const e of errors) console.log('  ✖ ' + e)
if (errors.length) process.exit(1)
console.log('✓ dataset is structurally sound')
