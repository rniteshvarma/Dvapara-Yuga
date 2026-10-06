import type { RelType } from '../data/types'
import type { Graph } from './model'

/**
 * How are two people related? The shortest chain of family bonds between them — blood before marriage,
 * birth before fostering — read out step by step ("Bhima, his father") and, where the chain is a plain
 * line of descent, named the way English names kin ("first cousin once removed").
 */

type Move = 'up' | 'down' | 'spouse' | 'sibling'
export interface Step { id: string; move?: Move; type?: RelType; label?: string }
export interface Relation { steps: Step[]; headline: string | null }

// what each kind of bond costs: a path through fostering or a god is taken only when nothing closer exists
const COST: Partial<Record<RelType, number>> = {
  parent: 1, legal: 1.05, niyoga: 1.1, divine: 1.3, boon: 1.2, adoptive: 1.4, spouse: 1.15, sibling: 1.6,
}

export function relate(g: Graph, from: string, to: string): Relation | null {
  if (from === to || !g.byId.has(from) || !g.byId.has(to)) return null
  const dist = new Map<string, number>([[from, 0]])
  const prev = new Map<string, Step & { at: string }>()
  const done = new Set<string>()
  // a small graph (a few thousand people): a plain priority list is fast enough
  const open: [number, string][] = [[0, from]]
  while (open.length) {
    open.sort((a, b) => a[0] - b[0])
    const [d, cur] = open.shift()!
    if (done.has(cur)) continue
    done.add(cur)
    if (cur === to) break
    const go = (id: string, move: Move, type: RelType) => {
      const nd = d + (COST[type] ?? 9)
      if (nd < (dist.get(id) ?? Infinity)) {
        dist.set(id, nd)
        prev.set(id, { id, move, type, at: cur })
        open.push([nd, id])
      }
    }
    for (const r of g.parentsOf.get(cur) ?? []) if (COST[r.type]) go(r.from, 'up', r.type)
    for (const r of g.childrenOf.get(cur) ?? []) if (COST[r.type]) go(r.to, 'down', r.type)
    for (const s of g.spousesOf.get(cur) ?? []) go(s, 'spouse', 'spouse')
    for (const s of g.siblingsOf.get(cur) ?? []) go(s, 'sibling', 'sibling')
  }
  if (!prev.has(to)) return null

  const steps: Step[] = []
  for (let at = to; at !== from; at = prev.get(at)!.at) {
    const s = prev.get(at)!
    steps.unshift({ id: s.id, move: s.move, type: s.type })
  }
  steps.unshift({ id: from })
  for (const s of steps) if (s.move) s.label = label(g, s)
  return { steps, headline: headline(g, steps) }
}

const sexed = (g: Graph, id: string, f: string, m: string) => (g.byId.get(id)?.sex === 'f' ? f : m)

/** How this step's person stands to the one before: "father", "foster mother", "wife". */
function label(g: Graph, s: Step): string {
  const id = s.id
  if (s.move === 'spouse') return sexed(g, id, 'wife', 'husband')
  if (s.move === 'sibling') return sexed(g, id, 'sister', 'brother')
  if (s.move === 'up') {
    const base = sexed(g, id, 'mother', 'father')
    return s.type === 'adoptive' ? `foster ${base}` : s.type === 'divine' ? `divine ${base}`
      : s.type === 'niyoga' ? `${base} by niyoga` : s.type === 'legal' ? `legal ${base}` : s.type === 'boon' ? `${base}, by a rite` : base
  }
  const base = sexed(g, id, 'daughter', 'son')
  return s.type === 'adoptive' ? `foster ${base}` : s.type === 'divine' ? `${base}, by a god` : s.type === 'niyoga' ? `${base} by niyoga` : base
}

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth']
const TIMES = ['', 'once', 'twice', 'three times', 'four times', 'five times', 'six times']
const greats = (n: number) => (n <= 0 ? '' : n === 1 ? 'great-' : `${n}× great-`)

