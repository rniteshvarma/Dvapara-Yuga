/**
 * “Yada yada hi dharmasya”, sung once as the site opens, and again whenever the visitor asks.
 *
 * One player for the whole visit, so moving between the tree and a profile never restarts it.
 * It plays by itself once per browser session (a new tab or window is a new session). Browsers
 * refuse sound until the visitor has touched the page, so if the first attempt is refused it waits
 * for their first click or key press and plays then.
 */
const SRC = '/audio/yada-yadahi.mp3'
const SESSION_KEY = 'dy-anthem-played'
const VOLUME = 0.85

export type AnthemState = { playing: boolean; progress: number }

let audio: HTMLAudioElement | null = null
let state: AnthemState = { playing: false, progress: 0 }
const listeners = new Set<(s: AnthemState) => void>()
let fade = 0

function set(next: Partial<AnthemState>) {
  state = { ...state, ...next }
  for (const fn of listeners) fn(state)
}

function player() {
  if (audio) return audio
  audio = new Audio(SRC)
  audio.preload = 'auto'
  audio.addEventListener('play', () => set({ playing: true }))
  audio.addEventListener('pause', () => set({ playing: false }))
  audio.addEventListener('ended', () => { audio!.currentTime = 0; set({ playing: false, progress: 0 }) })
  audio.addEventListener('timeupdate', () => set({ progress: audio!.duration ? audio!.currentTime / audio!.duration : 0 }))
  return audio
}

const markPlayed = () => { try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ } }
const playedThisSession = () => { try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false } }

/** Start from wherever it was, rising gently rather than arriving at full volume. */
async function start() {
  const a = player()
  cancelAnimationFrame(fade)
  a.volume = 0
  await a.play()
  markPlayed()
  const t0 = performance.now()
  const rise = () => {
    const k = Math.min(1, (performance.now() - t0) / 1200)
    a.volume = VOLUME * k
    if (k < 1) fade = requestAnimationFrame(rise)
  }
  fade = requestAnimationFrame(rise)
}

export function toggleAnthem() {
  const a = player()
  if (a.paused) start().catch(() => { /* the browser said no; the button stays ready */ })
  else a.pause()
}

export function onAnthem(fn: (s: AnthemState) => void) {
  listeners.add(fn)
  fn(state)
  return () => { listeners.delete(fn) }
}

/** Called once when the site opens: plays the first time in a session, and never again until the next. */
export function playOnArrival() {
  if (playedThisSession()) return
  start().catch(() => {
    // no sound before the visitor touches the page: begin at their first click or key press
    const go = (e: Event) => {
      // a press on the button itself is left to the button
      if ((e.target as Element | null)?.closest?.('.anthem-trigger')) { off(); return }
      off()
      if (!playedThisSession() && player().paused) start().catch(() => {})
    }
    const off = () => {
      window.removeEventListener('pointerdown', go, true)
      window.removeEventListener('keydown', go, true)
      window.removeEventListener('touchend', go, true)
    }
    window.addEventListener('pointerdown', go, true)
    window.addEventListener('keydown', go, true)
    window.addEventListener('touchend', go, true)
  })
}
