// ─────────────────────────────── Milky sky ───────────────────────────────

export const FULLSCREEN_VS = /* glsl */ `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main(){ gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }`

export const SKY_FS = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_res;      // css px
uniform float u_dpr;
uniform float u_time;
uniform vec2 u_mouse;    // css px, y up
uniform float u_energy;  // cursor activity 0..1
uniform vec2 u_cam;
uniform float u_zoom;
out vec4 o;

vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++){ s += a * snoise(p); p = p * 1.9 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}

void main(){
  vec2 frag = gl_FragCoord.xy / u_dpr;
  vec2 uv = frag / u_res.y;
  // the sky drifts a little as you travel, so the map feels suspended in depth
  vec2 par = vec2(u_cam.x, -u_cam.y) * 0.00009 + vec2(0.0, log(u_zoom) * 0.05);
  vec2 p = uv * 0.55 + par;
  float t = u_time * 0.018;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.8));
  vec2 m = u_mouse / u_res.y;
  float md = length(uv - m);
  // cursor stirs the milk
  vec2 stir = (uv - m) * exp(-md * md * 7.0) * u_energy * 0.6;
  vec2 r = vec2(fbm(p + 0.9 * q + vec2(1.7, 9.2) + t * 1.2 + stir), fbm(p + 0.9 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 0.8 * r);

  vec3 shade = vec3(0.935, 0.918, 0.893);
  vec3 milk  = vec3(0.962, 0.952, 0.935);
  vec3 cream = vec3(0.984, 0.978, 0.964);
  vec3 rose  = vec3(0.970, 0.938, 0.928);
  vec3 sky   = vec3(0.925, 0.942, 0.955);
  vec3 col = mix(shade, milk, smoothstep(-0.9, 0.0, f));
  col = mix(col, cream, smoothstep(-0.1, 0.9, f));
  col = mix(col, rose, smoothstep(-0.2, 0.8, q.x) * 0.45);
  col = mix(col, sky, smoothstep(-0.1, 0.8, r.y) * 0.40);

  // a pearly bloom that follows the cursor
  float glow = exp(-md * md * 6.0);
  col = mix(col, vec3(1.0, 0.995, 0.985), glow * (0.22 + 0.35 * u_energy));
  float ring = sin(md * 70.0 - u_time * 4.0) * exp(-md * 9.0) * u_energy;
  col += ring * 0.006;

  vec2 c = frag / u_res - 0.5;
  col *= 1.0 - dot(c, c) * 0.16;
  float grain = fract(sin(dot(gl_FragCoord.xy + fract(u_time) * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.014;
  o = vec4(col, 1.0);
}`

// ─────────────────────────────── Dust motes ───────────────────────────────

export const DUST_VS = /* glsl */ `#version 300 es
in vec2 a_quad;
in vec4 a_seed;   // x, y, depth, phase
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_cam;
uniform float u_zoom;
out vec2 v_p;
out float v_a;
void main(){
  float depth = a_seed.z;
  vec2 drift = vec2(sin(u_time * 0.05 + a_seed.w * 6.28) * 0.02, -u_time * 0.004) * (0.4 + depth);
  vec2 par = u_cam * u_zoom * depth * 0.00045 / u_res * vec2(1.0, 1.0);
  vec2 uv = fract(a_seed.xy + drift - par * 0.6);
  float size = mix(1.2, 3.6, depth * depth);
  vec2 px = uv * (u_res + 40.0) - 20.0 + a_quad * size * 3.0;
  v_p = a_quad * 3.0;
  v_a = (0.18 + 0.32 * depth) * (0.6 + 0.4 * sin(u_time * 0.7 + a_seed.w * 40.0));
  vec2 clip = px / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

export const DUST_FS = /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_p;
in float v_a;
out vec4 o;
void main(){
  float d = length(v_p);
  float a = exp(-d * d * 1.4) * v_a;
  vec3 c = vec3(0.80, 0.68, 0.42);
  o = vec4(c * a, a);
}`

// ─────────────────────────────── Threads ───────────────────────────────

export const EDGE_VS = /* glsl */ `#version 300 es
precision highp float;
in vec2 a_pos;
in vec2 a_nrm;
in float a_s;      // arc length from the upper end (world)
in float a_t;      // 0..1 along the thread
in float a_side;   // -1 / +1
in float a_eid;
in float a_len;    // total arc length (world)
in float a_style;
in vec3 a_color;
in float a_seed;

uniform vec2 u_res;
uniform vec2 u_cam;
uniform float u_zoom;
uniform float u_time;
uniform float u_motion;
uniform sampler2D u_state;   // r: lit  g: dim  b: direction  a: reveal

out float v_s;
out float v_across;
out float v_t;
out float v_lenPx;
out float v_style;
out vec3 v_color;
out vec4 v_state;
out float v_seed;
out float v_half;

void main(){
  int id = int(a_eid);
  vec4 st = texelFetch(u_state, ivec2(id % 1024, id / 1024), 0);
  float lit = st.r;

  // threads float like silk, and pull taut when their bloodline wakes
  float amp = min(a_len * 0.018, 11.0) * (1.0 - lit * 0.75) * u_motion;
  float wave = sin(u_time * 0.55 + a_seed * 6.2831 + a_t * 3.4) * 0.7 + sin(u_time * 0.31 + a_seed * 17.0 + a_t * 7.0) * 0.3;
  vec2 world = a_pos + a_nrm * wave * amp * sin(3.14159 * a_t);

  float hw = 3.2 + lit * 3.0;
  if (abs(a_style - 1.0) < 0.1) hw += 1.8;
  vec2 px = (world - u_cam) * u_zoom + u_res * 0.5 + a_nrm * a_side * hw;

  v_s = a_s * u_zoom;
  v_across = a_side * hw;
  v_half = hw;
  v_t = a_t;
  v_lenPx = a_len * u_zoom;
  v_style = a_style;
  v_color = a_color;
  v_state = st;
  v_seed = a_seed;
  vec2 clip = px / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

export const EDGE_FS = /* glsl */ `#version 300 es
precision highp float;
in float v_s;
in float v_across;
in float v_t;
in float v_lenPx;
in float v_style;
in vec3 v_color;
in vec4 v_state;
in float v_seed;
in float v_half;
uniform float u_time;
uniform float u_zoom;
uniform float u_motion;
out vec4 o;

float hash(float n){ return fract(sin(n) * 43758.5453); }

void main(){
  float lit = v_state.r;
  float dim = v_state.g;
  float dir = v_state.b * 2.0 - 1.0;   // +1 flows down to descendants, -1 climbs to ancestors
  float reveal = v_state.a;
  if (v_t > reveal) discard;

  float faint = v_style > 9.5 ? 0.42 : 1.0;
  int style = int(mod(v_style, 10.0) + 0.5);
  float spacing = 7.0;
  float r = 1.05 + lit * 0.55;
  if (style == 8) { spacing = 5.0; r = 0.75; }
  if (style == 7) { spacing = 9.0; r = 0.85; }
  if (style == 2) { spacing = 6.0; r = 1.1 + lit * 0.5; }

  // dots drift slowly downstream — the lineage is always flowing
  float flow = u_time * 5.0 * u_motion;
  if (style == 1 || style == 8) flow = u_time * 2.0 * u_motion;
  float along = v_s - flow;
  float idx = floor(along / spacing);
  float cell = (fract(along / spacing) - 0.5) * spacing;

  float a = 0.0;
  if (style == 1) {
    // marriage: two parallel strands
    float d1 = length(vec2(cell, v_across - 1.9));
    float d2 = length(vec2(cell, v_across + 1.9));
    a = smoothstep(r + 0.6, r - 0.5, min(d1, d2));
  } else if (style == 3) {
    // niyoga: dashes
    float d = length(vec2(max(abs(cell) - 1.9, 0.0), v_across));
    a = smoothstep(r + 0.5, r - 0.5, d);
  } else if (style == 4) {
    // fostered: hollow rings
    float d = length(vec2(cell, v_across));
    a = smoothstep(0.75, 0.0, abs(d - (r + 0.75)));
  } else {
    float d = length(vec2(cell, v_across));
    a = smoothstep(r + 0.6, r - 0.5, d);
  }

  vec3 col = mix(vec3(0.22, 0.21, 0.30), v_color, 0.55);
  float base = 0.52;
  if (style == 2) {
    // divine: gold that twinkles dot by dot
    col = vec3(0.78, 0.60, 0.20);
    float tw = 0.55 + 0.45 * sin(u_time * 2.2 + hash(idx + v_seed * 91.0) * 6.2831);
    base = 0.5 + 0.35 * tw;
  } else if (style == 5) {
    col = mix(vec3(0.86, 0.42, 0.16), vec3(0.95, 0.66, 0.25), 0.5 + 0.5 * sin(v_s * 0.08 - u_time * 1.5));
    base = 0.65;
  } else if (style == 6) {
    col = mix(vec3(0.55, 0.38, 0.72), vec3(0.85, 0.55, 0.40), v_t);
    base = 0.6;
  } else if (style == 1) {
    col = mix(vec3(0.69, 0.50, 0.43), v_color, 0.25);
    base = 0.5;
  } else if (style == 8) {
    base = 0.35;
  } else if (style == 7) {
    base = 0.32;
  }

  // light packets travelling along awakened threads
  float pulse = 0.0;
  if (lit > 0.01) {
    float ph = fract(v_s / 140.0 - dir * u_time * 0.85);
    pulse = smoothstep(0.80, 1.0, ph) * lit;
    col = mix(col, v_color * 0.85, 0.35 * lit);
    if (style == 2) col = mix(col, vec3(0.86, 0.66, 0.18), 0.6);
  }

  // a soft glow beneath awakened threads
  float glow = exp(-(v_across * v_across) / (2.0 * 2.2 * 2.2)) * (0.10 + 0.35 * pulse) * lit;

  // keep the ends clear of the medallions
  float ends = smoothstep(4.0, 12.0, v_s) * smoothstep(4.0, 12.0, v_lenPx - v_s);
  if (style == 1 || style == 8) ends = smoothstep(2.0, 8.0, v_s) * smoothstep(2.0, 8.0, v_lenPx - v_s);

  // soft draw-in tip during the reveal
  float tip = smoothstep(reveal, reveal - 0.02, v_t);

  float alpha = (a * (base + lit * 0.45 + pulse * 0.6) + glow) * ends * tip;
  alpha *= mix(1.0, 0.10, dim) * mix(faint, 1.0, lit);
  vec3 c = mix(col, vec3(1.0, 0.97, 0.88), pulse * 0.55);
  o = vec4(c * alpha, alpha);
}`

// ─────────────────────────────── Medallions ───────────────────────────────

export const NODE_VS = /* glsl */ `#version 300 es
precision highp float;
in vec2 a_quad;
in vec2 a_center;
in float a_radius;
in vec3 a_color;
in float a_kind;    // 0 mortal 1 divine 2 sage 3 naga 4 asura 5 apsara 6 gap
in float a_royal;
in float a_minpx;
in float a_id;

uniform vec2 u_res;
uniform vec2 u_cam;
uniform float u_zoom;
uniform float u_time;
uniform float u_motion;
uniform sampler2D u_state;   // r: hover  g: lit  b: dim  a: reveal
uniform float u_selected;

out vec2 v_p;
out float v_r;
out vec3 v_color;
out float v_kind;
out float v_royal;
out vec4 v_state;
out float v_sel;

void main(){
  int id = int(a_id);
  vec4 st = texelFetch(u_state, ivec2(id % 1024, id / 1024), 0);
  float hover = st.r, lit = st.g, reveal = st.a;
  float r = max(a_radius * u_zoom, a_minpx);
  r *= 1.0 + 0.035 * sin(u_time * 1.3 + a_id * 1.7) * u_motion;
  r *= 1.0 + hover * 0.45 + lit * 0.12;
  // pop-in with a little overshoot
  float pop = reveal < 1.0 ? reveal * (1.0 + 0.6 * sin(reveal * 3.14159)) : 1.0;
  r *= pop;
  float ext = r * 2.4 + 6.0;
  vec2 px = (a_center - u_cam) * u_zoom + u_res * 0.5 + a_quad * ext;
  v_p = a_quad * ext;
  v_r = r;
  v_color = a_color;
  v_kind = a_kind;
  v_royal = a_royal;
  v_state = st;
  v_sel = abs(a_id - u_selected) < 0.5 ? 1.0 : 0.0;
  vec2 clip = px / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

export const NODE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_p;
in float v_r;
in vec3 v_color;
in float v_kind;
in float v_royal;
in vec4 v_state;
in float v_sel;
uniform float u_time;
out vec4 o;

vec4 over(vec4 dst, vec3 c, float a){ return vec4(c * a + dst.rgb * (1.0 - a), a + dst.a * (1.0 - a)); }
float ring(float d, float rad, float w){ return smoothstep(w * 0.5 + 0.75, w * 0.5 - 0.25, abs(d - rad)); }

void main(){
  float hover = v_state.r, lit = v_state.g, dim = v_state.b, reveal = v_state.a;
  if (reveal <= 0.001) discard;
  float d = length(v_p);
  float r = v_r;
  float th = atan(v_p.y, v_p.x);
  int kind = int(v_kind + 0.5);
  vec3 ink = v_color;
  vec3 ivory = vec3(1.0, 0.993, 0.975);
  float small = smoothstep(6.0, 3.0, r);

  vec4 c = vec4(0.0);
  // halo
  float halo = exp(-pow(d / (r * 1.7 + 2.0), 2.0)) * (0.16 + 0.30 * lit + 0.45 * hover);
  c = over(c, mix(ink, vec3(1.0, 0.9, 0.7), 0.25), halo);

  if (kind == 6) {
    // a gap in the record: three fading beads
    for (int i = -1; i <= 1; i++) {
      float dd = length(v_p - vec2(0.0, float(i) * r * 0.95));
      c = over(c, ink, smoothstep(r * 0.32 + 0.6, r * 0.32 - 0.4, dd) * (0.75 - abs(float(i)) * 0.2));
    }
  } else {
    float body = smoothstep(r + 0.7, r - 0.4, d);
    c = over(c, mix(ivory, ink, small), body);
    float rw = max(1.1, r * 0.15);
    c = over(c, ink, ring(d, r - rw * 0.5, rw) * (1.0 - small));
    if (kind == 2) {
      // sages: an inner circle, like a seed of light
      c = over(c, ink, ring(d, r * 0.55, max(0.9, r * 0.07)) * (1.0 - small));
      c = over(c, ink, smoothstep(r * 0.2 + 0.6, r * 0.2 - 0.4, d) * (1.0 - small));
    } else {
      c = over(c, ink, smoothstep(r * 0.4 + 0.6, r * 0.4 - 0.4, d) * 0.9 * (1.0 - small));
    }
    if (v_royal > 0.5) c = over(c, ink, ring(d, r * 1.3, max(0.8, r * 0.06)) * 0.55);
    if (kind == 1 || kind == 5) {
      // lotus frame for the celestials
      float petals = kind == 1 ? 8.0 : 6.0;
      float lotus = r * (1.32 + 0.16 * abs(cos(th * petals * 0.5)));
      c = over(c, vec3(0.78, 0.60, 0.22), ring(d, lotus, max(0.9, r * 0.07)) * 0.85);
    }
    if (kind == 3) {
      // serpents: a coiled, broken ring
      float coil = r * 1.3 + sin(th * 3.0 + u_time * 0.6) * r * 0.08;
      c = over(c, ink, ring(d, coil, max(0.8, r * 0.06)) * 0.6 * step(0.0, sin(th * 6.0)));
    }
  }

  // hover: a ring that draws itself around the medallion
  if (hover > 0.01) {
    float sweep = mod(th + 1.5708, 6.28318) / 6.28318;
    float drawn = smoothstep(hover + 0.002, hover - 0.002, 1.0 - sweep);
    c = over(c, ink, ring(d, r * 1.75, 1.3) * drawn * 0.9);
    c = over(c, ink, ring(d, r * 2.05, 0.8) * drawn * 0.35);
  }
  if (v_sel > 0.5) {
    float dash = step(0.0, sin(th * 16.0 + u_time * 1.2));
    c = over(c, ink, ring(d, r * 2.25, 1.2) * dash * 0.8);
  }

  // dimmed: fade and wash out to the milk
  float keep = mix(1.0, 0.16, dim);
  vec3 washed = mix(c.rgb, vec3(c.a * 0.75), dim * 0.6);
  o = vec4(washed, c.a) * keep * smoothstep(0.0, 0.4, reveal);
}`

// ─────────────────────────────── Story arcs ───────────────────────────────

export const STORY_VS = /* glsl */ `#version 300 es
precision highp float;
in vec2 a_pos;
in vec2 a_nrm;
in float a_s;
in float a_t;
in float a_side;
in float a_len;
in vec3 a_color;
in float a_idx;
in float a_delay;

uniform vec2 u_res;
uniform vec2 u_cam;
uniform float u_zoom;
uniform float u_hover;

out float v_s;
out float v_across;
out float v_t;
out float v_lenPx;
out vec3 v_color;
out float v_idx;
out float v_delay;
out float v_hw;

void main(){
  bool on = abs(a_idx - u_hover) < 0.5;
  float hw = on ? 9.0 : 7.0;
  vec2 px = (a_pos - u_cam) * u_zoom + u_res * 0.5 + a_nrm * a_side * hw;
  v_s = a_s * u_zoom;
  v_across = a_side * hw;
  v_t = a_t;
  v_lenPx = a_len * u_zoom;
  v_color = a_color;
  v_idx = a_idx;
  v_delay = a_delay;
  v_hw = hw;
  vec2 clip = px / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

export const STORY_FS = /* glsl */ `#version 300 es
precision highp float;
in float v_s;
in float v_across;
in float v_t;
in float v_lenPx;
in vec3 v_color;
in float v_idx;
in float v_delay;
in float v_hw;
uniform float u_time;     // seconds since these arcs appeared
uniform float u_hover;
uniform float u_motion;
out vec4 o;

void main(){
  // each arc draws itself from the one who acts toward the one acted upon
  float prog = clamp((u_time - v_delay) / 0.75, 0.0, 1.0);
  prog = 1.0 - pow(1.0 - prog, 3.0);
  if (v_t > prog) discard;

  bool any = u_hover > -0.5;
  bool on = abs(v_idx - u_hover) < 0.5;

  // flowing dashes carry the direction of the deed
  float spacing = 11.0;
  float along = v_s - u_time * 16.0 * u_motion;
  float cell = (fract(along / spacing) - 0.5) * spacing;
  float r = on ? 1.7 : 1.35;
  float d = length(vec2(max(abs(cell) - 2.4, 0.0), v_across));
  float dash = smoothstep(r + 0.6, r - 0.5, d);

  float glow = exp(-(v_across * v_across) / (2.0 * 3.0 * 3.0)) * (on ? 0.32 : 0.12);

  // the knot at the middle of every arc — the place to click
  float mid = length(vec2(v_s - v_lenPx * 0.5, v_across));
  float knotR = on ? 5.5 : 4.3;
  float knot = smoothstep(knotR + 0.7, knotR - 0.4, mid);
  float knotRing = smoothstep(0.9, 0.0, abs(mid - knotR - 2.6)) * 0.6;
  float knotHole = smoothstep(1.9, 1.2, mid);

  float ends = smoothstep(8.0, 18.0, v_s) * smoothstep(8.0, 18.0, v_lenPx - v_s);
  float tip = smoothstep(prog, prog - 0.015, v_t);

  vec3 col = v_color;
  float a = max(dash * 0.85 + glow, 0.0) * ends;
  a = max(a, (knot + knotRing) * smoothstep(0.45, 0.55, prog));
  vec3 c = mix(col, vec3(1.0, 0.99, 0.96), knotHole * knot);
  a *= tip;
  if (any && !on) a *= 0.22;
  o = vec4(c * a, a);
}`
