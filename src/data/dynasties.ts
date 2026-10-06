import type { DynastyKey, StoryKind, Tradition } from './types'

export interface Dynasty {
  label: string
  sanskrit: string
  color: string
  /** horizontal anchor used by the layout engine (world units) */
  anchor: number
}

export const DYNASTIES: Record<DynastyKey, Dynasty> = {
  deva:     { label: 'Celestials',        sanskrit: 'देव',        color: '#b8913a', anchor: 0 },
  rishi:    { label: 'Sages',             sanskrit: 'ऋषि',        color: '#8a7462', anchor: 1700 },
  naga:     { label: 'Nagas',             sanskrit: 'नाग',        color: '#2f8a76', anchor: 2400 },
  asura:    { label: 'Asuras & Rakshasas', sanskrit: 'असुर',       color: '#7b4f86', anchor: 300 },
  solar:    { label: 'Solar Dynasty',     sanskrit: 'सूर्यवंश',    color: '#c98a2e', anchor: -500 },
  lunar:    { label: 'Lunar Dynasty',     sanskrit: 'चन्द्रवंश',   color: '#5f6fa3', anchor: 0 },
  kuru:     { label: 'House of Kuru',     sanskrit: 'कुरुवंश',     color: '#c86a2a', anchor: 0 },
  pandava:  { label: 'Pandavas',          sanskrit: 'पाण्डव',      color: '#34488f', anchor: -700 },
  kaurava:  { label: 'Kauravas',          sanskrit: 'कौरव',       color: '#9b3434', anchor: 500 },
  anga:     { label: 'House of Karna',    sanskrit: 'अङ्ग',        color: '#d39a1c', anchor: -150 },
  yadava:   { label: 'Yadavas',           sanskrit: 'यादव',       color: '#1f7a9e', anchor: -2000 },
  panchala: { label: 'Panchala',          sanskrit: 'पाञ्चाल',     color: '#c2557c', anchor: -1200 },
  matsya:   { label: 'Matsya',            sanskrit: 'मत्स्य',      color: '#6c8a34', anchor: -1500 },
  gandhara: { label: 'Gandhara',          sanskrit: 'गान्धार',     color: '#8c6a3c', anchor: 1000 },
  madra:    { label: 'Madra',             sanskrit: 'मद्र',        color: '#7458a8', anchor: -900 },
  realms:   { label: 'Other Kingdoms',    sanskrit: 'जनपद',       color: '#5f6b7a', anchor: 1100 },
}

/** Layout anchors for the smaller kingdoms grouped under "Other Kingdoms". */
export const HOUSE_ANCHOR: Record<string, number> = {
  Vidarbha: -2300, 'The bears': -2200, Chedi: -1800, Magadha: -1650, Manipura: -600, Shibi: -700,
  Kashi: 0, Kalinga: 700, Sindhu: 1150, Trigarta: 1350, Karusha: -1750, Pragjyotisha: 1800, Nishada: 2000, Kekaya: -1500,
}

export const RELATION_STYLE = {
  parent:   { label: 'Bloodline',          hint: 'Parent to child' },
  spouse:   { label: 'Marriage',           hint: 'Twin threads' },
  divine:   { label: 'Divine fatherhood',  hint: 'A god as father' },
  niyoga:   { label: 'Niyoga',             hint: 'Heir by sanctioned union' },
  adoptive: { label: 'Fostered',           hint: 'Raised as their own' },
  boon:     { label: 'Born of a rite',     hint: 'From fire, vessel or reeds' },
  rebirth:  { label: 'Rebirth',            hint: 'A former life' },
} as const

export const STORY_KIND: Record<StoryKind, { label: string; color: string }> = {
  slew:    { label: 'Slain',                 color: '#7a2233' },
  rival:   { label: 'Rivalry & insult',      color: '#b4473f' },
  deceit:  { label: 'Deceit & trickery',     color: '#6c4aa0' },
  curse:   { label: 'Curse',                 color: '#cc5a28' },
  vow:     { label: 'Vow & promise',         color: '#b08a2e' },
  boon:    { label: 'Boon & gift',           color: '#5c8f3a' },
  teacher: { label: 'Teacher & student',     color: '#8b6a2f' },
  counsel: { label: 'Counsel & revelation',  color: '#3d68a8' },
  ally:    { label: 'Alliance & friendship', color: '#2a7f88' },
  love:    { label: 'Love & marriage',       color: '#c25b7c' },
  service: { label: 'Service',               color: '#5f6e85' },
}

export const TRADITION: Record<Tradition, { label: string; short: string; canon: boolean }> = {
  critical: { label: 'Vyasa’s text · Critical Edition', short: 'Vyasa’s text', canon: true },
  vulgate:  { label: 'Other recensions of the epic',     short: 'Recension', canon: false },
  purana:   { label: 'Harivamsha & Puranas',             short: 'Purana', canon: false },
  folk:     { label: 'Regional & folk tradition',        short: 'Folk', canon: false },
  modern:   { label: 'Modern retelling',                 short: 'Modern', canon: false },
  index:    { label: 'Mahabharata text, via Sørensen’s Index (1904) — not yet checked against the Critical Edition', short: 'Index', canon: false },
}

export const PARVA_NAMES = [
  'Adi', 'Sabha', 'Vana', 'Virata', 'Udyoga', 'Bhishma', 'Drona', 'Karna', 'Shalya', 'Sauptika', 'Stri', 'Shanti',
  'Anushasana', 'Ashvamedhika', 'Ashramavasika', 'Mausala', 'Mahaprasthanika', 'Svargarohana',
]
