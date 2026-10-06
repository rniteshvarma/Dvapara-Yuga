/**
 * A deep consistency audit of everything the site shows — run it before publishing a data change.
 * Structural checks live in validate.ts; this one looks for things a reader would notice:
 * broken references, impossible family trees, garbled text, contradictions between sources.
 *
 *   npx tsx scripts/audit.ts
 */
import { readFileSync } from 'node:fs'
import { buildGraph } from '../src/graph/model'
import { computeLayout } from '../src/graph/layout'
import { relate } from '../src/graph/relate'
import { VERSIONS } from '../src/data/versions'

const census = JSON.parse(readFileSync('src/data/census.json', 'utf8'))
const details = JSON.parse(readFileSync('src/data/details.json', 'utf8'))
const quotes = JSON.parse(readFileSync('src/data/quotes.json', 'utf8'))
const evidence = JSON.parse(readFileSync('src/data/evidence.json', 'utf8'))
const g = buildGraph(census)
const L = computeLayout(g)

const problems: Record<string, string[]> = {}
// known and intended: the epic's own variants, and sages placed where they act rather than by birth
const KNOWN = ['two birth mothers: Skanda', 'parent placed below child: Sharyati (4) → Sukanya (2)']
const INFO = new Set(['same name in the same house'])          // namesakes: told apart on the site by qualifiers
const flag = (k: string, msg: string) => { if (!KNOWN.includes(`${k}: ${msg.split(':')[0]}`) && !KNOWN.includes(`${k}: ${msg}`)) (problems[k] ??= []).push(msg) }
const nm = (id: string) => g.byId.get(id)?.name ?? `?${id}`

// ── references ──
for (const [id, d] of Object.entries<Record<string, unknown>>(details)) {
  if (!g.byId.has(id)) flag('details: unknown id', id)
  for (const t of (d.teachers as string[]) ?? []) if (!g.byId.has(t)) flag('details: unknown teacher', `${id} → ${t}`)
  if (d.charioteer && !g.byId.has(d.charioteer as string)) flag('details: unknown charioteer', `${id} → ${d.charioteer}`)
}
for (const id of Object.keys(quotes)) if (!g.byId.has(id)) flag('quotes: unknown id', id)
for (const id of Object.keys(VERSIONS)) if (!g.byId.has(id)) flag('versions: unknown id', id)
for (const m of g.stories) {
  if (!g.byId.has(m.from) || !g.byId.has(m.to)) flag('stories: unknown person', `${m.id}: ${m.from} → ${m.to}`)
  if (m.from === m.to) flag('stories: self', m.id)
}
const ids = new Set<string>()
for (const m of g.stories) { if (ids.has(m.id)) flag('stories: duplicate id', m.id); ids.add(m.id) }
for (const k of Object.keys(evidence)) {
  const [a, b] = k.split('|')
  if (!g.byId.has(a) || !g.byId.has(b)) flag('evidence: stale key', k)
}

// ── family sanity ──
for (const c of g.chars) {
  const ps = g.parentsOf.get(c.id) ?? []
  const blood = ps.filter((r) => r.type === 'parent')
  const mothers = blood.filter((r) => g.byId.get(r.from)?.sex === 'f')
  const fathers = blood.filter((r) => g.byId.get(r.from)?.sex === 'm')
  if (mothers.length > 1) flag('two birth mothers', `${c.name}: ${mothers.map((r) => nm(r.from)).join(', ')}`)
  if (fathers.length > 2) flag('three or more birth fathers', `${c.name}: ${fathers.map((r) => nm(r.from)).join(', ')}`)
  for (const r of ps) if (r.from === c.id) flag('own parent', c.name)
  for (const r of blood) {
    const p = g.byId.get(r.from)!
    if (p.gen !== null && c.gen !== null && p.gen !== undefined && c.gen !== undefined && p.gen > c.gen + 0.01 && c.kind !== 'divine' && p.kind !== 'divine')
      flag('parent placed below child', `${p.name} (${p.gen}) → ${c.name} (${c.gen})`)
  }
  for (const s of g.spousesOf.get(c.id) ?? []) {
    if (s === c.id) flag('married to self', c.name)
    if ((g.parentsOf.get(c.id) ?? []).some((r) => r.from === s)) flag('married to a parent', `${c.name} & ${nm(s)}`)
  }
  const sp = g.spousesOf.get(c.id) ?? []
  if (new Set(sp).size !== sp.length) flag('spouse listed twice', c.name)
}
// parent cycles
const state = new Map<string, number>()
const visit = (id: string, path: string[]): void => {
  state.set(id, 1)
  for (const r of g.parentsOf.get(id) ?? []) {
    if (r.type === 'rebirth' || r.type === 'avatar') continue
    const s = state.get(r.from)
    if (s === 1) flag('ancestry loop', [...path, id, r.from].map(nm).join(' → '))
    else if (!s) visit(r.from, [...path, id])
  }
  state.set(id, 2)
}
for (const c of g.chars) if (!state.get(c.id)) visit(c.id, [])