/** Name the kin of a plain line (ups then downs), e.g. 2 up, 1 down → uncle. */
function kinTerm(up: number, down: number, sex: 'f' | 'm' | 'u'): string | null {
  const f = sex === 'f'
  if (up === 0 && down === 0) return null
  if (up === 0) return down === 1 ? (f ? 'daughter' : 'son') : `${greats(down - 2)}grand${f ? 'daughter' : 'son'}`
  if (down === 0) return up === 1 ? (f ? 'mother' : 'father') : `${greats(up - 2)}grand${f ? 'mother' : 'father'}`
  if (up === 1 && down === 1) return f ? 'sister' : 'brother'
  if (up === 1) return `${greats(down - 2)}${down > 2 ? 'grand-' : ''}${f ? 'niece' : 'nephew'}`.replace('great-grand-', 'great-grand')
  if (down === 1) return `${greats(up - 2)}${f ? 'aunt' : 'uncle'}`
  const degree = Math.min(up, down) - 1
  const removed = Math.abs(up - down)
  return `${ORD[degree] ?? `${degree}th`} cousin${removed ? ` ${TIMES[removed] ?? `${removed} times`} removed` : ''}`
}

/** "Krishna is Ghatotkacha's first cousin once removed", when the chain allows a name. */
function headline(g: Graph, steps: Step[]): string | null {
  const a = g.byId.get(steps[0].id)!, b = g.byId.get(steps[steps.length - 1].id)!
  const moves = steps.slice(1).map((s) => s.move!)
  const key = moves.join(',')
  const mid = steps[1] && g.byId.get(steps[1].id)
  // the few shapes through a marriage that English still has a word for
  if (key === 'spouse,spouse') return `${a.name} and ${b.name} were both married to ${g.byId.get(steps[1].id)!.name}.`
  if (key === 'up,spouse') return `${b.name} is ${a.name}’s step${sexed(g, b.id, 'mother', 'father')}.`
  if (key === 'spouse,down') return `${b.name} is ${a.name}’s step${sexed(g, b.id, 'daughter', 'son')}.`
  if (key === 'up,spouse,down') return `${b.name} is ${a.name}’s step${sexed(g, b.id, 'sister', 'brother')} — child of ${mid!.name}’s ${sexed(g, steps[2].id, 'wife', 'husband')}, ${g.byId.get(steps[2].id)!.name}.`
  // a spouse may sit at either end ("his wife's brother", "the wife of his uncle"); nowhere else
  let lead = false, tail = false
  let core = moves
  if (core[0] === 'spouse' && core.length > 1) { lead = true; core = core.slice(1) }
  if (core[core.length - 1] === 'spouse' && core.length > 1) { tail = true; core = core.slice(0, -1) }
  if (core.length === 1 && core[0] === 'spouse') return `${b.name} is ${a.name}’s ${sexed(g, b.id, 'wife', 'husband')}.`
  let up = 0, down = 0, valley = false
  for (const m of core) {
    if (m === 'spouse') return null
    if (m === 'up') { if (down) valley = true; up++ }
    else if (m === 'down') down++
    else { if (down) valley = true; up++; down++ }      // a sibling: one up to the shared parent, one down
  }
  if (valley) return null                                // down then up again: in-laws of in-laws, no single word
  const blood = tail ? steps[steps.length - 2].id : b.id
  const term = kinTerm(up, down, (g.byId.get(blood)?.sex ?? 'u') as 'f' | 'm' | 'u')
  if (!term) return null
  const via = lead ? `${a.name}’s ${sexed(g, steps[1].id, 'wife', 'husband')}’s` : `${a.name}’s`
  if (tail) return `${b.name} is the ${sexed(g, b.id, 'wife', 'husband')} of ${via} ${term}.`
  return `${b.name} is ${via} ${term}.`
}
