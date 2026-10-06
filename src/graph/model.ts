import { decodeParvas, type CensusData } from '../data/census'
import { CHARACTERS, RELATIONS } from '../data/characters'
import { DYNASTIES } from '../data/dynasties'
import { STORIES } from '../data/stories'
import { PARENTAL, type Character, type Relation, type StoryMoment } from '../data/types'

export interface Graph {
  chars: Character[]
  stories: StoryMoment[]
  groups: { id: string; title: string; sub: string }[]
  islands: { id: string; title: string }[]
  byId: Map<string, Character>
  index: Map<string, number>
  relations: Relation[]
  parentsOf: Map<string, Relation[]>
  childrenOf: Map<string, Relation[]>
  spousesOf: Map<string, string[]>
  siblingsOf: Map<string, string[]>
}

export function buildGraph(census?: CensusData): Graph {
  const chars: Character[] = CHARACTERS.map((c) => {
    const ix = census?.curated[c.id]
    return {
      id: c.id,
      name: c.n,
      devanagari: c.dv,
      gen: c.g,
      dynasty: c.d,
      tier: c.t,
      kind: c.k ?? 'mortal',
      sex: c.sx,
      royal: !!c.r,
      house: c.h ?? DYNASTIES[c.d].label,
      epithet: c.ep,
      aliases: [...(c.al ?? [])],
      summary: c.s,
      fate: c.fate,
      variant: c.v,
      cluster: c.cl,
      source: 'curated',
      parvas: ix ? decodeParvas(ix[1]) : [],
      episode: ix?.[2] || undefined,
      indexEntry: ix?.[0],
    }
  })

  const relations: Relation[] = []
  for (const c of CHARACTERS) for (const p of c.p ?? []) relations.push({ from: p, to: c.id, type: 'parent' })
  for (const [from, to, type] of RELATIONS) relations.push({ from, to, type })
  const stories: StoryMoment[] = [...STORIES]

  if (census) {
    for (const r of census.chars) {
      const [id, name, devanagari, gen, dynasty, tier, kind, sex, house, gloss, parvas, episode, entry, group, island, x, y] = r
      chars.push({
        id, name, devanagari, gen: gen ?? -1, dynasty, tier, kind, sex,
        royal: /\b(king|queen|Rajarshi)\b/i.test(gloss),
        house: house || DYNASTIES[dynasty].label,
        aliases: [], summary: gloss, source: 'index', parvas: decodeParvas(parvas),
        episode: episode || undefined, indexEntry: entry,
        group: group && group !== 'kauravas' ? group : undefined,
        cluster: group === 'kauravas' ? 'kauravas' : undefined,
        island: group === 'kauravas' ? undefined : island ?? undefined,
        local: x !== null && y !== null ? { x, y } : undefined,
      })
    }
    for (const [from, to, type] of census.rels) relations.push({ from, to, type })
    census.stories.forEach(([from, to, kind, title, text], i) => {
      stories.push({ id: `ix${i}`, from, to, kind, title, text, trad: 'index', weight: 1 })
    })
  }
  const byId = new Map(chars.map((c) => [c.id, c]))
  if (census) {
    for (const [alias, id] of census.aliases) {
      const c = byId.get(id)
      if (c && alias !== c.name && !c.aliases.includes(alias)) c.aliases.push(alias)
    }
  }
  const index = new Map(chars.map((c, i) => [c.id, i]))
  const parentsOf = new Map<string, Relation[]>()
  const childrenOf = new Map<string, Relation[]>()
  const spousesOf = new Map<string, string[]>()
  const siblingsOf = new Map<string, string[]>()
  const push = <T,>(m: Map<string, T[]>, k: string, v: T) => {
    const a = m.get(k)
    if (a) a.push(v)
    else m.set(k, [v])
  }

  for (const r of relations) {
    if (PARENTAL.has(r.type)) {
      push(parentsOf, r.to, r)
      push(childrenOf, r.from, r)
    } else if (r.type === 'spouse') {
      push(spousesOf, r.from, r.to)
      push(spousesOf, r.to, r.from)
    } else if (r.type === 'sibling') {
      push(siblingsOf, r.from, r.to)
      push(siblingsOf, r.to, r.from)
    }
  }

  return {
    chars, stories, byId, index, relations, parentsOf, childrenOf, spousesOf, siblingsOf,
    groups: census?.groups.filter((g) => g.id !== 'kauravas') ?? [],
    islands: census?.islands ?? [],
  }
}

export interface Lineage {
  ancestors: Map<string, number>   // id → depth
  descendants: Map<string, number>
  spouses: Set<string>
}

/** Walks every parental thread upward and downward from a character. */
export function lineageOf(g: Graph, id: string): Lineage {
  const walk = (start: string, next: (id: string) => Relation[] | undefined, pick: (r: Relation) => string) => {
    const seen = new Map<string, number>()
    let frontier = [start]
    let depth = 0
    while (frontier.length) {
      depth++
      const nf: string[] = []
      for (const cur of frontier) {
        for (const r of next(cur) ?? []) {
          const o = pick(r)
          if (o === id || seen.has(o)) continue
          seen.set(o, depth)
          nf.push(o)
        }
      }
      frontier = nf
    }
    return seen
  }
  return {
    ancestors: walk(id, (x) => g.parentsOf.get(x), (r) => r.from),
    descendants: walk(id, (x) => g.childrenOf.get(x), (r) => r.to),
    spouses: new Set(g.spousesOf.get(id) ?? []),
  }
}

export interface Kin {
  parents: { id: string; type: Relation['type'] }[]
  spouses: string[]
  children: { id: string; type: Relation['type'] }[]
  siblings: string[]
}

export function kinOf(g: Graph, id: string): Kin {
  const parents = (g.parentsOf.get(id) ?? []).map((r) => ({ id: r.from, type: r.type }))
  const children = (g.childrenOf.get(id) ?? []).map((r) => ({ id: r.to, type: r.type }))
  const sibs = new Set<string>(g.siblingsOf.get(id) ?? [])
  const shared = new Set(['parent', 'legal', 'niyoga'])
  for (const p of g.parentsOf.get(id) ?? []) {
    if (!shared.has(p.type)) continue
    for (const c of g.childrenOf.get(p.from) ?? []) if (c.to !== id && shared.has(c.type)) sibs.add(c.to)
  }
  return { parents, spouses: g.spousesOf.get(id) ?? [], children, siblings: [...sibs] }
}
