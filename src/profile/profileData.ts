import { DYNASTIES, PARVA_NAMES, TRADITION } from '../data/dynasties'
import type { Character, RelType, StoryMoment } from '../data/types'
import { kinOf, type Graph } from '../graph/model'

/** Everything a profile page shows, derived from what the map already knows. */
export interface Profile {
  c: Character
  roles: string[]
  epigraph: string
  facts: Fact[]
  spine: Spine
  kinTabs: KinTab[]
  timeline: TimelineMark[]
  moments: StoryMoment[]
  house: { label: string; sanskrit: string; color: string; members: number }
  bonds: Bond[]
  /** how many different people of each name the facts mention */
  nameCount: Map<string, number>
}

/** One family bond and the two ends of the relation as stored, so its evidence can be looked up. */
export interface Bond { id: string; label: string; from: string; to: string; type: RelType }

export interface Fact {
  icon: FactIcon
  label: string
  people?: { id: string; note?: string }[]
  text?: string
}
export type FactIcon = 'birth' | 'spouse' | 'child' | 'sibling' | 'house' | 'teacher' | 'student' | 'ally' | 'rival' | 'slew' | 'slain' | 'fate' | 'first' | 'kind'

export interface SpineNode { id: string; note?: string }
export interface Spine {
  grand: SpineNode[]
  parents: SpineNode[]
  self: SpineNode
  spouses: SpineNode[]
  children: SpineNode[]
  moreChildren: number
}

export interface KinTab { id: string; bond: string }

export interface TimelineMark {
  parva: number          // 1–18
  kind: 'appears' | 'moment'
  title?: string
  momentId?: string
  weight?: number
}

const BOND: Partial<Record<RelType, string>> = {
  parent: 'parent', legal: 'legal father', divine: 'divine father', niyoga: 'father by niyoga', adoptive: 'foster parent',
  boon: 'born of their rite', rebirth: 'former life', avatar: 'incarnation of',
}
const CHILD_BOND: Partial<Record<RelType, string>> = {
  parent: 'child', legal: 'legal heir', divine: 'divine child', niyoga: 'child by niyoga', adoptive: 'fostered',
  boon: 'born of their rite', rebirth: 'reborn as', avatar: 'incarnated as',
}

/** Roles are read from how a character is described — "raised by a charioteer" is not a charioteer. */
const ROLE_RULES: [RegExp, string][] = [
  [/\b(greatest |peerless |finest )?archer\b|Gandiva|wielding the .* bow/i, 'Archer'],
  [/master of the mace|taught the mace|with (his|a) mace|mace-bearer/i, 'Mace-bearer'],
  [/^(a |the )?charioteer\b|\bcharioteer (of|to)\b|became .*charioteer/i, 'Charioteer'],
  [/\b(was |became |is )?(the )?(first )?teacher of\b|\btaught (the|both|him|her|them)\b|\bpreceptor\b|\bguru\b/i, 'Teacher'],
  [/\bwarrior|fought|commander|general\b|battle|killed in the war|slain|\bon day \d+/i, 'Warrior'],
  [/\bqueen\b/i, 'Queen'],
  [/\b(was )?(a |the )?king\b|emperor|\bruled\b|\bcrowned\b|made (him )?king|king of/i, 'King'],
  [/\bprince\b/i, 'Prince'],
  [/\bprincess\b/i, 'Princess'],
  [/\bsage|ṛṣi|rishi|muni|ascetic|seer\b/i, 'Sage'],
  [/recited|narrat|storyteller/i, 'Narrator'],
  [/\bavatar\b|\bincarnation of\b/i, 'Avatar'],
  [/\bApsara/i, 'Apsara'],
  [/\bGandharva/i, 'Gandharva'],
  [/^(a |the )?serpent|\bNaga (king|princess|woman)/i, 'Serpent'],
  [/^(a |the )?(Rakshas|Asura|Daitya|Danava)/i, 'Asura'],
  [/^(a |the )?(maid|servant|attendant)\b/i, 'Servant'],
  [/^(a |the |one of [^.]*)?(horse|elephant|bird)\b/i, 'Creature'],
]

const kindRole: Partial<Record<Character['kind'], string>> = {
  divine: 'Celestial', sage: 'Sage', naga: 'Serpent', asura: 'Asura', apsara: 'Apsara',
}

/** Which of the 18 books a story moment's reference points to. */
export function parvaOfRef(ref?: string): number | null {
  if (!ref) return null
  for (let i = 0; i < PARVA_NAMES.length; i++) if (ref.includes(PARVA_NAMES[i])) return i + 1
  return null
}

