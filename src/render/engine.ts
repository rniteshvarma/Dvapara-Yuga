import { DYNASTIES, STORY_KIND, TRADITION } from '../data/dynasties'
import type { CensusData } from '../data/census'
import type { Character, DynastyKey, StoryMoment } from '../data/types'
import { bez, buildDrawEdges, computeLayout, NODE_RADIUS, STYLE, yOfGen, type DrawEdge, type Layout, type Vec } from '../graph/layout'
import { buildGraph, lineageOf, type Graph } from '../graph/model'
import { Camera } from './camera'
import { DUST_FS, DUST_VS, EDGE_FS, EDGE_VS, FULLSCREEN_VS, NODE_FS, NODE_VS, SKY_FS, STORY_FS, STORY_VS } from './shaders'

export type Lens = 'lineage' | 'stories'

interface Arc {
  m: StoryMoment
  p: [Vec, Vec, Vec, Vec]
}

const MAX_ARCS = 14

/**
 * Zoom feel: one wheel notch (deltaY ≈ 100) zooms exactly as far as one press of + / −,
 * and a single short pinch (≈ 25 units of travel) does the same.
 */
const ZOOM_WHEEL = Math.LN2 / 100
const ZOOM_PINCH = Math.LN2 / 25
/** the largest jump one wheel event may cause, so a hard flick never teleports */
const MAX_EVENT_ZOOM = 2.2
export const ZOOM_STEP = 2

export interface EngineEvents {
  hover: string | null
  lens: Lens
  canon: boolean
  /** how the person is steering: a trackpad or a mouse wheel */
  input: 'trackpad' | 'mouse'
  /** a story arc was clicked on the canvas */
  moment: string
  /** the story arc under the cursor changed */
  arc: string | null
  select: string | null
  frame: number
  intro: boolean
  zoom: number
  /** Enter on a chosen person: open their profile */
  open: string
  /** a sentence for screen readers */
  announce: string
}

const KIND_CODE: Record<Character['kind'], number> = { mortal: 0, divine: 1, sage: 2, naga: 3, asura: 4, apsara: 5, gap: 6 }
const MIN_PX: Record<Character['tier'], number> = { 1: 3.6, 2: 2.8, 3: 2.2, 4: 1.5 }
/** zoom at which each tier's names begin to surface */
const LABEL_ZOOM: Record<Character["tier"], number> = { 1: 0.055, 2: 0.42, 3: 0.85, 4: 2.3 }

export const ERAS = [
  { from: 0, to: 4.9, title: 'Devaloka', dv: 'देवलोक', sub: 'The celestial origins' },
  { from: 5, to: 22.9, title: 'Chandravamsha', dv: 'चन्द्रवंश', sub: 'The Lunar Dynasty' },
  { from: 23, to: 31.9, title: 'The House of Kuru', dv: 'कुरुवंश', sub: 'From Kuru to Bhishma' },
  { from: 32, to: 34.9, title: 'Kurukshetra', dv: 'कुरुक्षेत्र', sub: 'The generation of the war' },
  { from: 35, to: 38, title: 'After the War', dv: 'कलियुग', sub: 'The last kings and the first telling' },
]

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error')
    return s
  }
  const p = gl.createProgram()!
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs))
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error')
  const uni = new Map<string, WebGLUniformLocation | null>()
  return {
    p,
    u: (name: string) => {
      if (!uni.has(name)) uni.set(name, gl.getUniformLocation(p, name))
      return uni.get(name)!
    },
  }
}

/** Per-element animated state, uploaded to a small RGBA texture every frame. */
class StateTex {
  cur: Float32Array
  tgt: Float32Array
  start: Float32Array
  bytes: Uint8Array
  tex: WebGLTexture
  w: number
  h: number
  constructor(private gl: WebGL2RenderingContext, readonly count: number) {
    this.cur = new Float32Array(count * 4)
    this.tgt = new Float32Array(count * 4)
    this.start = new Float32Array(count * 4)
    this.w = Math.min(1024, Math.max(1, count))
    this.h = Math.ceil(count / 1024)
    this.bytes = new Uint8Array(this.w * this.h * 4)
    this.tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.w, this.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.bytes)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }
  set(i: number, ch: number, v: number, at = 0) {
    this.tgt[i * 4 + ch] = v
    this.start[i * 4 + ch] = at
  }
  step(now: number, dt: number, rates: [number, number, number, number]) {
    const { cur, tgt, start, bytes } = this
    for (let i = 0; i < cur.length; i++) {
      if (now >= start[i]) {
        const k = 1 - Math.exp(-dt * rates[i & 3])
        cur[i] += (tgt[i] - cur[i]) * k
      }
      bytes[i] = Math.max(0, Math.min(255, Math.round(cur[i] * 255)))
    }
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.w, this.h, gl.RGBA, gl.UNSIGNED_BYTE, bytes)
  }
}

interface LabelEl {
  el: HTMLDivElement | null
  shown: boolean
  opacity: number
  w: number
}

export class Engine {
  readonly graph: Graph
  readonly layout: Layout
  readonly edges: DrawEdge[]
  readonly cam = new Camera()

  private gl: WebGL2RenderingContext
  private dpr = 1
  private progs!: Record<'sky' | 'dust' | 'edge' | 'node' | 'story', ReturnType<typeof compile>>
  private vaos!: Record<'sky' | 'dust' | 'edge' | 'node' | 'story', WebGLVertexArrayObject>
  private edgeIndexCount = 0
  private nodeState!: StateTex
  private edgeState!: StateTex
  private raf = 0
  private time = 0
  private last = 0
  private motion = 1

  // interaction
  private mouse = { x: -1e4, y: -1e4, inside: false }
  private energy = 0
  private pointers = new Map<number, { x: number; y: number }>()
  private press: { x: number; y: number; moved: boolean; t: number } | null = null
  private trail: { x: number; y: number; t: number }[] = []
  private pinch: { d: number; mx: number; my: number } | null = null
  hovered: string | null = null
  selected: string | null = null
  dynastyFocus: DynastyKey | null = null

  // story layer
  lens: Lens = 'lineage'
  canonOnly = false
  private storyBuf!: WebGLBuffer
  private storyIdx!: WebGLBuffer
  private storyIndexCount = 0
  private arcs: Arc[] = []
  private arcFocus: string | null = null
  private arcT0 = 0
  private canvasArc = -1
  private panelMoment: string | null = null
  private pinnedMoment: string | null = null
  private highlightKey = ''

  // intro
  private intro = { active: true, p: 0, delay: 1.1, dur: 5.6, rush: false, start: performance.now() }
  private introCam!: { from: { x: number; y: number; z: number }; to: { x: number; y: number; z: number } }

  // labels
  private labels: LabelEl[] = []
  private eraEls: HTMLDivElement[] = []
  private nodePosArr: Vec[] = []
  private yNorm: Float32Array
  private edgeY: Float32Array

  private listeners: { [K in keyof EngineEvents]: Set<(v: EngineEvents[K]) => void> } = {
    hover: new Set(), select: new Set(), frame: new Set(), intro: new Set(), zoom: new Set(),
    lens: new Set(), canon: new Set(), moment: new Set(), arc: new Set(), input: new Set(), open: new Set(), announce: new Set(),
  }

