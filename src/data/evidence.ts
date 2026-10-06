/**
 * Where the epic itself tells each family bond — built by research/verify_text.py, which reads
 * K. M. Ganguli's translation (1883–96) for a passage naming both people with a word for the bond.
 *
 *   q, b, s  the passage, its book (1–18) and section
 *   l        the bond is not in the Mahabharata; it comes from the books that continue it
 *
 * A bond with no entry comes from Sørensen's index alone (usually a list of names the matcher cannot read).
 */
export interface Evidence { q?: string; b?: number; s?: number; l?: string }
export type EvidenceMap = Record<string, Evidence>

let pending: Promise<EvidenceMap> | null = null
export const loadEvidence = () => (pending ??= import('./evidence.json').then((m) => m.default as EvidenceMap))

export function evidenceFor(ev: EvidenceMap, a: string, b: string, type: string): Evidence | undefined {
  return ev[`${a}|${b}|${type}`] ?? ev[`${b}|${a}|${type}`]
}