export function buildProfile(g: Graph, id: string, moments: StoryMoment[]): Profile {
  const c = g.byId.get(id)!
  const kin = kinOf(g, id)
  const dyn = DYNASTIES[c.dynasty]

  // ── roles ──
  const text = `${c.summary} ${c.fate ?? ''} ${c.epithet ?? ''}`
  const roles: string[] = []
  const add = (r: string) => { if (!roles.includes(r)) roles.push(r) }
  if (kindRole[c.kind]) add(kindRole[c.kind]!)
  for (const [re, r] of ROLE_RULES) if (re.test(text)) add(r)
  if (c.royal && !roles.some((r) => /King|Queen|Prince/.test(r))) add(c.sex === 'f' ? 'Queen' : 'King')
  // a woman married into a royal house is its queen; a child of one, its prince or princess
  const royalSpouse = kin.spouses.some((x) => g.byId.get(x)?.royal)
  const royalParent = kin.parents.some((x) => g.byId.get(x.id)?.royal && x.type !== 'divine')
  if (c.sex === 'f' && royalSpouse && !roles.includes('Queen')) add('Queen')
  if (!roles.some((r) => /King|Queen|Prince/.test(r)) && royalParent && c.kind === 'mortal') add(c.sex === 'f' ? 'Princess' : 'Prince')
  if (moments.some((m) => m.kind === 'teacher' && m.from === id)) add('Teacher')
  if (moments.some((m) => m.kind === 'slew' && m.from === id)) add('Warrior')

  // ── epigraph: the epithet if there is one, else the first clause of the summary ──
  const first = c.summary.split(/(?<=[.;])\s|—/)[0].trim().replace(/\.$/, '')
  const epigraph = c.epithet ? `${c.epithet}.` : first.length < 90 ? `${first}.` : `${first.slice(0, 86).replace(/\s\S*$/, '')}…`

  // ── facts ──
  const facts: Fact[] = []
  if (kin.parents.length) facts.push({ icon: 'birth', label: 'Born of', people: kin.parents.map((p) => ({ id: p.id, note: p.type !== 'parent' ? BOND[p.type] : undefined })) })
  if (kin.spouses.length) facts.push({ icon: 'spouse', label: kin.spouses.length > 1 ? 'Spouses' : 'Spouse', people: kin.spouses.map((s) => ({ id: s })) })
  if (kin.children.length) facts.push({ icon: 'child', label: 'Children', people: kin.children.map((p) => ({ id: p.id, note: p.type !== 'parent' ? CHILD_BOND[p.type] : undefined })) })
  if (kin.siblings.length) facts.push({ icon: 'sibling', label: 'Siblings', people: kin.siblings.map((s) => ({ id: s })) })
  facts.push({ icon: 'house', label: 'House', text: c.house === dyn.label ? dyn.label : `${c.house} · ${dyn.label}` })

  const by = (kind: StoryMoment['kind'], dir: 'from' | 'to') =>
    [...new Set(moments.filter((m) => m.kind === kind && m[dir === 'from' ? 'to' : 'from'] === id).map((m) => m[dir]))]
  const teachers = by('teacher', 'from'), students = by('teacher', 'to')
  const allies = [...new Set(moments.filter((m) => m.kind === 'ally').map((m) => (m.from === id ? m.to : m.from)))]
  const rivals = [...new Set(moments.filter((m) => m.kind === 'rival' || m.kind === 'deceit').map((m) => (m.from === id ? m.to : m.from)))]
  const slainBy = by('slew', 'from'), slew = by('slew', 'to')
  const served = by('service', 'to'), servedBy = by('service', 'from')
  if (teachers.length) facts.push({ icon: 'teacher', label: 'Taught by', people: teachers.map((x) => ({ id: x })) })
  if (students.length) facts.push({ icon: 'student', label: 'Taught', people: students.map((x) => ({ id: x })) })
  if (allies.length) facts.push({ icon: 'ally', label: 'Allies', people: allies.map((x) => ({ id: x })) })
  if (rivals.length) facts.push({ icon: 'rival', label: 'Rivals', people: rivals.map((x) => ({ id: x })) })
  if (served.length) facts.push({ icon: 'ally', label: 'Served', people: served.map((x) => ({ id: x })) })
  if (servedBy.length) facts.push({ icon: 'ally', label: 'Served by', people: servedBy.map((x) => ({ id: x })) })
  if (slew.length) facts.push({ icon: 'slew', label: 'Slew', people: slew.map((x) => ({ id: x })) })
  if (slainBy.length) facts.push({ icon: 'slain', label: 'Slain by', people: slainBy.map((x) => ({ id: x })) })
  if (c.fate) facts.push({ icon: 'fate', label: 'Fate', text: c.fate })
  if (c.parvas.length) facts.push({ icon: 'first', label: 'First seen', text: `${PARVA_NAMES[c.parvas[0] - 1]} Parva${c.episode ? ` · ${c.episode}` : ''}` })

  // ── lineage spine ──
  const parentRels = g.parentsOf.get(id) ?? []
  const parents = parentRels.slice(0, 4).map((r) => ({ id: r.from, note: r.type !== 'parent' ? BOND[r.type] : undefined }))
  const grand: SpineNode[] = []
  for (const p of parentRels.filter((r) => r.type === 'parent' || r.type === 'legal').slice(0, 2)) {
    for (const gp of (g.parentsOf.get(p.from) ?? []).filter((r) => r.type === 'parent' || r.type === 'legal').slice(0, 2)) {
      if (!grand.some((x) => x.id === gp.from)) grand.push({ id: gp.from })
    }
  }
  const children = (g.childrenOf.get(id) ?? []).map((r) => ({ id: r.to, note: r.type !== 'parent' ? CHILD_BOND[r.type] : undefined }))
  const spine: Spine = {
    grand: grand.slice(0, 4),
    parents,
    self: { id },
    spouses: (g.spousesOf.get(id) ?? []).slice(0, 5).map((s) => ({ id: s })),
    children: children.slice(0, 8),
    moreChildren: Math.max(0, children.length - 8),
  }

  // ── kin tabs: the people closest to this life ──
  const tabs: KinTab[] = []
  const pushTab = (tid: string, bond: string) => { if (tid !== id && !tabs.some((t) => t.id === tid)) tabs.push({ id: tid, bond }) }
  for (const p of kin.parents) pushTab(p.id, p.type === 'parent' ? (g.byId.get(p.id)?.sex === 'f' ? 'Mother' : 'Father') : cap(BOND[p.type] ?? 'Parent'))
  for (const s of kin.spouses) pushTab(s, g.byId.get(s)?.sex === 'f' ? 'Wife' : 'Husband')
  for (const s of kin.siblings.slice(0, 4)) pushTab(s, g.byId.get(s)?.sex === 'f' ? 'Sister' : 'Brother')
  for (const t of teachers) pushTab(t, 'Teacher')
  for (const m of served) pushTab(m, 'Served')
  for (const r of rivals.slice(0, 2)) pushTab(r, 'Rival')
  for (const ch of kin.children.slice(0, 4)) pushTab(ch.id, g.byId.get(ch.id)?.sex === 'f' ? 'Daughter' : 'Son')
  for (const s of slainBy) pushTab(s, 'Slayer')

  // ── life timeline across the 18 books ──
  const timeline: TimelineMark[] = c.parvas.map((p) => ({ parva: p, kind: 'appears' }))
  for (const m of moments) {
    const p = parvaOfRef(m.ref)
    if (p) timeline.push({ parva: p, kind: 'moment', title: m.title, momentId: m.id, weight: m.weight })
  }

  // ── every recorded family bond, for "Family, as the epic tells it" ──
  const sx = (x: string, f: string, m: string) => (g.byId.get(x)?.sex === 'f' ? f : m)
  const bonds: Bond[] = []
  for (const r of parentRels) {
    const base = sx(r.from, 'Mother', 'Father')
    const label = r.type === 'parent' ? base : r.type === 'adoptive' ? `Foster ${base.toLowerCase()}` : cap(BOND[r.type] ?? base)
    bonds.push({ id: r.from, label, from: r.from, to: id, type: r.type })
  }
  for (const s of g.spousesOf.get(id) ?? []) bonds.push({ id: s, label: sx(s, 'Wife', 'Husband'), from: id, to: s, type: 'spouse' })
  for (const r of g.relations) {
    if (r.type !== 'sibling' || (r.from !== id && r.to !== id)) continue
    const o = r.from === id ? r.to : r.from
    bonds.push({ id: o, label: sx(o, 'Sister', 'Brother'), from: r.from, to: r.to, type: 'sibling' })
  }
  for (const r of g.childrenOf.get(id) ?? []) {
    const base = sx(r.to, 'Daughter', 'Son')
    bonds.push({ id: r.to, label: r.type === 'parent' ? base : `${base} · ${CHILD_BOND[r.type]}`, from: id, to: r.to, type: r.type })
  }

  const nameCount = new Map<string, number>()
  for (const pid of new Set(facts.flatMap((f) => f.people?.map((x) => x.id) ?? []))) {
    const n = g.byId.get(pid)!.name
    nameCount.set(n, (nameCount.get(n) ?? 0) + 1)
  }

  // the small kingdoms grouped as "Other Kingdoms" each speak for themselves: Kashi, Chedi, Magadha…
  const ownHouse = c.dynasty === 'realms' && c.house && c.house !== dyn.label
  const members = g.chars.filter((x) => (ownHouse ? x.house === c.house : x.dynasty === c.dynasty)).length
  return {
    c, roles: roles.slice(0, 4), epigraph, facts, spine, kinTabs: tabs.slice(0, 7), timeline,
    moments: [...moments].sort((a, b) => (parvaOfRef(a.ref) ?? 99) - (parvaOfRef(b.ref) ?? 99) || b.weight - a.weight),
    house: { label: ownHouse ? c.house : dyn.label, sanskrit: ownHouse ? '' : dyn.sanskrit, color: dyn.color, members },
    bonds,
    nameCount,
  }
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export const tradLabel = (m: StoryMoment) => TRADITION[m.trad]
