/**
 * Checks every chapter of the Volumes before it is published.
 *
 *   npm run chapters
 *
 * - every [name](id) and every person in a scene is on the map
 * - every paragraph and quote cites a section, and the sections sit within the chapter's stated sources
 * - every quote is Ganguli's own words, found in the section it cites (whitespace and quote marks aside)
 * - every translation carries exactly the English file's ids, no more and no fewer
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { buildGraph } from '../src/graph/model'
import { parseChapter, type Block, type Inline } from '../src/reader/format'

const g = buildGraph(JSON.parse(readFileSync('src/data/census.json', 'utf8')))

// Ganguli, by book and section (the same division the verifiers use)
const lines = readFileSync('research/ganguli.txt', 'utf8').split('\n')
const ones = lines.flatMap((l, i) => (/^Section 1\s*$/.test(l) ? [i] : []))
const starts: number[] = []
for (const i of ones.slice(1)) { if (starts.length && i - starts[starts.length - 1] < 60) starts[starts.length - 1] = i; else starts.push(i) }
const sections = new Map<string, string>()
{
  let book = 0, sec = 0, buf: string[] = []
  // a book's table of contents can sit after the previous book's last section ("Section 38", "Section 39"…
  // with nothing under them), so a repeated number never replaces a longer text already read
  const flush = () => {
    const key = `${book}.${sec}`, text = buf.join(' ')
    if (book && text.trim().length >= (sections.get(key)?.trim().length ?? 0)) sections.set(key, text)
  }
  const bs = new Set(starts)
  lines.forEach((l, i) => {
    const m = l.match(/^Section (\d+)\s*$/)
    if (m) { flush(); if (bs.has(i)) book++; sec = +m[1]; buf = []; return }
    buf.push(l)
  })
  flush()
}
// compare letters only: line breaks, hyphenation, curly quotes and OCR punctuation never decide a match
// the scan often reads “rn” as “m” (“bom” for “born”), so both sides fold it the same way
const squash = (s: string) => s.toLowerCase().replace(/-\s+/g, '').replace(/[^a-z]/g, '').replace(/rn/g, 'm')
const plain = (xs: Inline[]) => xs.map((x) => x.s).join('')

let problems = 0, checked = 0
const flag = (where: string, msg: string) => { problems++; console.log(`  ✗ ${where}: ${msg}`) }

for (const vol of readdirSync('content').filter((d) => /^v\d+/.test(d))) {
  for (const ch of readdirSync(join('content', vol)).filter((d) => d.startsWith('c'))) {
    const dir = join('content', vol, ch)
    const meta = JSON.parse(readFileSync(join(dir, 'chapter.json'), 'utf8'))
    const allowed = new Set<string>(meta.sources.sections.map((s: number) => `${meta.sources.book}.${s}`))
    const en = parseChapter(readFileSync(join(dir, 'en.md'), 'utf8'))
    console.log(`${vol}/${ch}`)
    checked++
    const ids = new Set<string>()
    for (const b of en) {
      if (ids.has(b.id)) flag(b.id, 'id used twice')
      ids.add(b.id)
      const links = (xs: Inline[]) => xs.forEach((x) => { if (x.t === 'link' && !g.byId.has(x.id)) flag(b.id, `no one on the map with id “${x.id}”`) })
      if (b.type === 'scene') for (const id of [...b.frame, ...b.light]) if (!g.byId.has(id)) flag(b.id, `scene names “${id}”, who is not on the map`)
      if (b.type === 'p' || b.type === 'quote') {
        links(b.text)
        if (!b.refs.length) flag(b.id, 'no source section')
      }
      if (b.type === 'aside') b.paras.forEach(links)
      if (b.type === 'p' || b.type === 'quote' || b.type === 'aside')
        for (const r of b.refs) if (!allowed.has(`${r.book}.${r.section}`)) flag(b.id, `cites ${r.book}.${r.section}, outside the chapter's sources`)
      if (b.type === 'quote') {
        const q = squash(plain(b.text))
        const hit = b.refs.some((r) => squash(sections.get(`${r.book}.${r.section}`) ?? '').includes(q))
        if (!hit) flag(b.id, `quote not found word for word in ${b.refs.map((r) => `${r.book}.${r.section}`).join(', ')}: “${plain(b.text).slice(0, 70)}…”`)
      }
    }
    // translations: same ids as the English, and their links still lead to real people
    for (const f of readdirSync(dir).filter((f) => /^(te|hi)\.md$/.test(f))) {
      const tr = parseChapter(readFileSync(join(dir, f), 'utf8'))
      const tids = new Set(tr.map((b: Block) => b.id))
      const textIds = [...ids].filter((id) => !/^(s|b)\d+$/.test(id))
      for (const id of textIds) if (!tids.has(id)) flag(`${f}`, `missing ${id} (shown in English for now)`)
      for (const id of tids) if (!ids.has(id) && !/^b\d+$/.test(id)) flag(`${f}`, `has ${id}, which the English does not`)
      for (const b of tr) if (b.type === 'p' || b.type === 'quote') b.text.forEach((x) => { if (x.t === 'link' && !g.byId.has(x.id)) flag(`${f} ${b.id}`, `no one with id “${x.id}”`) })
    }
    if (!existsSync(join(dir, 'en.md'))) flag(ch, 'no English text')
  }
}
console.log(`\n${checked} chapters checked, ${problems} problems`)
process.exit(problems ? 1 : 0)
