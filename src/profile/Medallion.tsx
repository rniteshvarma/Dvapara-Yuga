import { useId, useMemo } from 'react'
import { DYNASTIES } from '../data/dynasties'
import type { Character } from '../data/types'

/**
 * The medallion portrait: every one of the 3,616 characters gets one, generated
 * from who they are. The frame says what kind of being they were, the colour
 * their house, the woven rosette is unique to them, and their name's first
 * Devanagari syllable sits at the heart in gold.
 */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The first grapheme of a Devanagari name: क, कृ, श्री… */
export function firstAkshara(dv: string) {
  try {
    const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' })
    const it = seg.segment(dv)[Symbol.iterator]().next()
    return it.done ? dv.slice(0, 1) : it.value.segment
  } catch {
    return dv.slice(0, 1)
  }
}

type Motif = 'bow' | 'mace' | 'discus' | 'lotus' | 'crown' | 'serpent' | 'flame' | 'pot' | 'wheel' | 'none'

export function motifOf(c: Character, roles: string[] = []): Motif {
  const t = `${c.summary} ${c.epithet ?? ''} ${roles.join(' ')}`
  if (c.id === 'krishna' || c.id === 'vishnu') return 'discus'
  if (/archer|bow|Gandiva/i.test(t)) return 'bow'
  if (/\bmace\b/i.test(t)) return 'mace'
  if (c.kind === 'naga' || /serpent/i.test(t)) return 'serpent'
  if (c.kind === 'sage' || /\bsage|teacher|ascetic/i.test(t)) return 'pot'
  if (c.kind === 'asura' || /fire|Agni/i.test(t)) return 'flame'
  if (c.kind === 'divine' || c.kind === 'apsara') return 'lotus'
  if (c.royal) return 'crown'
  if (/warrior|fought|battle/i.test(t)) return 'wheel'
  return 'none'
}

const MOTIF_PATH: Record<Motif, string> = {
  bow: 'M-9 -10 Q 4 0 -9 10 M-9 -10 L-9 10 M-12 0 L 10 0 M 6 -3 L 10 0 L 6 3',
  mace: 'M0 10 L0 -2 M-5 -6 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M0 -11 L0 -13',
  discus: 'M0 0 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M0 0 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M0 -9 L0 -13 M0 9 L0 13 M-9 0 L-13 0 M9 0 L13 0',
  lotus: 'M0 8 Q -9 0 0 -10 Q 9 0 0 8 M0 8 Q -14 4 -11 -4 Q -5 2 0 8 M0 8 Q 14 4 11 -4 Q 5 2 0 8',
  crown: 'M-11 6 L-11 -4 L-5 1 L0 -8 L5 1 L11 -4 L11 6 Z',
  serpent: 'M-12 6 Q -6 -6 0 2 Q 6 10 10 -2 Q 12 -8 7 -9 M7 -9 l2 -2',
  flame: 'M0 10 Q -9 4 -4 -3 Q -2 2 0 -2 Q -1 -8 3 -11 Q 2 -4 6 -2 Q 9 4 0 10',
  pot: 'M-7 -6 Q -10 6 0 9 Q 10 6 7 -6 Z M-5 -6 L-5 -9 L5 -9 L5 -6 M7 -3 Q 13 -3 11 3',
  wheel: 'M0 0 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M-9 0 L9 0 M0 -9 L0 9 M-6.4 -6.4 L6.4 6.4 M-6.4 6.4 L6.4 -6.4',
  none: '',
}