  constructor(private canvas: HTMLCanvasElement, private labelLayer: HTMLDivElement, census?: CensusData) {
    const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: false })
    if (!gl) throw new Error('WebGL2 is not available in this browser.')
    this.gl = gl
    this.motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1

    this.graph = buildGraph(census)
    this.layout = computeLayout(this.graph)
    this.edges = buildDrawEdges(this.graph, this.layout)
    this.nodePosArr = this.graph.chars.map((c) => this.layout.pos.get(c.id)!)

    const { minY, maxY } = this.layout.bounds
    this.yNorm = new Float32Array(this.nodePosArr.map((p) => (p.y - minY) / (maxY - minY)))
    this.edgeY = new Float32Array(this.edges.length * 2)
    this.edges.forEach((e, i) => {
      this.edgeY[i * 2] = (Math.min(e.p0.y, e.p3.y) - minY) / (maxY - minY)
      this.edgeY[i * 2 + 1] = (Math.max(e.p0.y, e.p3.y) - minY) / (maxY - minY)
    })

    this.initGL()
    this.initLabels()
    this.resize()
    this.setupIntroCamera()
    if (!this.motion) this.finishIntro()
    this.bindInput()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  // ───────────────────────────── public API ─────────────────────────────

  on<K extends keyof EngineEvents>(ev: K, fn: (v: EngineEvents[K]) => void) {
    this.listeners[ev].add(fn)
    return () => {
      this.listeners[ev].delete(fn)
    }
  }

  screenOf(id: string): { x: number; y: number; r: number } | null {
    const i = this.graph.index.get(id)
    if (i === undefined) return null
    const p = this.nodePosArr[i]
    const [x, y] = this.cam.toScreen(p.x, p.y)
    return { x, y, r: this.radiusPx(i) }
  }

  select(id: string | null, fly = true) {
    this.selected = id
    if (id) this.setFocus = null                    // choosing someone ends a lit path
    this.refreshHighlight()
    this.emit('select', id)
    if (id && fly) this.focusOn(id)
  }

  focusOn(id: string) {
    const i = this.graph.index.get(id)
    if (i === undefined) return
    if (this.lens === 'stories' && this.arcs.length) return this.frameArcs()
    const p = this.nodePosArr[i]
    const c = this.graph.chars[i]
    const z = Math.max(this.cam.zoom, c.cluster || c.group ? 2.4 : c.island ? 1.6 : 1.25)
    // the story card docks on the right; centre the medallion in the space beside it
    const shift = this.cam.w >= 720 ? 195 / z : 0
    const lift = this.cam.w < 720 ? this.cam.h * 0.22 / z : 0
    this.cam.flyTo(p.x + shift, p.y + lift, z)
  }

  /** The zoomed-out overview. Phones frame the central trunk at a readable scale. */
  restingView() {
    let { minX, maxX, minY, maxY } = this.layout.treeBounds
    // wide screens open on the whole orrery — the river with its constellations beside it
    if (this.cam.w / this.cam.h >= 1.25 && this.layout.groups.length) {
      for (const g of this.layout.groups) {
        minX = Math.min(minX, g.center.x - g.radius - 60)
        maxX = Math.max(maxX, g.center.x + g.radius + 60)
        minY = Math.min(minY, g.center.y - g.radius - 60)
        maxY = Math.max(maxY, g.center.y + g.radius + 220)
      }
    }
    const pad = 140
    const z = Math.min(this.cam.w / (maxX - minX + pad * 2), (this.cam.h - 150) / (maxY - minY + pad * 2))
    if (this.cam.w < 720) {
      const trunk = this.layout.pos.get('shantanu')!
      return { x: trunk.x, y: (minY + maxY) / 2 + 300, z: z * 2.2 }
    }
    // a little extra room at the top for the wordmark and lenses
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 - 30 / z, z }
  }

  fit(animate = true) {
    const v = this.restingView()
    if (animate) this.cam.flyTo(v.x, v.y, v.z, 1.2)
    else this.cam.set(v.x, v.y, v.z)
  }

  // ───────────────────────────── story layer API ─────────────────────────────

  setLens(l: Lens) {
    if (l === this.lens) return
    this.lens = l
    this.panelMoment = null
    this.pinnedMoment = null
    this.highlightKey = ''
    this.refreshHighlight()
    this.emit('lens', l)
    if (this.selected) this.focusOn(this.selected)
  }

  setCanonOnly(on: boolean) {
    this.canonOnly = on
    this.arcFocus = '\u0000'
    this.highlightKey = ''
    this.refreshHighlight()
    this.emit('canon', on)
  }

  /** Every story moment a character takes part in, strongest first. */
  momentsOf(id: string): StoryMoment[] {
    return this.graph.stories.filter((m) => (m.from === id || m.to === id) && (!this.canonOnly || TRADITION[m.trad].canon))
      .sort((a, b) => b.weight - a.weight)
  }

  storyCount(id: string) {
    return this.momentsOf(id).length
  }

  moment(id: string) {
    return this.graph.stories.find((m) => m.id === id) ?? null
  }

  /** Keep one moment's arc lit while it is open in the panel. */
  pinMoment(id: string | null) {
    this.pinnedMoment = id
    if (id && !this.arcs.some((a) => a.m.id === id)) this.buildArcs(this.arcFocus, id)
    this.syncArcHover()
  }

  /** Highlight one arc from outside the canvas (the story panel). */
  hoverMoment(id: string | null) {
    this.panelMoment = id
    if (id && !this.arcs.some((a) => a.m.id === id)) this.buildArcs(this.arcFocus, id)
    this.syncArcHover()
  }

  /** Frame both people in a story moment, leaving room for the panel. */
  frameMoment(id: string) {
    const m = this.moment(id)
    if (!m) return
    const a = this.layout.pos.get(m.from)!, b = this.layout.pos.get(m.to)!
    const side = this.cam.w >= 720 ? 400 : 0
    const W = this.cam.w - side - 160, H = this.cam.h - (this.cam.w >= 720 ? 220 : this.cam.h * 0.5)
    const z = Math.max(this.cam.minZoom, Math.min(1.6, W / (Math.abs(a.x - b.x) + 200), H / (Math.abs(a.y - b.y) + 360)))
    const cx = (a.x + b.x) / 2 + side / 2 / z
    const cy = (a.y + b.y) / 2 - 80 / z + (this.cam.w < 720 ? this.cam.h * 0.22 / z : 0)
    this.cam.flyTo(cx, cy, z, 1.2)
  }

  /** Frame a focused character together with everyone their arcs reach. */
  frameArcs() {
    const pts: Vec[] = []
    for (const a of this.arcs) pts.push(a.p[0], a.p[3], bez(a.p[0], a.p[1], a.p[2], a.p[3], 0.5))
    if (!pts.length) return
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const wide = this.cam.w >= 720
    const W = this.cam.w - (wide ? 420 : 0) - 120
    const H = wide ? this.cam.h - 220 : this.cam.h * 0.42
    const z = Math.max(this.cam.minZoom, Math.min(1.5, W / (maxX - minX + 120), H / (maxY - minY + 160)))
    const cx = (minX + maxX) / 2 + (wide ? 210 / z : 0)
    const cy = (minY + maxY) / 2 + (wide ? 10 / z : this.cam.h * 0.2 / z)
    this.cam.flyTo(cx, cy, z, 1.3)
  }

  flyToCharacter(id: string) {
    const p = this.layout.pos.get(id)
    if (p) this.cam.flyTo(p.x + (this.cam.w >= 720 ? 195 / Math.max(this.cam.zoom, 0.9) : 0), p.y, Math.max(this.cam.zoom, 0.9), 1.1)
  }

  /** The people a focused character's story arcs reach, with the colour of their strongest bond. */
  arcPartners(): { id: string; color: string; title: string }[] {
    const seen = new Map<string, { id: string; color: string; title: string }>()
    for (const a of this.arcs) {
      const other = a.m.from === this.arcFocus ? a.m.to : a.m.from
      if (!seen.has(other)) seen.set(other, { id: other, color: STORY_KIND[a.m.kind].color, title: a.m.title })
    }
    return [...seen.values()]
  }

  inputMode: 'trackpad' | 'mouse' | null = null
  private setInputMode(m: 'trackpad' | 'mouse') {
    if (m === this.inputMode) return
    this.inputMode = m
    this.emit('input', m)
  }

  zoomBy(f: number) {
    this.cam.zoomAt(this.cam.w / 2, this.cam.h / 2, f)
  }

  highlightDynasty(d: DynastyKey | null) {
    this.dynastyFocus = d
    this.refreshHighlight()
  }

  skipIntro() {
    if (!this.intro.active || this.intro.rush) return
    this.intro.rush = true
    const { to } = this.introCam
    this.cam.flyTo(to.x, to.y, to.z, 1.1)
  }

  get introActive() {
    return this.intro.active
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.unbind?.()
    this.labelLayer.innerHTML = ''
  }

  // ───────────────────────────── setup ─────────────────────────────

  private initGL() {
    const gl = this.gl
    this.progs = {
      sky: compile(gl, FULLSCREEN_VS, SKY_FS),
      dust: compile(gl, DUST_VS, DUST_FS),
      edge: compile(gl, EDGE_VS, EDGE_FS),
      node: compile(gl, NODE_VS, NODE_FS),
      story: compile(gl, STORY_VS, STORY_FS),
    }

    const attr = (prog: WebGLProgram, name: string, size: number, stride: number, offset: number, divisor = 0) => {
      const loc = gl.getAttribLocation(prog, name)
      if (loc < 0) return
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4)
      gl.vertexAttribDivisor(loc, divisor)
    }

    // sky
    const sky = gl.createVertexArray()!

    // quad shared by instanced passes
    const quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    // dust
    const dust = gl.createVertexArray()!
    gl.bindVertexArray(dust)
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    attr(this.progs.dust.p, 'a_quad', 2, 2, 0)
    const DUST = 170
    const ds = new Float32Array(DUST * 4)
    for (let i = 0; i < DUST; i++) {
      ds[i * 4] = Math.random()
      ds[i * 4 + 1] = Math.random()
      ds[i * 4 + 2] = Math.random()
      ds[i * 4 + 3] = Math.random()
    }
    const dbuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, dbuf)
    gl.bufferData(gl.ARRAY_BUFFER, ds, gl.STATIC_DRAW)
    attr(this.progs.dust.p, 'a_seed', 4, 4, 0, 1)

    // threads: a triangle strip per thread, sampled along its bezier
    const verts: number[] = []
    const idx: number[] = []
    const STRIDE = 15
    this.edges.forEach((e, eid) => {
      const approx = Math.hypot(e.p3.x - e.p0.x, e.p3.y - e.p0.y)
      const N = Math.max(14, Math.min(120, Math.round(approx / 26)))
      const pts: Vec[] = []
      for (let k = 0; k <= N; k++) pts.push(bez(e.p0, e.p1, e.p2, e.p3, k / N))
      const s = [0]
      for (let k = 1; k <= N; k++) s[k] = s[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y)
      const len = s[N]
      const [r, g, b] = hexToRgb(e.color)
      const seed = Math.random()
      const style = e.style + (e.faint ? 10 : 0)
      const base = verts.length / STRIDE
      for (let k = 0; k <= N; k++) {
        const a = pts[Math.max(0, k - 1)], c = pts[Math.min(N, k + 1)]
        let tx = c.x - a.x, ty = c.y - a.y
        const tl = Math.hypot(tx, ty) || 1
        tx /= tl; ty /= tl
        for (const side of [-1, 1]) {
          verts.push(pts[k].x, pts[k].y, -ty, tx, s[k], k / N, side, eid, len, style, r, g, b, seed, 0)
        }
        if (k < N) {
          const i0 = base + k * 2
          idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2)
        }
      }
    })
    const edge = gl.createVertexArray()!
    gl.bindVertexArray(edge)
    const ebuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, ebuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
    const ep = this.progs.edge.p
    attr(ep, 'a_pos', 2, STRIDE, 0)
    attr(ep, 'a_nrm', 2, STRIDE, 2)
    attr(ep, 'a_s', 1, STRIDE, 4)
    attr(ep, 'a_t', 1, STRIDE, 5)
    attr(ep, 'a_side', 1, STRIDE, 6)
    attr(ep, 'a_eid', 1, STRIDE, 7)
    attr(ep, 'a_len', 1, STRIDE, 8)
    attr(ep, 'a_style', 1, STRIDE, 9)
    attr(ep, 'a_color', 3, STRIDE, 10)
    attr(ep, 'a_seed', 1, STRIDE, 13)
    const ibuf = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW)
    this.edgeIndexCount = idx.length

    // medallions
    const node = gl.createVertexArray()!
    gl.bindVertexArray(node)
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    attr(this.progs.node.p, 'a_quad', 2, 2, 0)
    const NS = 10
    const nd = new Float32Array(this.graph.chars.length * NS)
    // draw minor nodes first so the great ones sit on top
    const order = this.graph.chars.map((c, i) => [c.tier, i] as const).sort((a, b) => b[0] - a[0])
    order.forEach(([, i], k) => {
      const c = this.graph.chars[i]
      const p = this.nodePosArr[i]
      const [r, g, b] = hexToRgb(DYNASTIES[c.dynasty].color)
      nd.set([p.x, p.y, c.kind === 'gap' ? 6 : NODE_RADIUS[c.tier], r, g, b, KIND_CODE[c.kind], c.royal ? 1 : 0, MIN_PX[c.tier], i], k * NS)
    })
    const nbuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, nbuf)
    gl.bufferData(gl.ARRAY_BUFFER, nd, gl.STATIC_DRAW)
    const np = this.progs.node.p
    attr(np, 'a_center', 2, NS, 0, 1)
    attr(np, 'a_radius', 1, NS, 2, 1)
    attr(np, 'a_color', 3, NS, 3, 1)
    attr(np, 'a_kind', 1, NS, 6, 1)
    attr(np, 'a_royal', 1, NS, 7, 1)
    attr(np, 'a_minpx', 1, NS, 8, 1)
    attr(np, 'a_id', 1, NS, 9, 1)
    gl.bindVertexArray(null)

    // story arcs: rebuilt whenever the focus changes
    const story = gl.createVertexArray()!
    gl.bindVertexArray(story)
    this.storyBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.storyBuf)
    const sp = this.progs.story.p
    const SS = 13
    attr(sp, 'a_pos', 2, SS, 0)
    attr(sp, 'a_nrm', 2, SS, 2)
    attr(sp, 'a_s', 1, SS, 4)
    attr(sp, 'a_t', 1, SS, 5)
    attr(sp, 'a_side', 1, SS, 6)
    attr(sp, 'a_len', 1, SS, 7)
    attr(sp, 'a_color', 3, SS, 8)
    attr(sp, 'a_idx', 1, SS, 11)
    attr(sp, 'a_delay', 1, SS, 12)
    this.storyIdx = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.storyIdx)
    gl.bindVertexArray(null)

    this.vaos = { sky, dust, edge, node, story }
    this.nodeState = new StateTex(gl, this.graph.chars.length)
    this.edgeState = new StateTex(gl, this.edges.length)
    for (let i = 0; i < this.edges.length; i++) this.edgeState.set(i, 2, 0.5 + 0.5)
  }

  /** Labels are created the first time they are needed — thousands of names never all show at once. */
  private labelAt(i: number) {
    const L = this.labels[i]
    if (L.el) return L.el
    const c = this.graph.chars[i]
    const el = document.createElement('div')
    el.className = `lbl t${c.tier}${c.kind === 'gap' ? ' gap' : ''}`
    el.innerHTML = `<span class="nm"></span><span class="dv"></span>`
    ;(el.firstChild as HTMLElement).textContent = c.name
    ;(el.lastChild as HTMLElement).textContent = c.devanagari
    el.style.setProperty('--c', DYNASTIES[c.dynasty].color)
    this.labelLayer.appendChild(el)
    L.el = el
    return el
  }

  private galleryEls: { el: HTMLDivElement; ring: HTMLElement; label: HTMLElement; x: number; y: number; r: number; island: boolean; members: string[]; below: number; side: number }[] = []
  private galleryHover: string | null = null

  private initLabels() {
    const frag = document.createDocumentFragment()
    this.labels = this.graph.chars.map((c) => {
      const fs = c.tier === 1 ? 14 : c.tier === 2 ? 12.5 : 11.5
      return { el: null, shown: false, opacity: 0, w: c.name.length * fs * 0.52 + 12 }
    })
    // constellation and island titles: the way into the thousands
    const gal = [
      ...this.layout.groups.map((g) => ({ id: g.id, title: g.title, sub: g.sub, n: g.members.length, x: g.center.x, y: g.center.y, r: g.radius, island: false, members: g.members })),
      ...this.layout.islands.map((g) => ({ id: g.id, title: g.title, sub: 'A family from the tales', n: g.members.length, x: g.center.x, y: g.center.y, r: g.h / 2, island: true, members: g.members })),
    ]
    const SHORT: Record<string, string> = {"asuras": "Enemies of the gods", "kings": "Rulers of the old genealogies", "people": "Servants, hunters, brahmins", "pandava_side": "Named in the battle books", "warriors": "Named in the battle books", "creatures": "Horses, elephants, birds", "celestials": "Dancers and singers of heaven", "gods": "Adityas, Vasus, Rudras", "skanda": "Mothers and companions", "serpents": "Nagas of the old lists", "sages": "Rishis, munis, ascetics", "kaurava_side": "Named in the battle books"}
    this.galleryEls = gal.map((g) => {
      const el = document.createElement('div')
      el.className = g.island ? 'gallery island' : 'gallery'
      el.innerHTML = `<span class="g-ring"></span><span class="g-label"><span class="g-t"></span><span class="g-s"></span></span>`
      el.querySelector('.g-t')!.textContent = g.title
      el.querySelector('.g-s')!.textContent = g.island ? `${g.n} · a tale within the epic` : `${g.n} · ${SHORT[g.id] ?? g.sub}`
      el.addEventListener('click', (ev) => { if ((ev.target as HTMLElement).closest('.g-ring, .g-label')) this.flyToGallery(g.x, g.y, g.r) })
      el.addEventListener('mouseenter', () => { this.galleryHover = g.id; this.highlightSet(new Set(g.members)) })
      el.addEventListener('mouseleave', () => { this.galleryHover = null; this.highlightSet(null) })
      frag.appendChild(el)
      // the room a title has, in map units: down to the next circle beneath it, and across to its neighbours or the river
      const tb = this.layout.treeBounds
      let below = 4000, side = g.island ? 400 : 1400
      for (const o of gal) {
        if (o === g) continue
        const dx = Math.abs(o.x - g.x), dy = o.y - g.y
        if (dy > 0 && dx < Math.max(g.r, o.r) + 260) below = Math.min(below, dy - o.r - g.r)
        if (Math.abs(dy) < g.r + o.r + 240 && dx > 1) side = Math.min(side, dx - o.r - 30)
      }
      const titleY = g.y + g.r
      if (titleY > tb.minY - 200 && titleY < tb.maxY + 200) {
        if (g.x < tb.minX) side = Math.min(side, tb.minX - g.x - 40)
        else if (g.x > tb.maxX) side = Math.min(side, g.x - tb.maxX - 40)
      }
      return { el, ring: el.querySelector('.g-ring') as HTMLElement, label: el.querySelector('.g-label') as HTMLElement, x: g.x, y: g.y, r: g.r, island: g.island, members: g.members, below: Math.max(0, below), side: Math.max(0, side) }
    }).sort((a, b) => b.members.length - a.members.length)
    this.eraEls = ERAS.map((e) => {
      const el = document.createElement('div')
      el.className = 'era'
      el.innerHTML = `<span class="era-dv"></span><span class="era-t"></span><span class="era-s"></span>`
      el.children[0].textContent = e.dv
      el.children[1].textContent = e.title
      el.children[2].textContent = e.sub
      frag.appendChild(el)
      return el
    })
    this.labelLayer.appendChild(frag)
  }

  private setupIntroCamera() {
    const { minY, maxY } = this.layout.treeBounds
    const to = this.restingView()
    this.introCam = {
      from: { x: to.x, y: minY + (maxY - minY) * 0.12, z: to.z * 2.6 },
      to,
    }
    this.cam.set(this.introCam.from.x, this.introCam.from.y, this.introCam.from.z)
  }

  private finishIntro() {
    this.intro.active = false
    this.intro.p = 1
    for (let i = 0; i < this.graph.chars.length; i++) this.nodeState.set(i, 3, 1)
    for (let i = 0; i < this.edges.length; i++) this.edgeState.set(i, 3, 1)
    this.emit('intro', false)
  }

  resize = () => {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.cam.resize(w, h)
    const { minX, maxX, minY, maxY } = this.layout.bounds
    this.cam.minZoom = Math.min(w / (maxX - minX + 600), h / (maxY - minY + 600)) * 0.85
  }

  // ───────────────────────────── input ─────────────────────────────

  private unbind?: () => void

  private bindInput() {
    const c = this.canvas
    const local = (e: { clientX: number; clientY: number }) => {
      const r = c.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    // Trackpads move with two fingers and zoom with a pinch; mouse wheels zoom (the map convention).
    // The two are told apart by the shape of their wheel events, and the answer is remembered briefly
    // so a single gesture never flips between modes halfway through.
    let trackpadUntil = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      this.userTookOver()
      const p = local(e)
      const now = performance.now()
      const legacy = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY
      const notchy = legacy !== undefined && legacy !== 0 && legacy % 120 === 0 && Math.abs(legacy) !== Math.abs(e.deltaY * 3)
      const looksTrackpad = e.deltaMode === 0 && !notchy &&
        (e.deltaX !== 0 || !Number.isInteger(e.deltaY) || Math.abs(e.deltaY) < 40 ||
          (legacy !== undefined && legacy !== 0 && Math.abs(legacy) === Math.abs(e.deltaY * 3)))
      if (looksTrackpad) trackpadUntil = now + 700
      else if (notchy || e.deltaMode !== 0) trackpadUntil = 0
      const trackpad = now < trackpadUntil
      this.setInputMode(trackpad ? 'trackpad' : 'mouse')
      // Firefox reports wheel notches in lines (3 per notch): scale them to the ≈100 of other browsers
      const lines = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? this.cam.h : 1
      const zoomBy = (k: number) => {
        const f = Math.exp(-e.deltaY * lines * k)
        this.cam.zoomAt(p.x, p.y, Math.min(MAX_EVENT_ZOOM, Math.max(1 / MAX_EVENT_ZOOM, f)))
      }

      if (e.ctrlKey || e.metaKey) {
        // pinch on a trackpad arrives as ctrl + wheel; ⌘/ctrl + wheel on a mouse means zoom too
        zoomBy(trackpad ? ZOOM_PINCH : ZOOM_WHEEL)
      } else if (trackpad) {
        this.cam.panBy(-e.deltaX, -e.deltaY)
      } else if (e.shiftKey) {
        this.cam.panBy(-(e.deltaY || e.deltaX) * lines, 0)
      } else {
        zoomBy(ZOOM_WHEEL)
      }
    }
    // Safari reports trackpad pinches as gesture events rather than ctrl + wheel
    let gestureScale = 1
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      gestureScale = 1
      this.setInputMode('trackpad')
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const ge = e as Event & { scale: number; clientX: number; clientY: number }
      const p = local(ge)
      this.userTookOver()
      this.cam.zoomAt(p.x, p.y, ge.scale / gestureScale)
      gestureScale = ge.scale
    }
    const onDown = (e: PointerEvent) => {
      this.touch = e.pointerType === 'touch'
      c.setPointerCapture(e.pointerId)
      const p = local(e)
      this.pointers.set(e.pointerId, p)
      this.cam.stop()
      if (this.pointers.size === 1) {
        this.press = { x: p.x, y: p.y, moved: false, t: performance.now() }
        this.trail = [{ ...p, t: performance.now() }]
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()]
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
        if (this.press) this.press.moved = true
      }
    }
    const onMove = (e: PointerEvent) => {
      const p = local(e)
      const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y
      if (this.mouse.inside) this.energy = Math.min(1, this.energy + Math.hypot(dx, dy) * 0.004)
      this.mouse = { x: p.x, y: p.y, inside: true }
      const prev = this.pointers.get(e.pointerId)
      if (!prev) return
      this.pointers.set(e.pointerId, p)
      if (this.pointers.size === 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        this.cam.panBy(mx - this.pinch.mx, my - this.pinch.my)
        this.cam.zoomAt(mx, my, d / this.pinch.d)
        this.pinch = { d, mx, my }
        return
      }
      if (this.press) {
        if (!this.press.moved && Math.hypot(p.x - this.press.x, p.y - this.press.y) > 4) {
          this.press.moved = true
          this.cam.dragging = true
          this.userTookOver()
          c.classList.add('grabbing')
        }
        if (this.press.moved) {
          this.cam.panBy(p.x - prev.x, p.y - prev.y)
          const now = performance.now()
          this.trail.push({ ...p, t: now })
          while (this.trail.length > 2 && now - this.trail[0].t > 90) this.trail.shift()
        }
      }
    }
    const onUp = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId)
      if (this.pointers.size < 2) this.pinch = null
      if (this.press && this.pointers.size === 0) {
        if (this.press.moved) {
          const a = this.trail[0], b = this.trail[this.trail.length - 1]
          const dt = (b.t - a.t) / 1000
          if (dt > 0.005 && performance.now() - b.t < 60) this.cam.release((b.x - a.x) / dt, (b.y - a.y) / dt)
        } else {
          const hit = this.hitTest(this.press.x, this.press.y)
          const arc = hit ? -1 : this.hitArc(this.press.x, this.press.y)
          if (this.intro.active) this.skipIntro()
          else if (arc >= 0) this.emit('moment', this.arcs[arc].m.id)
          else this.select(hit, !!hit)
        }
        this.press = null
        this.cam.dragging = false
        c.classList.remove('grabbing')
      }
    }
    const onLeave = () => {
      this.mouse.inside = false
      this.mouse.x = this.mouse.y = -1e4
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      // a panel in front of the map (search, the finder, the text view, a profile) owns the keyboard
      if (document.querySelector('.search-veil, .profile, .tour')) return
      if (e.key === 'Escape') this.select(null, false)
      if (e.key === '+' || e.key === '=') this.zoomBy(ZOOM_STEP)
      if (e.key === '-' || e.key === '_') this.zoomBy(1 / ZOOM_STEP)
      if (e.key === '0') this.fit()
      // with someone chosen, the arrows walk the family: up to parents, down to children, sideways along siblings and spouses
      if (this.selected && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.startsWith('Arrow')) {
        e.preventDefault()
        this.walk(e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right')
        return
      }
      if (this.selected && e.key === 'Enter') { this.emit('open', this.selected); return }
      const step = e.shiftKey ? 360 : 140
      if (e.key === 'ArrowLeft') this.cam.panBy(step, 0)
      if (e.key === 'ArrowRight') this.cam.panBy(-step, 0)
      if (e.key === 'ArrowUp') this.cam.panBy(0, step)
      if (e.key === 'ArrowDown') this.cam.panBy(0, -step)
      if (this.intro.active && e.key !== 'Shift' && e.key !== 'Meta') this.skipIntro()
    }

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault()
      const p = local(e)
      this.userTookOver()
      this.cam.zoomAt(p.x, p.y, e.shiftKey ? 1 / ZOOM_STEP : ZOOM_STEP)
    }
    c.addEventListener('dblclick', onDblClick)
    c.addEventListener('wheel', onWheel, { passive: false })
    c.addEventListener('gesturestart', onGestureStart, { passive: false } as AddEventListenerOptions)
    c.addEventListener('gesturechange', onGestureChange, { passive: false } as AddEventListenerOptions)
    c.addEventListener('pointerdown', onDown)
    c.addEventListener('pointermove', onMove)
    c.addEventListener('pointerup', onUp)
    c.addEventListener('pointercancel', onUp)
    c.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', this.resize)
    this.unbind = () => {
      c.removeEventListener('wheel', onWheel)
      c.removeEventListener('dblclick', onDblClick)
      c.removeEventListener('gesturestart', onGestureStart)
      c.removeEventListener('gesturechange', onGestureChange)
      c.removeEventListener('pointerdown', onDown)
      c.removeEventListener('pointermove', onMove)
      c.removeEventListener('pointerup', onUp)
      c.removeEventListener('pointercancel', onUp)
      c.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', this.resize)
    }
  }

  private userTookOver() {
    if (this.intro.active) this.intro.rush = true
  }

  private radiusPx(i: number) {
    const c = this.graph.chars[i]
    const r = c.kind === 'gap' ? 6 : NODE_RADIUS[c.tier]
    return Math.max(r * this.cam.zoom, MIN_PX[c.tier])
  }

  /** the last press came from a finger: targets grow to a fingertip's size */
  private touch = false

  /** Step from the chosen person to a relative, for keyboard and screen-reader readers. */
  walk(dir: 'up' | 'down' | 'left' | 'right') {
    const id = this.selected
    if (!id) return
    const g = this.graph
    const x = (k: string) => this.layout.pos.get(k)?.x ?? 0
    const blood = (t: string) => t === 'parent' || t === 'legal' || t === 'niyoga'
    let next: string | undefined
    if (dir === 'up') {
      // the blood parent first; the other parent is a step sideways, along the marriage
      const ps = (g.parentsOf.get(id) ?? []).slice().sort((a, b) => Number(blood(b.type)) - Number(blood(a.type)) || x(a.from) - x(b.from))
      next = ps[0]?.from
    } else if (dir === 'down') {
      const cs = (g.childrenOf.get(id) ?? []).slice().sort((a, b) => x(a.to) - x(b.to))
      next = cs[0]?.to
    } else {
      const row = new Set<string>([id, ...(g.spousesOf.get(id) ?? []), ...(g.siblingsOf.get(id) ?? [])])
      for (const p of g.parentsOf.get(id) ?? []) if (blood(p.type)) for (const c of g.childrenOf.get(p.from) ?? []) if (blood(c.type)) row.add(c.to)
      const sorted = [...row].filter((k) => this.layout.pos.has(k)).sort((a, b) => x(a) - x(b))
      const i = sorted.indexOf(id)
      next = sorted[dir === 'left' ? i - 1 : i + 1]
    }
    if (!next) return this.emit('announce', dir === 'up' ? 'No parents on the map.' : dir === 'down' ? 'No children on the map.' : `No one further ${dir}.`)
    this.select(next)
  }

  private hitTest(sx: number, sy: number): string | null {
    let best: string | null = null
    let bestScore = Infinity
    const chars = this.graph.chars
    for (let i = 0; i < chars.length; i++) {
      const p = this.nodePosArr[i]
      const [x, y] = this.cam.toScreen(p.x, p.y)
      const dx = x - sx, dy = y - sy
      if (Math.abs(dx) > 40 || Math.abs(dy) > 40) continue
      const r = this.radiusPx(i)
      let reach = chars[i].tier === 4 ? Math.max(r + 3, 5) : Math.max(r + 6, 11)
      if (this.touch) reach = Math.max(reach, chars[i].tier === 4 ? 14 : 22)   // a 44px fingertip
      const d = Math.hypot(dx, dy)
      if (d > reach) continue
      const score = (d / reach) * (chars[i].tier === 4 ? 1.6 : 1)
      if (score < bestScore) {
        bestScore = score
        best = chars[i].id
      }
    }
    return best
  }

  // ───────────────────────────── highlight ─────────────────────────────

  private refreshHighlight() {
    const focus = this.selected ?? this.hovered
    const key = `${focus}|${this.hovered}|${this.dynastyFocus}|${this.lens}|${this.canonOnly}|${this.galleryHover}`
    if (key === this.highlightKey) return
    this.highlightKey = key
    const now = this.time
    const ns = this.nodeState, es = this.edgeState
    const chars = this.graph.chars

    for (let i = 0; i < chars.length; i++) {
      ns.set(i, 0, chars[i].id === this.hovered || chars[i].id === focus ? 1 : 0, now)
      ns.set(i, 1, 0, now)
      ns.set(i, 2, 0, now)
    }
    for (let i = 0; i < this.edges.length; i++) {
      es.set(i, 0, 0, now)
      es.set(i, 1, 0, now)
    }

    if (this.dynastyFocus || this.setFocus) {
      const d = this.dynastyFocus
      const inD = this.setFocus ?? new Set(chars.filter((c) => c.dynasty === d).map((c) => c.id))
      chars.forEach((c, i) => {
        ns.set(i, 1, inD.has(c.id) ? 1 : 0, now)
        ns.set(i, 2, inD.has(c.id) ? 0 : 1, now)
      })
      this.edges.forEach((e, i) => {
        const on = inD.has(e.down) && e.up.some((u) => inD.has(u))
        es.set(i, 0, on ? 0.8 : 0, now)
        es.set(i, 1, on ? 0 : 1, now)
        es.set(i, 2, 1, now)
      })
      this.emit('hover', this.hovered)
      return
    }

    if (this.lens === 'stories') {
      this.storyHighlight(focus)
      this.emit('hover', this.hovered)
      return
    }
    this.buildArcs(null)

    if (!focus) {
      this.emit('hover', this.hovered)
      return
    }

    const L = lineageOf(this.graph, focus)
    const STEP = 0.075
    const index = this.graph.index
    const litDelay = (id: string) => {
      const d = id === focus ? 0 : (L.ancestors.get(id) ?? L.descendants.get(id) ?? 1)
      return now + d * STEP
    }
    const lit = new Set<string>([focus, ...L.ancestors.keys(), ...L.descendants.keys(), ...L.spouses])
    chars.forEach((c, i) => {
      const on = lit.has(c.id)
      const fade = on ? Math.max(0.55, 1 - ((L.ancestors.get(c.id) ?? L.descendants.get(c.id) ?? 0) * 0.025)) : 0
      ns.set(i, 1, on ? fade : 0, on ? litDelay(c.id) : now)
      ns.set(i, 2, on ? 0 : 1, now)
    })
    if (this.hovered && this.hovered !== focus) {
      const hi = index.get(this.hovered)!
      ns.set(hi, 2, 0, now)
    }

    const isAnc = (id: string) => id === focus || L.ancestors.has(id)
    const isDesc = (id: string) => id === focus || L.descendants.has(id)
    this.edges.forEach((e, i) => {
      let on = false
      let dirDown = true
      let depth = 0
      if (e.style === STYLE.spouse) {
        on = e.up.includes(focus) || (e.up.every((u) => L.ancestors.has(u)))
        depth = on && !e.up.includes(focus) ? Math.min(...e.up.map((u) => L.ancestors.get(u) ?? 0)) : 0
      } else if (e.style === STYLE.sibling) {
        on = e.up.includes(focus)
      } else {
        if (isAnc(e.down) && e.up.some((u) => L.ancestors.has(u))) {
          on = true
          dirDown = false
          depth = e.down === focus ? 0 : L.ancestors.get(e.down)!
        } else if (L.descendants.has(e.down) && e.up.some(isDesc)) {
          on = true
          depth = L.descendants.get(e.down)! - 1
        }
      }
      const strength = on ? Math.max(0.5, 1 - depth * 0.025) : 0
      es.set(i, 0, strength, on ? now + depth * STEP : now)
      es.set(i, 1, on ? 0 : 1, now)
      es.set(i, 2, dirDown ? 1 : 0, now)
      // snap the direction channel so pulses never travel the wrong way mid-fade
      es.cur[i * 4 + 2] = dirDown ? 1 : 0
    })
    this.emit('hover', this.hovered)
  }

  // ───────────────────────────── story layer ─────────────────────────────

  private storyHighlight(focus: string | null) {
    const now = this.time
    const ns = this.nodeState, es = this.edgeState
    const chars = this.graph.chars

    if (!focus) {
      // overview: the family map recedes; people who carry stories glow
      const told = new Set<string>()
      for (const m of this.graph.stories) if (m.trad !== 'index') { told.add(m.from); told.add(m.to) }
      chars.forEach((c, i) => {
        const has = told.has(c.id)
        ns.set(i, 1, has ? 0.6 : 0, now)
        ns.set(i, 2, has ? 0 : 0.55, now)
      })
      for (let i = 0; i < this.edges.length; i++) es.set(i, 1, 0.72, now)
      this.buildArcs(null)
      return
    }

    const moments = this.momentsOf(focus)
    const partners = new Set<string>()
    for (const m of moments) partners.add(m.from === focus ? m.to : m.from)
    const family = new Set<string>([
      ...(this.graph.parentsOf.get(focus) ?? []).map((r) => r.from),
      ...(this.graph.childrenOf.get(focus) ?? []).map((r) => r.to),
      ...(this.graph.spousesOf.get(focus) ?? []),
    ])
    chars.forEach((c, i) => {
      const id = c.id
      if (id === focus) { ns.set(i, 1, 1, now); ns.set(i, 2, 0, now) }
      else if (partners.has(id)) { ns.set(i, 1, 0.9, now + 0.15); ns.set(i, 2, 0, now) }
      else if (family.has(id)) { ns.set(i, 1, 0.25, now); ns.set(i, 2, 0.35, now) }
      else { ns.set(i, 1, 0, now); ns.set(i, 2, 1, now) }
    })
    this.edges.forEach((e, i) => {
      const near = e.down === focus || e.up.includes(focus)
      es.set(i, 0, near ? 0.3 : 0, now)
      es.set(i, 1, near ? 0.2 : 0.92, now)
      es.set(i, 2, 1, now)
    })
    this.buildArcs(focus)
  }

  private buildArcs(focus: string | null, force?: string) {
    if (focus === this.arcFocus && !force) return
    this.arcFocus = focus
    this.canvasArc = -1
    const gl = this.gl
    this.arcs = []
    if (focus) {
      let ms = this.momentsOf(focus)
      const keep = ms.slice(0, MAX_ARCS)
      for (const want of [force, this.pinnedMoment]) {
        if (!want || keep.some((m) => m.id === want)) continue
        const f = ms.find((m) => m.id === want)
        if (f) keep.push(f)
      }
      ms = keep
      const pairCount = new Map<string, number>()
      ms.forEach((m, k) => {
        const A = this.layout.pos.get(m.from)!, B = this.layout.pos.get(m.to)!
        const pair = [m.from, m.to].sort().join('|')
        const dup = pairCount.get(pair) ?? 0
        pairCount.set(pair, dup + 1)
        const dx = B.x - A.x, dy = B.y - A.y
        const dist = Math.hypot(dx, dy) || 1
        let nx = -dy / dist, ny = dx / dist
        if (ny > 0) { nx = -nx; ny = -ny }
        if (Math.abs(ny) < 0.35) {
          // near-vertical arcs bow sideways, alternating, so they never stack
          const sgn = k % 2 ? 1 : -1
          nx = Math.abs(nx) * sgn
        }
        const hgt = Math.min(dist * 0.32, 650) * (1 + dup * 0.45) + 30
        const p1 = { x: A.x + dx * 0.2 + nx * hgt, y: A.y + dy * 0.2 + ny * hgt }
        const p2 = { x: A.x + dx * 0.8 + nx * hgt, y: A.y + dy * 0.8 + ny * hgt }
        this.arcs.push({ m, p: [A, p1, p2, B] })
      })
    }

    const verts: number[] = []
    const idx: number[] = []
    const SS = 13
    this.arcs.forEach((a, k) => {
      const N = 56
      const pts: Vec[] = []
      for (let i = 0; i <= N; i++) pts.push(bez(a.p[0], a.p[1], a.p[2], a.p[3], i / N))
      const sArr = [0]
      for (let i = 1; i <= N; i++) sArr[i] = sArr[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
      const len = sArr[N]
      const n0 = STORY_KIND[a.m.kind].color
      const c = parseInt(n0.slice(1), 16)
      const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255
      const base = verts.length / SS
      for (let i = 0; i <= N; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(N, i + 1)]
        let tx = p1.x - p0.x, ty = p1.y - p0.y
        const tl = Math.hypot(tx, ty) || 1
        tx /= tl; ty /= tl
        for (const side of [-1, 1]) verts.push(pts[i].x, pts[i].y, -ty, tx, sArr[i], i / N, side, len, r, g, b, k, 0.08 + k * 0.07)
        if (i < N) {
          const i0 = base + i * 2
          idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2)
        }
      }
    })
    gl.bindVertexArray(this.vaos.story)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.storyBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.storyIdx)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.DYNAMIC_DRAW)
    gl.bindVertexArray(null)
    this.storyIndexCount = idx.length
    if (!force) this.arcT0 = this.time
    this.syncArcHover()
  }

  private arcHoverIndex() {
    const id = this.panelMoment ?? (this.canvasArc >= 0 ? this.arcs[this.canvasArc]?.m.id : null) ?? this.pinnedMoment
    return id ? this.arcs.findIndex((a) => a.m.id === id) : -1
  }

  /** Brighten the far end of the arc being pointed at. */
  private syncArcHover() {
    const k = this.arcHoverIndex()
    const ns = this.nodeState
    for (const a of this.arcs) {
      for (const id of [a.m.from, a.m.to]) {
        if (id === this.arcFocus || id === this.hovered) continue
        const i = this.graph.index.get(id)!
        ns.set(i, 0, 0, this.time)
      }
    }
    if (k >= 0) {
      const a = this.arcs[k]
      for (const id of [a.m.from, a.m.to]) ns.set(this.graph.index.get(id)!, 0, 1, this.time)
    }
  }

  private hitArc(sx: number, sy: number) {
    let best = -1, bestD = 9
    this.arcs.forEach((a, k) => {
      let prev = this.cam.toScreen(a.p[0].x, a.p[0].y)
      for (let i = 1; i <= 40; i++) {
        const q = bez(a.p[0], a.p[1], a.p[2], a.p[3], i / 40)
        const cur = this.cam.toScreen(q.x, q.y)
        const vx = cur[0] - prev[0], vy = cur[1] - prev[1]
        const l2 = vx * vx + vy * vy || 1
        const t = Math.max(0, Math.min(1, ((sx - prev[0]) * vx + (sy - prev[1]) * vy) / l2))
        const d = Math.hypot(sx - (prev[0] + vx * t), sy - (prev[1] + vy * t))
        if (d < bestD && i > 3 && i < 37) { bestD = d; best = k }
        prev = cur
      }
    })
    return best
  }

  // ───────────────────────────── frame ─────────────────────────────

  private emit<K extends keyof EngineEvents>(ev: K, v: EngineEvents[K]) {
    for (const fn of this.listeners[ev]) fn(v)
  }

  private lastZoomEmit = 0

  private frame = (tNow: number) => {
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min(0.05, (tNow - this.last) / 1000)
    this.last = tNow
    this.time += dt
    this.energy *= Math.exp(-dt * 1.6)

    this.updateIntro(dt)
    this.cam.update(dt)

    // hover (skipped while dragging or flying)
    if (!this.cam.dragging && !this.pinch && this.mouse.inside) {
      const h = this.hitTest(this.mouse.x, this.mouse.y)
      if (h !== this.hovered) {
        this.hovered = h
        this.refreshHighlight()
      }
      const arc = h || !this.arcs.length ? -1 : this.hitArc(this.mouse.x, this.mouse.y)
      if (arc !== this.canvasArc) {
        this.canvasArc = arc
        this.syncArcHover()
        this.emit('arc', arc >= 0 ? this.arcs[arc].m.id : null)
      }
      this.canvas.classList.toggle('pointing', !!h || arc >= 0)
    } else if (!this.mouse.inside && this.hovered) {
      this.hovered = null
      this.canvas.classList.remove('pointing')
      this.refreshHighlight()
    }

    this.nodeState.step(this.time, dt, [16, 7, 6, 40])
    this.edgeState.step(this.time, dt, [6, 6, 30, 40])
    this.draw()
    this.updateLabels()
    if (Math.abs(this.cam.zoom - this.lastZoomEmit) / this.cam.zoom > 0.01) {
      this.lastZoomEmit = this.cam.zoom
      this.emit('zoom', this.cam.zoom)
    }
    for (const fn of this.listeners.frame) fn(this.time)
  }

  private updateIntro(dt: number) {
    if (!this.intro.active) return
    const I = this.intro
    // wall-clock driven, so a backgrounded tab never strands the reveal half-way
    if (I.rush) I.p = Math.min(1, I.p + dt / 0.7)
    else I.p = Math.max(0, Math.min(1, ((performance.now() - I.start) / 1000 - I.delay) / I.dur))
    const p = I.p
    // reveal flows top → bottom, like the story being told
    const front = p * 1.25
    for (let i = 0; i < this.yNorm.length; i++) {
      const v = Math.max(0, Math.min(1, (front - this.yNorm[i] * 1.0) / 0.12))
      this.nodeState.set(i, 3, v)
      this.nodeState.cur[i * 4 + 3] = v
    }
    for (let i = 0; i < this.edges.length; i++) {
      const y0 = this.edgeY[i * 2], y1 = this.edgeY[i * 2 + 1]
      const v = Math.max(0, Math.min(1, (front - y0 - 0.04) / (y1 - y0 + 0.1)))
      this.edgeState.set(i, 3, v)
      this.edgeState.cur[i * 4 + 3] = v
    }
    if (!I.rush) {
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      const { from, to } = this.introCam
      const lz = Math.log(from.z) + (Math.log(to.z) - Math.log(from.z)) * e
      this.cam.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e, Math.exp(lz))
    }
    if (p >= 1) this.finishIntro()
  }

  private draw() {
    const gl = this.gl
    const { w, h } = this.cam
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.disable(gl.DEPTH_TEST)

    // sky
    const sky = this.progs.sky
    gl.useProgram(sky.p)
    gl.bindVertexArray(this.vaos.sky)
    gl.disable(gl.BLEND)
    gl.uniform2f(sky.u('u_res'), w, h)
    gl.uniform1f(sky.u('u_dpr'), this.dpr)
    gl.uniform1f(sky.u('u_time'), this.time * (0.25 + 0.75 * this.motion))
    gl.uniform2f(sky.u('u_mouse'), this.mouse.x, h - this.mouse.y)
    gl.uniform1f(sky.u('u_energy'), this.energy * this.motion)
    gl.uniform2f(sky.u('u_cam'), this.cam.x, this.cam.y)
    gl.uniform1f(sky.u('u_zoom'), this.cam.zoom)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // dust
    const dust = this.progs.dust
    gl.useProgram(dust.p)
    gl.bindVertexArray(this.vaos.dust)
    gl.uniform2f(dust.u('u_res'), w, h)
    gl.uniform1f(dust.u('u_time'), this.time * this.motion)
    gl.uniform2f(dust.u('u_cam'), this.cam.x, this.cam.y)
    gl.uniform1f(dust.u('u_zoom'), this.cam.zoom)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 170)

    // threads
    const ep = this.progs.edge
    gl.useProgram(ep.p)
    gl.bindVertexArray(this.vaos.edge)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.edgeState.tex)
    gl.uniform1i(ep.u('u_state'), 0)
    gl.uniform2f(ep.u('u_res'), w, h)
    gl.uniform2f(ep.u('u_cam'), this.cam.x, this.cam.y)
    gl.uniform1f(ep.u('u_zoom'), this.cam.zoom)
    gl.uniform1f(ep.u('u_time'), this.time)
    gl.uniform1f(ep.u('u_motion'), this.motion)
    gl.drawElements(gl.TRIANGLES, this.edgeIndexCount, gl.UNSIGNED_INT, 0)

    // story arcs float above the threads, beneath the medallions
    if (this.storyIndexCount) {
      const st = this.progs.story
      gl.useProgram(st.p)
      gl.bindVertexArray(this.vaos.story)
      gl.uniform2f(st.u('u_res'), w, h)
      gl.uniform2f(st.u('u_cam'), this.cam.x, this.cam.y)
      gl.uniform1f(st.u('u_zoom'), this.cam.zoom)
      gl.uniform1f(st.u('u_time'), this.time - this.arcT0)
      gl.uniform1f(st.u('u_hover'), this.arcHoverIndex())
      gl.uniform1f(st.u('u_motion'), this.motion)
      gl.drawElements(gl.TRIANGLES, this.storyIndexCount, gl.UNSIGNED_INT, 0)
    }

    // medallions
    const np = this.progs.node
    gl.useProgram(np.p)
    gl.bindVertexArray(this.vaos.node)
    gl.bindTexture(gl.TEXTURE_2D, this.nodeState.tex)
    gl.uniform1i(np.u('u_state'), 0)
    gl.uniform2f(np.u('u_res'), w, h)
    gl.uniform2f(np.u('u_cam'), this.cam.x, this.cam.y)
    gl.uniform1f(np.u('u_zoom'), this.cam.zoom)
    gl.uniform1f(np.u('u_time'), this.time)
    gl.uniform1f(np.u('u_motion'), this.motion)
    gl.uniform1f(np.u('u_selected'), this.selected ? this.graph.index.get(this.selected)! : -1)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.graph.chars.length)
    gl.bindVertexArray(null)
  }

  // ───────────────────────────── labels ─────────────────────────────

  private grid = new Map<number, [number, number, number, number][]>()

  private updateLabels() {
    const z = this.cam.zoom
    const chars = this.graph.chars
    const ns = this.nodeState.cur
    const W = this.cam.w, H = this.cam.h
    const focus = this.selected ?? this.hovered
    const near = z > 1.05
    this.labelLayer.classList.toggle('near', near)

    type Cand = { i: number; x: number; y: number; a: number; pri: number }
    const cands: Cand[] = []
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
      const reveal = ns[i * 4 + 3]
      if (reveal < 0.5) continue
      const p = this.nodePosArr[i]
      const [x, y] = this.cam.toScreen(p.x, p.y)
      if (x < -120 || x > W + 120 || y < -40 || y > H + 40) continue
      const lz = LABEL_ZOOM[c.tier]
      let a = Math.max(0, Math.min(1, (z - lz) / (lz * 0.35)))
      const lit = ns[i * 4 + 1], dim = ns[i * 4 + 2], hov = ns[i * 4]
      if (lit > 0.05 && (c.tier < 4 || z > 1)) a = Math.max(a, Math.min(1, lit * 1.4))
      if (hov > 0.05) a = 1
      a *= 1 - dim * 0.85
      if (a < 0.04) continue
      let pri = (5 - c.tier) * 10 + a
      if (lit > 0.05) pri += 60
      if (c.id === focus || c.id === this.hovered) pri += 1000
      cands.push({ i, x, y: y + this.radiusPx(i) + (hov > 0.05 ? 9 : 4), a, pri })
    }
    cands.sort((a, b) => b.pri - a.pri)

    // greedy de-cluttering: a label only appears where it has room
    const grid = this.grid
    grid.clear()
    const CELL = 64
    const shown = new Set<number>()
    const lh = near ? 34 : 18
    for (const c of cands) {
      const w = this.labels[c.i].w
      const x0 = c.x - w / 2, x1 = c.x + w / 2, y0 = c.y, y1 = c.y + lh
      let ok = true
      const gx0 = Math.floor(x0 / CELL), gx1 = Math.floor(x1 / CELL), gy0 = Math.floor(y0 / CELL), gy1 = Math.floor(y1 / CELL)
      outer: for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
        for (const r of grid.get(gx * 4096 + gy) ?? []) {
          if (x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1]) { ok = false; break outer }
        }
      }
      if (!ok && c.pri < 1000) continue
      const rect: [number, number, number, number] = [x0 - 4, y0 - 2, x1 + 4, y1 + 2]
      for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
        const k = gx * 4096 + gy
        const arr = grid.get(k)
        if (arr) arr.push(rect)
        else grid.set(k, [rect])
      }
      shown.add(c.i)
      const L = this.labels[c.i]
      this.labelAt(c.i)
      L.el!.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) translateX(-50%)`
      const op = Math.round(c.a * 100) / 100
      if (!L.shown || Math.abs(op - L.opacity) > 0.02) {
        L.el!.style.opacity = String(op)
        L.opacity = op
      }
      if (!L.shown) {
        L.el!.style.visibility = 'visible'
        L.shown = true
      }
      L.el!.classList.toggle('focus', chars[c.i].id === focus || chars[c.i].id === this.hovered)
    }
    for (let i = 0; i < this.labels.length; i++) {
      const L = this.labels[i]
      if (L.shown && !shown.has(i)) {
        L.shown = false
        L.opacity = 0
        L.el!.style.opacity = '0'
        L.el!.style.visibility = 'hidden'
      }
    }

    // each constellation sits inside a fine orbit ring, its title beneath, while you are far enough out to need it
    const intro = this.intro.active ? Math.max(0, (this.intro.p - 0.75) / 0.25) : 1
    const occupied: [number, number, number, number][] = []
    const titles: [number, number, number, number][] = []
    for (const g of this.galleryEls) {
      const [cx, cy] = this.cam.toScreen(g.x, g.y)
      const rPx = g.r * z
      // the orbit ring hugs a small disc and stands off a large one
      const pad = Math.min(g.island ? 10 : 16, Math.max(4, rPx * 0.22))
      const ringR = rPx + pad
      // a title is sized to the room around its circle, so it grows legible as you lean in and never spills onto a neighbour
      const natW = g.label.offsetWidth || 200
      const natH = g.label.offsetHeight || (g.island ? 34 : 44)
      const roomH = g.below * z - pad * 2 - 10
      const roomW = 2 * g.side * z - 12
      const sc = Math.max(0, Math.min(1, roomH / natH, roomW / natW))
      const x = cx, y = cy + ringR + 8 * sc
      const far = g.island ? 1 : Math.max(0, Math.min(1, (2.2 - z) / 0.8))
      // shown only once it is big enough to read — never as a ghost smudge
      const big = Math.max(0, Math.min(1, (sc - 0.58) / 0.14)) * Math.max(0, Math.min(1, (rPx - (g.island ? 14 : 5)) / 8))
      const hw = (natW * sc) / 2
      const th = natH * sc
      const visible = cx + ringR > 0 && cx - ringR < W && cy + ringR > 0 && cy - ringR < H
      const titleFits = x - hw > 12 && x + hw < W - 12 && y > 90 && y + th < H - 16 && !(y + th > H - 76 && (x - hw < 300 || x + hw > W - 220))
      const titleRect: [number, number, number, number] = [x - hw - 6, y - 4, x + hw + 6, y + th]
      const crowded = titles.some((r) => titleRect[0] < r[2] && titleRect[2] > r[0] && titleRect[1] < r[3] && titleRect[3] > r[1])
      const ringA = visible ? far * Math.max(0, Math.min(1, (rPx - 6) / 20)) * intro * (focus ? 0.3 : 1) : 0
      const a = titleFits && !crowded ? far * big * intro * (focus ? 0.25 : 1) : 0
      if (a > 0.05) titles.push(titleRect)
      g.el.style.opacity = '1'
      g.ring.style.opacity = ringA.toFixed(2)
      g.label.style.opacity = a.toFixed(2)
      g.label.style.pointerEvents = a > 0.3 ? 'auto' : 'none'
      g.ring.style.pointerEvents = ringA > 0.3 && rPx < 140 ? 'auto' : 'none'
      if (ringA > 0) {
        g.ring.style.transform = `translate3d(${(cx - ringR).toFixed(1)}px, ${(cy - ringR).toFixed(1)}px, 0)`
        g.ring.style.width = g.ring.style.height = `${(ringR * 2).toFixed(1)}px`
      }
      if (a > 0) g.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateX(-50%) scale(${sc.toFixed(3)})`
      const onScreen = titleFits
      if (onScreen || visible) occupied.push([Math.min(cx - ringR, x - hw), cy - ringR, Math.max(cx + ringR, x + hw), y + th])
    }

    // era titles drift beside the river at a distance, and fade as you lean in
    const eraA = Math.max(0, Math.min(1, (0.55 - z) / 0.25)) * (this.selected ? 0 : 1)
    const { minX } = this.layout.treeBounds
    ERAS.forEach((e, k) => {
      const el = this.eraEls[k]
      const y = (yOfGen(e.from) + yOfGen(Math.min(e.to, 37.4))) / 2
      const [x, sy] = this.cam.toScreen(minX - 140, y)
      // hug the left gutter, and bow out near the brand and the controls
      const ew = el.offsetWidth || 220
      const left = Math.max(28, x - 20 - ew)
      const edge = Math.min(1, Math.max(0, (sy - 120) / 50), Math.max(0, (H - 110 - sy) / 50))
      // step aside wherever a constellation already claims the space
      const [treeLeft] = this.cam.toScreen(minX, 0)
      const clash = occupied.some((r) => left < r[2] && left + ew > r[0] && sy - 34 < r[3] && sy + 34 > r[1])
        || left + ew > treeLeft - 16                    // never over the river itself
      const a = clash ? 0 : eraA * edge * (this.intro.active ? Math.max(0, (this.intro.p - 0.6) / 0.4) : 1)
      el.style.opacity = a.toFixed(2)
      el.style.transform = `translate3d(${left.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translateY(-50%)`
    })

  }

  /** Light one set of people (a constellation, an island) and let the rest recede. */
  highlightSet(ids: Set<string> | null) {
    this.setFocus = ids
    this.highlightKey = ''
    this.refreshHighlight()
  }

  private setFocus: Set<string> | null = null

  /** Fly to fit a handful of people — the chain of a relationship — on screen. */
  frameIds(ids: string[]) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const id of ids) {
      const i = this.graph.index.get(id)
      if (i === undefined) continue
      const p = this.nodePosArr[i]
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
    }
    if (minX === Infinity) return
    const z = Math.min(2.2, (this.cam.w - 160) / (maxX - minX + 200), (this.cam.h - 260) / (maxY - minY + 200))
    this.cam.flyTo((minX + maxX) / 2, (minY + maxY) / 2, Math.max(0.12, z), 1.2)
  }

  /** Travel to a constellation or island by id. */
  flyToGroup(id: string) {
    const g = this.layout.groups.find((x) => x.id === id)
    if (g) return this.flyToGallery(g.center.x, g.center.y, g.radius)
    const i = this.layout.islands.find((x) => x.id === id)
    if (i) this.flyToGallery(i.center.x, i.center.y, Math.max(i.w, i.h) / 2)
  }

  private flyToGallery(x: number, y: number, r: number) {
    const z = Math.min(2.4, Math.min(this.cam.w, this.cam.h) / (r * 2 + 260))
    this.cam.flyTo(x, y, z, 1.3)
  }
}
