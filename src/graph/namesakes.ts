import type { Character } from '../data/types'
import type { Graph } from './model'

/**
 * Many people in the epic share a name — two Gandharis, a dozen Bhimas, several Parikshits.
 * Wherever a name could be mistaken for a more famous bearer, it travels with a few words
 * that tell them apart: "Gandhari · wife of Krishna".
 */

const byName = new WeakMap<Graph, Map<string, Character[]>>()

const fold = (s: string) => s.toLowerCase().replace(/\s+[ivx]+$/, '').replace(/[^a-z]/g, '')

function index(g: Graph) {
  let m = byName.get(g)
  if (!m) {
    m = new Map()
    for (const c of g.chars) {
      const k = fold(c.name)
      const list = m.get(k)
      if (list) list.push(c)
      else m.set(k, [c])
    }
    // the most famous bearer first: curated tier, then how much of the epic they walk through
    for (const list of m.values()) list.sort((a, b) => a.tier - b.tier || b.parvas.length - a.parvas.length)
    byName.set(g, m)
  }
  return m
}

/** Everyone else who answers to this name, most famous first. */
export function namesakesOf(g: Graph, id: string): Character[] {
  const c = g.byId.get(id)
  if (!c) return []
  return (index(g).get(fold(c.name)) ?? []).filter((x) => x.id !== id)
}

/**
 * A few words that identify someone: their epithet, or the first clause of who they were.
 * Seen from a relative's page, a clause naming that relative says nothing new ("wife of Krishna"
 * among Krishna's wives), so the next clause is used instead ("a princess of Gandhara").
 */
export function descriptor(c: Character, from?: Character): string {
  if (c.epithet && c.epithet !== 'One of the hundred') return c.epithet.replace(/^The /, 'the ')
  const clauses = c.summary.split(/(?<=[.;])\s|\s—\s|, (?=who |whose |not )/).map((x) => x.replace(/[.;]$/, '').trim()).filter(Boolean)
  let first = (from && clauses.find((x) => !x.includes(from.name))) || clauses[0] || c.name
  if (from) first = first.replace(new RegExp(`\\s+(?:by|of|to|with) ${from.name}\\b`), '')   // "a prince slain by Krishna", on Krishna's page
  const short = first.length > 46 ? first.slice(0, 44).replace(/\s\S*$/, '') + '…' : first
  return short.charAt(0).toLowerCase() + short.slice(1)
}

/**
 * The qualifier to print beside a name, or null when the name alone is unambiguous —
 * i.e. this is the most famous bearer, or no one more famous shares it.
 */
export function qualifier(g: Graph, id: string, from?: string): string | null {
  const c = g.byId.get(id)
  if (!c) return null
  const all = index(g).get(fold(c.name)) ?? []
  if (all.length < 2 || all[0].id === id) return null
  // a cluster of minor namesakes (twelve obscure kings named Sumitra) needs no fuss unless a main character shares the name
  if (all[0].tier > 2) return null
  return descriptor(c, from ? g.byId.get(from) : undefined)
}
