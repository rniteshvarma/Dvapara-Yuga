/** The review queue of readers' corrections (reports/queue.jsonl). See reports/README.md. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const FILE = 'reports/queue.jsonl'
interface Report { at: string; status: 'open' | 'resolved' | 'rejected'; id: string; name: string; kind: string; text: string; source: string; page: string; note?: string }

const all: Report[] = existsSync(FILE) ? readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []
const [cmd, n, ...note] = process.argv.slice(2)

if (cmd === 'resolve' || cmd === 'reject') {
  const r = all[Number(n) - 1]
  if (!r) { console.error(`No report #${n}`); process.exit(1) }
  r.status = cmd === 'resolve' ? 'resolved' : 'rejected'
  r.note = note.join(' ')
  writeFileSync(FILE, all.map((x) => JSON.stringify(x)).join('\n') + '\n')
  console.log(`#${n} ${r.status}: ${r.name} — ${r.note || 'no note'}`)
} else {
  const shown = all.map((r, i) => ({ r, i: i + 1 })).filter(({ r }) => cmd === 'all' || r.status === 'open')
  if (!shown.length) console.log(all.length ? 'No open reports. 🙏' : 'No reports yet.')
  const byName = new Map<string, typeof shown>()
  for (const x of shown) byName.set(x.r.name || x.r.id, [...(byName.get(x.r.name || x.r.id) ?? []), x])
  for (const [name, xs] of byName) {
    console.log(`\n${name}  (${xs[0].r.page})`)
    for (const { r, i } of xs) {
      console.log(`  #${i} [${r.status}] ${r.kind} · ${r.at.slice(0, 10)}`)
      console.log(`     ${r.text.replace(/\n/g, '\n     ')}`)
      if (r.source) console.log(`     source: ${r.source}`)
      if (r.note) console.log(`     note: ${r.note}`)
    }
  }
}
