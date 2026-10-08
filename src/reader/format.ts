/**
 * The chapter format: a small, strict Markdown, so a chapter stays easy to write and to translate.
 *
 *   ::scene{#s2 frame=ganga,prabhasa light=prabhasa}     the map frames these people and lights those
 *   A paragraph with a [name](character-id) and *emphasis*. {#p6 1.96}      id, then Ganguli book.section
 *   > Words quoted exactly from Ganguli. {#q1 1.96}
 *   > — Brahma                                                              who speaks them
 *   ::aside{#a1 kind=versions src=1.96,1.99}  …  ::            a boxed note: versions differ, or a note
 *   ***                                                                     a pause in the chapter
 *
 * Every block carries an id. A translation repeats the ids with its own words; the English file alone
 * decides the order, the scenes and the sources, so no language can drift from another.
 */
export type Ref = { book: number; section: number }
export type Inline = { t: 'text' | 'em' | 'strong'; s: string } | { t: 'link'; s: string; id: string }

export type Block =
  | { type: 'scene'; id: string; frame: string[]; light: string[] }
  | { type: 'p'; id: string; refs: Ref[]; text: Inline[] }
  | { type: 'quote'; id: string; refs: Ref[]; text: Inline[]; by?: string }
  | { type: 'aside'; id: string; kind: 'versions' | 'note'; refs: Ref[]; paras: Inline[][] }
  | { type: 'break'; id: string }

const ATTR = /\s*\{#([\w-]+)((?:\s+[^}]*)?)\}\s*$/

function refsOf(tokens: string[]): Ref[] {
  return tokens.filter((t) => /^\d+\.\d+$/.test(t)).map((t) => { const [b, s] = t.split('.').map(Number); return { book: b, section: s } })
}

function directive(line: string) {
  const m = line.match(/^::(\w+)\{#([\w-]+)([^}]*)\}\s*$/)
  if (!m) return null
  const kv: Record<string, string> = {}
  for (const part of m[3].trim().split(/\s+/).filter(Boolean)) {
    const [k, v = ''] = part.split('=')
    kv[k] = v
  }
  return { name: m[1], id: m[2], kv }
}

/** *em*, **strong** and [text](id), nothing more. */
export function inline(src: string): Inline[] {
  const out: Inline[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([\w-]+)\)/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: 'text', s: src.slice(last, m.index) })
    if (m[1]) out.push({ t: 'strong', s: m[1] })
    else if (m[2]) out.push({ t: 'em', s: m[2] })
    else out.push({ t: 'link', s: m[3], id: m[4] })
    last = re.lastIndex
  }
  if (last < src.length) out.push({ t: 'text', s: src.slice(last) })
  return out
}

export function parseChapter(md: string): Block[] {
  const lines = md.replace(/\r/g, '').split('\n')
  const blocks: Block[] = []
  let i = 0, breaks = 0
  const para = (text: string) => {
    const m = text.match(ATTR)
    if (!m) throw new Error(`A paragraph needs an id, like {#p1 1.96}: “${text.slice(0, 60)}…”`)
    return { id: m[1], refs: refsOf(m[2].trim().split(/\s+/)), body: text.slice(0, m.index).trim() }
  }
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }
    if (line === '***') { blocks.push({ type: 'break', id: `b${++breaks}` }); i++; continue }
    const d = directive(line)
    if (d?.name === 'scene') {
      const list = (v?: string) => (v ? v.split(',').filter(Boolean) : [])
      blocks.push({ type: 'scene', id: d.id, frame: list(d.kv.frame), light: list(d.kv.light) })
      i++
      continue
    }
    if (d?.name === 'aside') {
      const body: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '::') body.push(lines[i++])
      i++
      const paras = body.join('\n').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
      blocks.push({ type: 'aside', id: d.id, kind: d.kv.kind === 'versions' ? 'versions' : 'note', refs: refsOf((d.kv.src ?? '').split(',')), paras: paras.map(inline) })
      continue
    }
    if (line.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) q.push(lines[i++].trim().replace(/^>\s?/, ''))
      const byLine = q.length > 1 && /^[—–-]\s/.test(q[q.length - 1]) ? q.pop()!.replace(/^[—–-]\s*/, '') : undefined
      const p = para(q.join(' '))
      blocks.push({ type: 'quote', id: p.id, refs: p.refs, text: inline(p.body), by: byLine })
      continue
    }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('::') && !lines[i].trim().startsWith('>') && lines[i].trim() !== '***') buf.push(lines[i++].trim())
    const p = para(buf.join(' '))
    blocks.push({ type: 'p', id: p.id, refs: p.refs, text: inline(p.body) })
  }
  return blocks
}

/**
 * Lay a translation over the English: same blocks, same order, same scenes and sources, its own words.
 * A block the translation has not reached yet stays in English and says so.
 */
export function overlay(source: Block[], translation: Block[]): (Block & { fallback?: boolean })[] {
  const by = new Map(translation.map((b) => [b.id, b]))
  return source.map((b) => {
    const t = by.get(b.id)
    if (b.type === 'p' && t?.type === 'p') return { ...b, text: t.text }
    if (b.type === 'quote' && t?.type === 'quote') return { ...b, text: t.text, by: t.by ?? b.by }
    if (b.type === 'aside' && t?.type === 'aside') return { ...b, paras: t.paras }
    if (b.type === 'p' || b.type === 'quote' || b.type === 'aside') return { ...b, fallback: true }
    return b
  })
}

export const words = (blocks: Block[]) =>
  blocks.reduce((n, b) => {
    const count = (xs: Inline[]) => xs.reduce((k, x) => k + x.s.split(/\s+/).filter(Boolean).length, 0)
    if (b.type === 'p' || b.type === 'quote') return n + count(b.text)
    if (b.type === 'aside') return n + b.paras.reduce((k, p) => k + count(p), 0)
    return n
  }, 0)
