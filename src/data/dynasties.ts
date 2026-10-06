import type { DynastyKey } from './types'

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
  Kashi: 0, Kalinga: 700, Sindhu: 1150, Pragjyotisha: 1800, Nishada: 2000, Kekaya: -1500,
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
