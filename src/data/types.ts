export type DynastyKey =
  | 'deva' | 'rishi' | 'naga' | 'asura' | 'solar' | 'lunar' | 'kuru'
  | 'pandava' | 'kaurava' | 'anga' | 'yadava' | 'panchala' | 'matsya'
  | 'gandhara' | 'madra' | 'realms'

export type Kind = 'mortal' | 'divine' | 'sage' | 'naga' | 'asura' | 'apsara' | 'gap'

/** Every way two people are joined on the map. `from` is always the elder / source. */
export type RelType =
  | 'parent'    // blood parent
  | 'legal'     // legal father (e.g. Pandu for the Pandavas)
  | 'divine'    // a god as father (Surya → Karna)
  | 'niyoga'    // Vyasa → Dhritarashtra, Pandu, Vidura
  | 'adoptive'  // foster / adoptive parent
  | 'boon'      // born of a rite, vessel or fire (Drupada → Draupadi)
  | 'rebirth'   // previous life (Amba → Shikhandi)
  | 'avatar'    // incarnation (Vishnu → Krishna)
  | 'spouse'
  | 'sibling'   // only used when no shared parent exists on the map

export const PARENTAL: ReadonlySet<RelType> = new Set([
  'parent', 'legal', 'divine', 'niyoga', 'adoptive', 'boon', 'rebirth', 'avatar',
])

/** Compact authoring shape used in characters.ts */
export interface CharacterInput {
  id: string
  n: string           // name
  dv: string          // Devanagari
  g: number           // time-band (≈ generation relative to the Kuru line)
  d: DynastyKey
  t: 1 | 2 | 3 | 4    // prominence tier (4 = minor: named in passing)
  k?: Kind            // default mortal
  sx: 'm' | 'f' | 'n'
  r?: 1               // royal
  h?: string          // house label override (Kashi, Vidarbha…)
  ep?: string         // epithet
  al?: string[]       // aliases
  s: string           // one-line summary
  fate?: string
  v?: string          // variant-tradition note
  p?: string[]        // blood parents
  cl?: 'kauravas'     // cluster membership
}

export interface Character {
  id: string
  name: string
  devanagari: string
  gen: number
  dynasty: DynastyKey
  tier: 1 | 2 | 3 | 4
  kind: Kind
  sex: 'm' | 'f' | 'n'
  royal: boolean
  house: string
  epithet?: string
  aliases: string[]
  summary: string
  fate?: string
  variant?: string
  cluster?: 'kauravas'
  /** curated by hand, or drawn from Sørensen's Index to the Names in the Mahābhārata */
  source: 'curated' | 'index'
  /** books of the epic (1–18) the character is cited in */
  parvas: number[]
  /** the first section of the epic in which the index cites them */
  episode?: string
  /** entry number in Sørensen's index */
  indexEntry?: number
  /** constellation for characters who float free of the family tree */
  group?: string
  /** island for self-contained families told in tales */
  island?: string
  /** position inside an island */
  local?: { x: number; y: number }
}

export interface Relation {
  from: string
  to: string
  type: RelType
}

// ─────────────────────────────── Story layer ───────────────────────────────

export type StoryKind =
  | 'teacher' | 'ally' | 'rival' | 'slew' | 'deceit' | 'vow' | 'curse' | 'boon' | 'love' | 'counsel' | 'service'

/** Where an episode is told. "critical" means it stands in the BORI Critical Edition. */
export type Tradition = 'critical' | 'vulgate' | 'purana' | 'folk' | 'modern' | 'index'

export interface StoryMoment {
  id: string
  /** the one who acts (the slayer, the teacher, the one who curses) */
  from: string
  to: string
  kind: StoryKind
  title: string
  text: string
  trad: Tradition
  /** where it is told, e.g. "Sabha Parva" */
  ref?: string
  /** 3 = defining moment, 2 = major, 1 = minor */
  weight: 1 | 2 | 3
  /** moments this one leads to */
  next?: string[]
}
