import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Character } from '../data/types'

const KINDS = [
  ['relationship', 'A family link'],
  ['name', 'A name or spelling'],
  ['fact', 'A fact in the description'],
  ['story', 'A story or event'],
  ['source', 'A source or citation'],
  ['other', 'Something else'],
] as const

/**
 * “Report an error”: a reader's correction goes to the review queue (reports/queue.jsonl, read with
 * `npm run reports`). If the queue can't be reached, the report can still be copied and sent by hand.
 */
export function Report({ c }: { c: Character }) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<string>('relationship')
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const area = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (open) { setState('idle'); setTimeout(() => area.current?.focus(), 60) } }, [open])
  useEffect(() => { setOpen(false); setText(''); setSource('') }, [c.id])

  const payload = () => ({ id: c.id, name: c.name, kind, text, source, page: location.pathname })
  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setState('sending')
    try {
      const r = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) })
      if (!r.ok) throw new Error(String(r.status))
      setState('sent')
      setText('')
      setSource('')
    } catch {
      setState('failed')
    }
  }
  const copy = () => navigator.clipboard?.writeText(JSON.stringify(payload(), null, 2)).catch(() => undefined)

  return (
    <section className="pf-report">
      {!open && state !== 'sent' && (
        <button className="pf-report-open" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M4 17V3m0 1h10l-2 3.5L14 11H4" /></svg>
          Report an error
        </button>
      )}
      {state === 'sent' && !open && <p className="pf-report-thanks">Thank you — your correction is in the review queue.</p>}
      <AnimatePresence>
        {open && (
          <m.form
            className="pf-report-form"
            onSubmit={send}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="pf-side-h">Report an error about {c.name}</h3>
            <label>
              <span>What is wrong?</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>
              <span>What should it say?</span>
              <textarea ref={area} value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={4000} required
                placeholder="e.g. Gandhari was Dhritarashtra’s wife, not Krishna’s" />
            </label>
            <label>
              <span>Where does the epic say so? <em>optional</em></span>
              <input value={source} onChange={(e) => setSource(e.target.value)} maxLength={600} placeholder="Book and section, or a link" />
            </label>
            <div className="pf-report-actions">
              <button type="button" className="pf-link" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="profile-cta" disabled={!text.trim() || state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send'}</button>
            </div>
            {state === 'failed' && (
              <p className="pf-report-fail">The review queue could not be reached. <button type="button" onClick={copy}>Copy the report</button> to send it by hand.</p>
            )}
            {state === 'sent' && <p className="pf-report-thanks">Thank you — your correction is in the review queue.</p>}
          </m.form>
        )}
      </AnimatePresence>
    </section>
  )
}
