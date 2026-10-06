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
  if (c.epithet && c.epithet !== 'One of the hundred') return lower(c.epithet)
  const clauses = c.summary.split(/(?<=[.;])\s|\s—\s|, (?=who |whose |not )/).map((x) => x.replace(/[.;]$/, '').trim()).filter(Boolean)
  let first = clauses[0] ?? c.name
  if (from && first.includes(from.name)) {
    // "Naga princess who drew Arjuna into the river", seen from Arjuna → "Naga princess"
    const cut = first.slice(0, first.indexOf(from.name))
      .replace(/[\s,]+(?:who|whom|whose|that|which)\b.*$/i, '')                       // drop the relative clause about them
      .replace(/[\s,]*(?:\b(?:and|of|by|to|with|for|from|the)\b[\s,]*)+$/i, '').trim()
    first = cut.split(/\s+/).length >= 2 ? cut : (clauses.find((x) => !x.includes(from.name) && /^[A-Z]/.test(x)) ?? first)
    first = first.replace(new RegExp(`\\s+(?:by|of|to|with) ${from.name}\\b`), '')
  }
  const short = first.length > 46 ? first.slice(0, 44).replace(/\s\S*$/, '') + '…' : first
  return lower(short)
}

// a description reads in the middle of a sentence: "a princess of Gandhara" — but "Krishna’s sister" keeps its capital
const COMMON = /^(A|An|The|One|Son|Sons|Daughter|Wife|Husband|Mother|Father|Brother|Sister|King|Queen|Prince|Princess|Eldest|Youngest|Elder|Younger|Mind-born|Celestial|Chief|Charioteer|Sage|Teacher|Twin|Naga|Asura|Rakshasa|Apsara|Warrior|Ruler|Lord|Grandson|Granddaughter|Mighty|Aged|Brahmin|Family|First|Last|Only|Nishada|Fisher-chief|Commander|Usurper|Emperor|Bharata|Paurava|Kuru|Vrishni|Yadava)\b/
const lower = (s: string) => (COMMON.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)

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
