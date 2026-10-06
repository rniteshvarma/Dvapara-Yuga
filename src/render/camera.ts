/** A spring camera: inertial panning, cursor-anchored zoom and cinematic fly-to. */
export class Camera {
  x = 0
  y = 0
  zoom = 1
  w = 1
  h = 1
  minZoom = 0.05
  maxZoom = 5

  private tz = 1
  private vx = 0
  private vy = 0
  private anchor: { sx: number; sy: number; wx: number; wy: number } | null = null
  private flight: {
    t: number; dur: number
    x0: number; y0: number; z0: number
    x1: number; y1: number; z1: number
    dip: number
  } | null = null
  dragging = false

  resize(w: number, h: number) {
    this.w = w
    this.h = h
  }

  get busy() {
    return !!this.flight || !!this.anchor || Math.hypot(this.vx, this.vy) > 2
  }

  toScreen(wx: number, wy: number): [number, number] {
    return [(wx - this.x) * this.zoom + this.w / 2, (wy - this.y) * this.zoom + this.h / 2]
  }

  toWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.w / 2) / this.zoom + this.x, (sy - this.h / 2) / this.zoom + this.y]
  }

  set(x: number, y: number, zoom: number) {
    this.x = x
    this.y = y
    this.zoom = this.tz = this.clampZoom(zoom)
    this.flight = null
    this.anchor = null
    this.vx = this.vy = 0
  }

  clampZoom(z: number) {
    return Math.min(this.maxZoom, Math.max(this.minZoom, z))
  }

  zoomAt(sx: number, sy: number, factor: number) {
    this.flight = null
    if (!this.anchor || Math.hypot(this.anchor.sx - sx, this.anchor.sy - sy) > 2) {
      const [wx, wy] = this.toWorld(sx, sy)
      this.anchor = { sx, sy, wx, wy }
    }
    this.tz = this.clampZoom(this.tz * factor)
  }

  panBy(dx: number, dy: number) {
    this.flight = null
    this.anchor = null
    this.x -= dx / this.zoom
    this.y -= dy / this.zoom
  }

  release(vxScreen: number, vyScreen: number) {
    this.vx = -vxScreen / this.zoom
    this.vy = -vyScreen / this.zoom
  }

  stop() {
    this.vx = this.vy = 0
  }

  flyTo(x: number, y: number, zoom: number, dur = 1.4) {
    const z1 = this.clampZoom(zoom)
    const dist = Math.hypot(x - this.x, y - this.y) * Math.min(this.zoom, z1)
    const dip = Math.min(1.6, Math.max(0, Math.log(dist / (this.w * 0.5)) * 0.75))
    this.anchor = null
    this.vx = this.vy = 0
    this.flight = { t: 0, dur, x0: this.x, y0: this.y, z0: this.zoom, x1: x, y1: y, z1, dip }
    this.tz = z1
  }

  update(dt: number) {
    if (this.flight) {
      const f = this.flight
      f.t += dt
      const p = Math.min(1, f.t / f.dur)
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      this.x = f.x0 + (f.x1 - f.x0) * e
      this.y = f.y0 + (f.y1 - f.y0) * e
      const lz = Math.log(f.z0) + (Math.log(f.z1) - Math.log(f.z0)) * e - f.dip * Math.sin(Math.PI * e)
      this.zoom = Math.exp(lz)
      if (p >= 1) this.flight = null
      return
    }
    if (this.anchor) {
      const k = 1 - Math.exp(-dt * 13)
      const lz = Math.log(this.zoom) + (Math.log(this.tz) - Math.log(this.zoom)) * k
      this.zoom = Math.exp(lz)
      const a = this.anchor
      this.x = a.wx - (a.sx - this.w / 2) / this.zoom
      this.y = a.wy - (a.sy - this.h / 2) / this.zoom
      if (Math.abs(Math.log(this.tz / this.zoom)) < 0.0015) {
        this.zoom = this.tz
        this.anchor = null
      }
    }
    if (!this.dragging && (this.vx || this.vy)) {
      this.x += this.vx * dt
      this.y += this.vy * dt
      const decay = Math.exp(-dt * 4.2)
      this.vx *= decay
      this.vy *= decay
      if (Math.hypot(this.vx, this.vy) * this.zoom < 4) this.vx = this.vy = 0
    }
  }
}
