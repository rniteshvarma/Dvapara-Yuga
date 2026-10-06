import type { DynastyKey, Kind, StoryKind } from './types'

/**
 * The census: every person named in Sørensen's *Index to the Names in the Mahābhārata*
 * (1904), built by research/build_census.py. Loaded on demand — it is the bulk of the data.
 */
export type CensusRow = [
  id: string, name: string, devanagari: string, gen: number | null, dynasty: DynastyKey, tier: 2 | 3 | 4,
  kind: Kind, sex: 'm' | 'f' | 'n', house: string, gloss: string, parvas: string, episode: string, entry: number,
  group: string | null, island: string | null, x: number | null, y: number | null,
]

export interface CensusData {
  source: string
  chars: CensusRow[]
  rels: [string, string, 'parent' | 'spouse' | 'sibling' | 'adoptive'][]
  stories: [string, string, StoryKind, string, string][]
  aliases: [string, string][]
  /** curated id → [index entry, parvas, episode] */
  curated: Record<string, [number, string, string]>
  groups: { id: string; title: string; sub: string }[]
  islands: { id: string; title: string }[]
}

export async function loadCensus(): Promise<CensusData> {
  const mod = await import('./census.json')
  return (mod.default ?? mod) as unknown as CensusData
}

/** 'ACD' → [1, 3, 4] */
export const decodeParvas = (s: string) => [...s].map((c) => c.charCodeAt(0) - 64)
