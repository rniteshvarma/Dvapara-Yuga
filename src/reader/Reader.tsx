import { AnimatePresence, m } from 'motion/react'
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DYNASTIES } from '../data/dynasties'
import type { Engine } from '../render/engine'
import type { Block, Inline, Ref } from './format'
import {
  BOOK_NAMES, LANGS, LANGUAGES, VOLUMES, chapterOf, loadChapter, sourceUrl, tr,
  type Lang, type LoadedChapter, type ReadRoute,
} from './library'
import './reader.css'

/**
 * The Volumes: the epic told chapter by chapter, with the living map beside the page.
 * As a scene scrolls into view the map flies to its people and lights them; names in the text
 * are doors to their profiles. The page sits on the left (a sheet at the foot of the screen on a phone).
 */

const UI: Record<Lang, Record<string, string>> = {
  en: {
    back: 'Back to the map', library: 'The Volumes', volume: 'Volume', chapter: 'Chapter', minutes: 'min read',
    sections: 'Sections', section: 'Section', versions: 'The versions differ', note: 'A note', next: 'Next', prev: 'Previous',
    soon: 'In preparation', start: 'Begin reading', cont: 'Continue', quote: 'Ganguli’s translation', source: 'Read this section in Ganguli’s translation',
    draft: 'This translation was drafted by machine and is waiting for a native speaker to review it.',
    missing: 'This chapter has not been translated yet, so it is shown in English.',
    intro: 'The whole Mahabharata, from King Shantanu on the banks of the Ganga to the Pandavas climbing toward heaven. Every paragraph is drawn from the text and cites its section of Ganguli’s translation.',
    chapters: 'chapters', end: 'End of the chapter',
  },
  te: {
    back: 'పటానికి తిరిగి', library: 'సంపుటాలు', volume: 'సంపుటి', chapter: 'అధ్యాయం', minutes: 'నిమిషాల పఠనం',
    sections: 'విభాగాలు', section: 'విభాగం', versions: 'కథనాలు వేరు', note: 'గమనిక', next: 'తరువాత', prev: 'మునుపటి',
    soon: 'సిద్ధమవుతోంది', start: 'చదవడం ప్రారంభించండి', cont: 'కొనసాగించండి', quote: 'గంగూలీ ఆంగ్ల అనువాదం నుండి', source: 'గంగూలీ అనువాదంలో ఈ విభాగాన్ని చదవండి',
    draft: 'ఈ అనువాదం యంత్రం ద్వారా రూపొందించబడింది; తెలుగు మాతృభాషీయుల సమీక్ష కోసం వేచి ఉంది.',
    missing: 'ఈ అధ్యాయం ఇంకా తెలుగులోకి అనువదించబడలేదు; ఆంగ్లంలో చూపిస్తున్నాము.',
    intro: 'శంతనుడి నుండి పాండవుల స్వర్గారోహణం వరకు సంపూర్ణ మహాభారతం. ప్రతి పేరా మూలగ్రంథం నుండి తీసుకోబడింది, గంగూలీ అనువాదంలోని విభాగాన్ని సూచిస్తుంది.',
    chapters: 'అధ్యాయాలు', end: 'అధ్యాయం ముగిసింది',
  },
  hi: {
    back: 'मानचित्र पर लौटें', library: 'भाग', volume: 'भाग', chapter: 'अध्याय', minutes: 'मिनट का पाठ',
    sections: 'अनुभाग', section: 'अनुभाग', versions: 'कथाएँ भिन्न हैं', note: 'टिप्पणी', next: 'अगला', prev: 'पिछला',
    soon: 'तैयार हो रहा है', start: 'पढ़ना शुरू करें', cont: 'जारी रखें', quote: 'गांगुली के अनुवाद से', source: 'गांगुली के अनुवाद में यह अनुभाग पढ़ें',
    draft: 'यह अनुवाद मशीन से तैयार किया गया है और किसी हिंदीभाषी समीक्षक की प्रतीक्षा में है।',
    missing: 'यह अध्याय अभी हिंदी में नहीं है; अंग्रेज़ी में दिखाया जा रहा है।',
    intro: 'शांतनु से लेकर पांडवों के स्वर्गारोहण तक सम्पूर्ण महाभारत। हर अनुच्छेद मूल ग्रंथ पर आधारित है और गांगुली के अनुवाद का अनुभाग बताता है।',
    chapters: 'अध्याय', end: 'अध्याय समाप्त',
  },
}

