import Fuse from 'fuse.js'
import type { Character } from '../data/types'
import type { Graph } from '../graph/model'

/** Spelling-forgiving key: 'Purocana', 'Purochana' and 'Purōchana' all become 'purocana'. */
export function spellKey(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
    .replace(/w/g, 'v')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/([kgcjtdpb])h/g, '$1')
    .replace(/(.)\1+/g, '$1')
}

interface Entry { c: Character; k: string; ak: string[]; epithet: string | undefined; house: string }
const cache = new WeakMap<Graph, { entries: Entry[]; fuse: Fuse<Entry> }>()

function indexOf(g: Graph) {
  let x = cache.get(g)
  if (!x) {
    const entries = g.chars
      .filter((c) => c.kind !== 'gap')
      .map((c): Entry => ({ c, k: spellKey(c.name), ak: c.aliases.map(spellKey), epithet: c.epithet, house: c.house }))
    const fuse = new Fuse(entries, {
      keys: [{ name: 'k', weight: 3 }, { name: 'ak', weight: 2 }, { name: 'epithet', weight: 1 }, { name: 'house', weight: 0.5 }],
      threshold: 0.34,
      ignoreLocation: true,
    })
    x = { entries, fuse }
    cache.set(g, x)
  }
  return x
}

/** People matching a typed name or epithet: names that begin with it first, the great before the minor. */
export function findPeople(g: Graph, q: string, limit = 9): Character[] {
  const { entries, fuse } = indexOf(g)
  const qk = spellKey(q)
  if (!qk) return []
  const prefix = qk.length >= 1
    ? entries.filter((e) => e.k.startsWith(qk) || e.ak.some((a) => a.startsWith(qk)))
        .sort((a, b) => Number(!a.k.startsWith(qk)) - Number(!b.k.startsWith(qk)) || a.c.tier - b.c.tier || a.k.length - b.k.length)
    : []
  const fuzzy = fuse.search(qk, { limit: 30 }).sort((a, b) => (a.score! - b.score!) || a.item.c.tier - b.item.c.tier).map((r) => r.item)
  const seen = new Set<string>()
  const out: Character[] = []
  for (const e of [...prefix, ...fuzzy]) {
    if (seen.has(e.c.id)) continue
    seen.add(e.c.id)
    out.push(e.c)
    if (out.length >= limit) break
  }
  return out
}