export function Medallion({ c, size = 320, roles, still = false, className = '' }: {
  c: Character; size?: number; roles?: string[]; still?: boolean; className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const color = DYNASTIES[c.dynasty].color
  const ak = useMemo(() => firstAkshara(c.devanagari || c.name), [c])
  const motif = motifOf(c, roles)
  const detail = size >= 120

  const art = useMemo(() => {
    const r = rng(hash(c.id))
    const petals = 6 + Math.floor(r() * 7) * 2         // 6…18, even
    const twist = r() * 360
    const depth = 0.55 + r() * 0.3
    const inner = 3 + Math.floor(r() * 4)
    const rings = 1 + Math.floor(r() * 3)
    return { petals, twist, depth, inner, rings }
  }, [c.id])

  // rosette: petals of an epicycle-like curve, woven in the house colour
  const rosette = useMemo(() => {
    const { petals, depth } = art
    const pts: string[] = []
    for (let i = 0; i <= 360; i++) {
      const a = (i / 360) * Math.PI * 2
      const rr = 100 * (0.62 + 0.38 * Math.pow(Math.abs(Math.cos((petals / 2) * a)), depth * 2))
      pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`)
    }
    return 'M' + pts.join(' L') + 'Z'
  }, [art])

  const kind = c.kind
  const frame = (() => {
    if (kind === 'divine' || kind === 'apsara') {
      const n = kind === 'divine' ? 12 : 8
      return Array.from({ length: n }, (_, i) => (
        <ellipse key={i} cx="0" cy="-168" rx="14" ry="26" transform={`rotate(${(i * 360) / n})`} className="m-gold-stroke" />
      ))
    }
    if (kind === 'naga') {
      const pts: string[] = []
      for (let i = 0; i <= 360; i += 2) {
        const a = (i / 180) * Math.PI
        const rr = 166 + Math.sin(a * 9) * 6
        pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`)
      }
      return <path d={'M' + pts.join(' L')} className="m-ink-stroke" />
    }
    if (kind === 'asura') {
      return Array.from({ length: 24 }, (_, i) => (
        <path key={i} d="M-5 -158 L0 -176 L5 -158" transform={`rotate(${i * 15})`} className="m-ink-stroke" />
      ))
    }
    return null
  })()

  return (
    <svg
      viewBox="-200 -200 400 400"
      width={size}
      height={size}
      className={`medallion ${still ? 'still' : ''} ${className}`}
      style={{ ['--mc' as string]: color }}
      role="img"
      aria-label={`${c.name}, medallion portrait`}
    >
      <defs>
        <radialGradient id={`ivory${uid}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fffdf7" />
          <stop offset="0.75" stopColor="#f6efe2" />
          <stop offset="1" stopColor="#ece2cf" />
        </radialGradient>
        <linearGradient id={`gold${uid}`} x1="-1" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#9b7426" />
          <stop offset="0.45" stopColor="#d9b45a" />
          <stop offset="0.5" stopColor="#fff1c4" />
          <stop offset="0.55" stopColor="#d9b45a" />
          <stop offset="1" stopColor="#9b7426" />
          {!still && <animateTransform attributeName="gradientTransform" type="translate" values="-1 0; 1 0; -1 0" dur="7s" repeatCount="indefinite" />}
        </linearGradient>
        <filter id={`soft${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#5a4320" floodOpacity="0.18" />
        </filter>
      </defs>

      <g style={{ ['--gold' as string]: `url(#gold${uid})` }}>
        {/* outer frame, by kind */}
        <g className="m-frame">{frame}</g>
        {c.royal && <circle r="178" className="m-ink-stroke thin" />}

        {/* the disc */}
        <circle r="156" fill={`url(#ivory${uid})`} filter={`url(#soft${uid})`} />
        <circle r="156" className="m-ring" />
        <circle r="146" className="m-dots" />

        {/* their unique rosette */}
        {detail && (
          <g className="m-rosette" style={{ ['--twist' as string]: `${art.twist}deg` }}>
            <path d={rosette} transform="scale(1.24)" className="m-weave" />
            <path d={rosette} transform={`scale(0.92) rotate(${180 / art.petals})`} className="m-weave faint" />
            {Array.from({ length: art.rings }, (_, i) => (
              <circle key={i} r={70 - i * 12} className="m-dots small" />
            ))}
          </g>
        )}
        {kind === 'sage' && <circle r="96" className="m-ink-stroke thin" />}

        {/* the syllable */}
        <text y="10" textAnchor="middle" dominantBaseline="middle" className="m-akshara" fill={`url(#gold${uid})`}>
          {ak}
        </text>

        {/* role motif at the foot of the ring */}
        {detail && motif !== 'none' && (
          <g transform="translate(0 128) scale(1.15)">
            <circle r="17" className="m-motif-bg" />
            <path d={MOTIF_PATH[motif]} className="m-motif" />
          </g>
        )}
      </g>
    </svg>
  )
}