// the books' names as each language says them (more are added as their volumes are written)
const PARVA: Partial<Record<Lang, Record<number, string>>> = { te: { 1: 'ఆది పర్వం', 2: 'సభా పర్వం' }, hi: { 1: 'आदि पर्व', 2: 'सभा पर्व' } }
const parvaName = (book: number, lang: Lang) => PARVA[lang]?.[book] ?? `${BOOK_NAMES[book]} Parva`

/** A chapter's scene, small: decorative, since its title sits right beside it. */
const Thumb = ({ c, className = '' }: { c: { thumb?: { src: string; alt: string } }; className?: string }) =>
  c.thumb ? <img className={`r-thumb ${className}`} src={c.thumb.src} alt="" width={200} height={133} loading="lazy" decoding="async" draggable={false} /> : null

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']
const LAST_KEY = 'dy-read-last'
const remember = (r: ReadRoute) => { try { localStorage.setItem(LAST_KEY, JSON.stringify(r)) } catch { /* private mode */ } }
const recall = (): ReadRoute | null => { try { return JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null') } catch { return null } }

const span = (xs: number[]) => {
  const s = [...new Set(xs)].sort((a, b) => a - b)
  return s.length > 1 && s[s.length - 1] - s[0] === s.length - 1 ? `${s[0]}–${s[s.length - 1]}` : s.join(', ')
}

export default function Reader({ engine, route, onRoute, onClose, onProfile }: {
  engine: Engine
  route: ReadRoute
  onRoute: (r: ReadRoute) => void
  onClose: () => void
  onProfile: (id: string) => void
}) {
  const lang = route.lang
  const t = UI[lang]
  const panel = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // tell the map how much of the screen the page covers, so it frames people in the part left visible
  useLayoutEffect(() => {
    const measure = () => {
      const r = panel.current?.getBoundingClientRect()
      if (!r) return
      const sheet = window.innerWidth < 760
      engine.viewInset = sheet ? { left: 0, bottom: window.innerHeight - r.top } : { left: r.right, bottom: 0 }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      engine.viewInset = { left: 0, bottom: 0 }
      engine.highlightSet(null)
    }
  }, [engine])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.profile')) { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <m.div
      ref={panel}
      className={`reader lang-${lang}`}
      lang={lang}
      role="dialog"
      aria-label={t.library}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <TopBar route={route} onRoute={onRoute} onClose={onClose} scroller={scroller} />
      <div className="r-scroll" ref={scroller}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={`${route.vol}/${route.ch}/${lang}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {route.vol && route.ch
              ? <ChapterView engine={engine} route={route} onRoute={onRoute} onProfile={onProfile} scroller={scroller} />
              : <LibraryView route={route} onRoute={onRoute} />}
          </m.div>
        </AnimatePresence>
      </div>
    </m.div>
  )
}

function TopBar({ route, onRoute, onClose, scroller }: { route: ReadRoute; onRoute: (r: ReadRoute) => void; onClose: () => void; scroller: React.RefObject<HTMLDivElement | null> }) {
  const t = UI[route.lang]
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const on = () => setProgress(el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0)
    el.addEventListener('scroll', on, { passive: true })
    on()
    return () => el.removeEventListener('scroll', on)
  }, [scroller, route.vol, route.ch])
  const vol = route.vol ? VOLUMES.find((v) => v.n === route.vol) : null
  return (
    <header className="r-top">
      <button className="r-back" onClick={onClose}>
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {t.back}
      </button>
      <nav className="r-crumbs" aria-label="Where you are">
        <button onClick={() => onRoute({ ...route, vol: null, ch: null })} className={!vol ? 'here' : ''}>{t.library}</button>
        {vol && <><span aria-hidden>›</span><span className="here">{ROMAN[vol.n]} · {tr(vol.title, route.lang)}</span></>}
      </nav>
      <div className="r-langs" role="group" aria-label="Language">
        {LANGS.map((l) => (
          <button key={l} lang={l} className={l === route.lang ? 'on' : ''} aria-pressed={l === route.lang} onClick={() => onRoute({ ...route, lang: l })}>
            {l === 'en' ? 'EN' : LANGUAGES[l].native}
          </button>
        ))}
      </div>
      <i className="r-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
    </header>
  )
}

// ───────────────────────────── the library ─────────────────────────────

function LibraryView({ route, onRoute }: { route: ReadRoute; onRoute: (r: ReadRoute) => void }) {
  const lang = route.lang
  const t = UI[lang]
  const last = recall()
  const lastCh = last?.vol && last.ch ? chapterOf(last.vol, last.ch) : null
  return (
    <div className="r-library">
      <p className="r-kicker">महाभारत · Mahabharata</p>
      <h1>{t.library}</h1>
      <p className="r-lede">{t.intro}</p>
      {lastCh && (
        <button className="r-continue" onClick={() => onRoute({ lang, vol: last!.vol, ch: last!.ch })}>
          <Thumb c={lastCh.c} />
          <span className="r-cont-text">
            <span>{t.cont}</span>
            <b>{ROMAN[lastCh.v.n]}.{lastCh.c.n} · {tr(lastCh.c.title, lang)}</b>
          </span>
        </button>
      )}
      <ol className="r-volumes">
        {VOLUMES.map((v) => (
          <li key={v.n} className={v.chapters.length ? 'ready' : 'soon'}>
            <div className="r-vol-head">
              <span className="r-numeral">{ROMAN[v.n]}</span>
              <div>
                <h2>{tr(v.title, lang)}{lang !== 'hi' && v.title.hi && <span className="r-dv" lang="hi">{v.title.hi}</span>}</h2>
                <p className="r-books">{v.books}</p>
              </div>
            </div>
            <p className="r-blurb">{tr(v.blurb, lang)}</p>
            {v.chapters.length ? (
              <ol className="r-chapters">
                {v.chapters.map((c) => (
                  <li key={c.n}>
                    <button onClick={() => onRoute({ lang, vol: v.n, ch: c.n })} className={c.thumb ? 'has-thumb' : ''}>
                      <Thumb c={c} />
                      <span className="r-chtext">
                        <span className="r-chno">{t.chapter} {c.n}</span>
                        <span className="r-chtitle">{tr(c.title, lang)}</span>
                      </span>
                      <span className="r-chsrc">{BOOK_NAMES[c.sources.book]} {span(c.sources.sections)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : <p className="r-soon">{t.soon}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ───────────────────────────── a chapter ─────────────────────────────

function ChapterView({ engine, route, onRoute, onProfile, scroller }: {
  engine: Engine; route: ReadRoute; onRoute: (r: ReadRoute) => void; onProfile: (id: string) => void
  scroller: React.RefObject<HTMLDivElement | null>
}) {
  const lang = route.lang
  const t = UI[lang]
  const found = chapterOf(route.vol!, route.ch!)
  const [data, setData] = useState<LoadedChapter | null>(null)
  useEffect(() => {
    let live = true
    setData(null)
    loadChapter(route.vol!, route.ch!, lang).then((d) => {
      if (!live) return
      setData(d)
      // fetch the next chapter's text while the reader reads this one, so "next" opens at once
      const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1200))
      idle(() => { if (live && chapterOf(route.vol!, route.ch! + 1)) loadChapter(route.vol!, route.ch! + 1, lang) })
    })
    remember(route)
    scroller.current?.scrollTo({ top: 0 })
    return () => { live = false }
  }, [route.vol, route.ch, lang, scroller, route])

  // ── scenes: the last scene marker above the reading line is the one the map shows ──
  const light = useRef<string[]>([])
  const active = useRef<string | null>(null)
  const apply = useCallback((b: Extract<Block, { type: 'scene' }>) => {
    if (active.current === b.id) return
    active.current = b.id
    light.current = b.light
    engine.highlightSet(b.light.length ? new Set(b.light) : null)
    if (b.frame.length) engine.frameIds(b.frame)
  }, [engine])
  useEffect(() => {
    const el = scroller.current
    if (!el || !data) return
    active.current = null
    const scenes = data.blocks.filter((b): b is Extract<Block, { type: 'scene' }> => b.type === 'scene')
    // the markers are found once per chapter, not on every scrolled frame
    let marks: (HTMLElement | null)[] = []
    let raf = 0
    const pick = () => {
      raf = 0
      if (marks.length !== scenes.length || marks.some((m) => m && !m.isConnected)) {
        marks = scenes.map((s) => el.querySelector<HTMLElement>(`[data-scene="${s.id}"]`))
      }
      const line = el.getBoundingClientRect().top + el.clientHeight * 0.42
      let current = scenes[0]
      for (let i = 0; i < scenes.length; i++) {
        const m = marks[i]
        if (!m) continue
        if (m.getBoundingClientRect().top < line) current = scenes[i]
        else break
      }
      if (current) apply(current)
    }
    const on = () => {
      engine.quiet()
      if (!raf) raf = requestAnimationFrame(pick)
    }
    el.addEventListener('scroll', on, { passive: true })
    pick()
    return () => { el.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [data, scroller, apply, engine])

  // a name under the cursor lights on the map; leaving it restores the scene
  const peek = useCallback((id: string | null) => {
    if (id) engine.highlightSet(new Set([id, ...light.current]))
    else engine.highlightSet(light.current.length ? new Set(light.current) : null)
  }, [engine])

  if (!found) return null
  const { v, c } = found
  const prev = v.chapters.find((x) => x.n === c.n - 1)
  const next = v.chapters.find((x) => x.n === c.n + 1)
  const other = lang === 'en' ? c.title.hi : c.title.en

  return (
    <article className="r-chapter">
      {c.painting && (
        <figure className="r-painting">
          <div className="r-painting-frame"><img src={c.painting.src} alt={c.painting.alt} /></div>
          <figcaption>{c.painting.credit}</figcaption>
        </figure>
      )}
      <header className="r-head">
        <p className="r-kicker">{t.volume} {ROMAN[v.n]} · {tr(v.title, lang)}</p>
        <p className="r-chnum">{t.chapter} {c.n}</p>
        <h1>{tr(c.title, lang)}</h1>
        {other && <p className="r-alt" lang={lang === 'en' ? 'hi' : 'en'}>{other}</p>}
        <p className="r-meta">
          {parvaName(c.sources.book, lang)} · {t.sections} {span(c.sources.sections)}
          {data && <> · {data.minutes} {t.minutes}</>}
        </p>
        {data && data.status === 'draft' && <p className="r-banner">{t.draft}</p>}
        {data && data.status === 'missing' && <p className="r-banner">{t.missing}</p>}
      </header>

      {data ? (
        <div className="r-body">
          {data.blocks.map((b) => <BlockView key={b.id} b={b} engine={engine} t={t} onProfile={onProfile} peek={peek} />)}
          <p className="r-end" aria-hidden>❖</p>
        </div>
      ) : <div className="r-loading" aria-busy="true" />}

      <nav className="r-pager">
        {prev ? (
          <button onClick={() => onRoute({ ...route, ch: prev.n })}><Thumb c={prev} /><span className="r-pg-text"><span>← {t.prev}</span><b>{tr(prev.title, lang)}</b></span></button>
        ) : <span />}
        {next ? (
          <button className="next" onClick={() => onRoute({ ...route, ch: next.n })}><span className="r-pg-text"><span>{t.next} →</span><b>{tr(next.title, lang)}</b></span><Thumb c={next} /></button>
        ) : (
          <button className="next" onClick={() => onRoute({ ...route, vol: null, ch: null })}><span className="r-pg-text"><span>{t.library} →</span><b>{t.soon}</b></span></button>
        )}
      </nav>
    </article>
  )
}

function BlockView({ b, engine, t, onProfile, peek }: {
  b: Block & { fallback?: boolean }; engine: Engine; t: Record<string, string>
  onProfile: (id: string) => void; peek: (id: string | null) => void
}) {
  const text = (xs: Inline[]) => <Text xs={xs} engine={engine} onProfile={onProfile} peek={peek} />
  const fb = b.fallback ? { lang: 'en', className: 'fallback' } : {}
  switch (b.type) {
    case 'scene': return <div className="r-scene" data-scene={b.id} aria-hidden />
    case 'break': return <p className="r-break" aria-hidden>· ❖ ·</p>
    case 'p': return <p className="r-p" {...fb}>{text(b.text)}<Refs refs={b.refs} t={t} /></p>
    case 'quote': return (
      <figure className="r-quote" {...fb}>
        <blockquote>{text(b.text)}</blockquote>
        <figcaption>{b.by && <span className="r-by">{b.by}</span>}<span className="r-qsrc">{t.quote}</span><Refs refs={b.refs} t={t} /></figcaption>
      </figure>
    )
    case 'aside': return (
      <aside className={`r-aside ${b.kind}`} {...fb}>
        <p className="r-aside-k">
          {b.kind === 'versions'
            ? <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden><path d="M4 7h11M12 4l3 3-3 3M16 13H5M8 10l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
          {b.kind === 'versions' ? t.versions : t.note}
          <Refs refs={b.refs} t={t} />
        </p>
        {b.paras.map((p, i) => <p key={i}>{text(p)}</p>)}
      </aside>
    )
  }
}

function Refs({ refs, t }: { refs: Ref[]; t: Record<string, string> }) {
  if (!refs.length) return null
  return (
    <span className="r-refs">
      {refs.map((r, i) => {
        const url = sourceUrl(r.book, r.section)
        const label = `${r.book}.${r.section}`
        return url
          ? <a key={i} href={url} target="_blank" rel="noreferrer" title={`${t.source}: ${BOOK_NAMES[r.book]} Parva, ${t.section} ${r.section}`}>{label}</a>
          : <span key={i} title={`${BOOK_NAMES[r.book]} Parva, ${t.section} ${r.section}`}>{label}</span>
      })}
    </span>
  )
}

function Text({ xs, engine, onProfile, peek }: { xs: Inline[]; engine: Engine; onProfile: (id: string) => void; peek: (id: string | null) => void }) {
  return (
    <>
      {xs.map((x, i) => {
        if (x.t === 'em') return <em key={i}>{x.s}</em>
        if (x.t === 'strong') return <strong key={i}>{x.s}</strong>
        if (x.t === 'link') {
          const c = engine.graph.byId.get(x.id)
          if (!c) return <Fragment key={i}>{x.s}</Fragment>
          return (
            <button
              key={i}
              className="r-name"
              style={{ ['--c' as string]: DYNASTIES[c.dynasty].color }}
              onMouseEnter={() => peek(x.id)}
              onMouseLeave={() => peek(null)}
              onFocus={() => peek(x.id)}
              onBlur={() => peek(null)}
              onClick={() => onProfile(x.id)}
              title={`${c.name}${c.epithet ? ` · ${c.epithet}` : ''}`}
            >{x.s}</button>
          )
        }
        return <Fragment key={i}>{x.s}</Fragment>
      })}
    </>
  )
}