// ── text quality ──
const BAD = /\[\.|\[$|˚|\bPage\d|\{\{|\}\}|<\/?\w+>|\(do\.\)|\s{2,}|\s[,.;]|\.\.(?!\.)|\b(chh|anchient|prinche|justiche)\b/
for (const c of g.chars) {
  for (const [field, text] of [['name', c.name], ['summary', c.summary], ['fate', c.fate ?? ''], ['epithet', c.epithet ?? '']] as const) {
    if (BAD.test(text)) flag(`text: odd characters in ${field}`, `${c.id}: “${text.slice(0, 90)}”`)
  }
  if (!c.summary.trim()) flag('text: empty summary', c.id)
  if (/[a-z]$/.test(c.summary.trim())) flag('text: summary without final stop', `${c.id}: …${c.summary.slice(-40)}`)
  if (!/^[A-Z]/.test(c.name)) flag('text: name not capitalised', `${c.id}: ${c.name}`)
  for (const a of c.aliases) if (/[^A-Za-z' -]/.test(a)) flag('text: odd alias', `${c.id}: ${a}`)
  if (c.aliases.includes(c.name)) flag('text: alias equals name', c.id)
}
// display names that collide inside one house
const byHouseName = new Map<string, string[]>()
for (const c of g.chars) {
  const k = `${c.house}|${c.name}`
  byHouseName.set(k, [...(byHouseName.get(k) ?? []), c.id])
}
for (const [k, v] of byHouseName) if (v.length > 1 && !k.startsWith('|')) flag('same name in the same house', `${k.replace('|', ' · ')}: ${v.join(', ')}`)

// ── layout ──
for (const c of g.chars) if (!L.pos.has(c.id)) flag('layout: unplaced', c.id)
const seen = new Map<string, string>()
for (const [id, p] of L.pos) {
  const k = `${Math.round(p.x)},${Math.round(p.y)}`
  if (seen.has(k)) flag('layout: two people on one spot', `${nm(id)} & ${nm(seen.get(k)!)}`)
  seen.set(k, id)
}

// ── the relationship finder on famous pairs ──
for (const [a, b] of [['arjuna', 'karna'], ['krishna', 'arjuna'], ['bhishma', 'duryodhana'], ['draupadi', 'krishna'], ['abhimanyu', 'parikshit'], ['shiva', 'ganesha'], ['brahma', 'janamejaya'], ['vyasa', 'shuka']]) {
  const r = relate(g, a, b)
  if (!r) flag('relate: no path', `${a} ~ ${b}`)
  else if (!r.headline && r.steps.length <= 4) flag('relate: unnamed short path', `${a} ~ ${b}: ${r.steps.map((s) => nm(s.id)).join(' → ')}`)
}

let total = 0
for (const [k, v] of Object.entries(problems).sort()) {
  if (INFO.has(k)) { console.log(`\n(i) ${k}: ${v.length} — namesakes, told apart on the site`); continue }
  total += v.length
  console.log(`\n## ${k} · ${v.length}`)
  for (const x of v.slice(0, 12)) console.log('  ' + x)
  if (v.length > 12) console.log(`  … and ${v.length - 12} more`)
}
console.log(`\n${total} findings across ${Object.keys(problems).length} checks`)
