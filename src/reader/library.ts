import volumesJson from '../../content/volumes.json'
import { parseChapter, overlay, words, type Block } from './format'

export type Lang = 'en' | 'te' | 'hi'
export const LANGS: Lang[] = ['en', 'te', 'hi']
type Text = Partial<Record<Lang, string>>

export type ChapterMeta = {
  n: number
  title: Text
  sources: { book: number; sections: number[] }
  /** per language: 'draft' (machine-drafted, awaiting a native reviewer) or 'reviewed' */
  translations: Partial<Record<Lang, 'draft' | 'reviewed'>>
  painting?: { src: string; alt: string; credit: string }
  /** a small image of the chapter's scene, for lists and cards (the painting is the full-size one) */
  thumb?: { src: string; alt: string }
  dir: string
}
export type Volume = { n: number; dir: string; books: string; title: Text; blurb: Text; chapters: ChapterMeta[] }

const metas = import.meta.glob<Omit<ChapterMeta, 'dir'>>('/content/*/*/chapter.json', { eager: true, import: 'default' })
const texts = import.meta.glob<string>('/content/*/*/*.md', { query: '?raw', import: 'default' })

export const LANGUAGES = volumesJson.languages as Record<Lang, { name: string; native: string }>

export const VOLUMES: Volume[] = (volumesJson.volumes as Omit<Volume, 'chapters'>[]).map((v) => ({
  ...v,
  chapters: Object.entries(metas)
    .filter(([path]) => path.startsWith(`/content/${v.dir}/`))
    .map(([path, m]) => ({ ...m, dir: path.split('/')[3] }))
    .sort((a, b) => a.n - b.n),
}))

export const tr = (t: Text | undefined, lang: Lang) => (t?.[lang] ?? t?.en ?? '')

export const chapterOf = (vol: number, ch: number) => {
  const v = VOLUMES.find((x) => x.n === vol)
  const c = v?.chapters.find((x) => x.n === ch)
  return v && c ? { v, c } : null
}

const cache = new Map<string, Block[]>()
async function load(v: Volume, c: ChapterMeta, lang: Lang) {
  const key = `/content/${v.dir}/${c.dir}/${lang}.md`
  if (cache.has(key)) return cache.get(key)!
  const get = texts[key]
  if (!get) return null
  const blocks = parseChapter(await get())
  cache.set(key, blocks)
  return blocks
}

export type LoadedChapter = {
  blocks: (Block & { fallback?: boolean })[]
  /** the language actually shown (falls back to English where a translation does not exist yet) */
  shown: Lang
  status: 'source' | 'draft' | 'reviewed' | 'missing'
  minutes: number
}

export async function loadChapter(vol: number, ch: number, lang: Lang): Promise<LoadedChapter | null> {
  const found = chapterOf(vol, ch)
  if (!found) return null
  const { v, c } = found
  const en = await load(v, c, 'en')
  if (!en) return null
  const minutes = Math.max(1, Math.round(words(en) / 230))
  if (lang === 'en') return { blocks: en, shown: 'en', status: 'source', minutes }
  const t = await load(v, c, lang)
  if (!t) return { blocks: en, shown: 'en', status: 'missing', minutes }
  return { blocks: overlay(en, t), shown: lang, status: c.translations[lang] ?? 'draft', minutes }
}

/** Ganguli's text, section by section, on Wikisource (the 1884 edition the verifiers read). */
const WIKISOURCE_BOOK: Record<number, string> = { 1: 'Book_1:_Adi_Parva' }
export const sourceUrl = (book: number, section: number) =>
  WIKISOURCE_BOOK[book] ? `https://en.wikisource.org/wiki/The_Mahabharata/${WIKISOURCE_BOOK[book]}/Section_${section}` : null

export const BOOK_NAMES = ['', 'Adi', 'Sabha', 'Vana', 'Virata', 'Udyoga', 'Bhishma', 'Drona', 'Karna', 'Shalya', 'Sauptika', 'Stri',
  'Shanti', 'Anushasana', 'Ashvamedhika', 'Ashramavasika', 'Mausala', 'Mahaprasthanika', 'Svargarohana']

/** Where a reader is: /read, /read/1/2, /te/read/1/2 */
export type ReadRoute = { lang: Lang; vol: number | null; ch: number | null }
export function readRouteFrom(path: string): ReadRoute | null {
  const m = path.match(/^\/(?:(te|hi|en)\/)?read(?:\/(\d+)(?:\/(\d+))?)?\/?$/)
  if (!m) return null
  return { lang: (m[1] as Lang) ?? 'en', vol: m[2] ? +m[2] : null, ch: m[3] ? +m[3] : null }
}
export const readPath = (r: ReadRoute) =>
  `${r.lang === 'en' ? '' : `/${r.lang}`}/read${r.vol ? `/${r.vol}${r.ch ? `/${r.ch}` : ''}` : ''}`
