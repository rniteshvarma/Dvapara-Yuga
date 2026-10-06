# Dvapara Yuga — The Living Tree of the Mahabharata

**Phase 1 plan: an interactive, animated lineage map**

---

## 1. The concept

The family tree should feel like it is breathing. It should not look like a chart.

A milky, slowly moving sky. Hundreds of small points of light hang in it, connected by dotted threads that drift a little, like silk in still air. From far away the whole lineage reads as one shape: a river of descent. It starts with the creators at the top (Brahma, then Atri, then Chandra, the Moon) and flows down through Pururavas, Yayati, Puru, Dushyanta and Bharata, then Kuru and Shantanu. It splits into the Kauravas and Pandavas, passes through Kurukshetra, and narrows at the bottom to Parikshit and Janamejaya, who hears the whole story told.

The design principle is **calm at rest, alive on contact.** Nothing shouts until you touch it. When you hover, the part of the tree you're touching wakes up.

Where it beats MiroFish-style graphs:

| MiroFish-style graph | Vamsha |
|---|---|
| Force layout, so positions jitter and nothing has a meaning | Time flows top to bottom (generations) and dynasties sit side by side, so the position itself tells the story |
| Every label shows at once, which is cluttered | Semantic zoom: labels and detail appear only as you zoom in |
| Hover shows a tooltip | Hover lights up the bloodline: ancestors glow upward, descendants ripple downward, everything else dims |
| Every edge looks the same | Each kind of relationship has its own visual language (see §3) |

---

## 2. What the user experiences

### 2.1 Arrival (about 4 seconds, skippable)
1. A milky white screen with soft drifting texture. A single line of serif text: *"In the beginning, there was the lineage."*
2. Particles drift in from the edges and settle into place, top to bottom, generation by generation, like the story being told in order.
3. The dotted threads draw themselves between the dots. The camera rests on the full tree, zoomed out.

### 2.2 Zoom levels (semantic zoom)
| Zoom | What you see |
|---|---|
| **Far** (default) | Dots and threads only. Dynasty regions are softly tinted. Large faint labels for eras: *Chandravamsha*, *Kuru*, *Kurukshetra*, *After the War* |
| **Mid** | Names of the 40–60 key figures fade in (Bhishma, Kunti, Karna, Krishna…) |
| **Near** | Every name appears. Nodes become framed medallions with a Devanagari initial and a dynasty ring |

### 2.3 Hover (the "wow" moment)
- The node blooms: its ring draws itself in about 300 ms, and the medallion scales up slightly with a spring.
- **Bloodline illumination:** light pulses travel *up* the dotted threads to the ancestors and *down* to the descendants. Spouses glow along their own thread. The rest of the tree drops to about 12% opacity.
- **Glass card:** a frosted card fades and slides in beside the node:
  - Name, Devanagari name, primary epithet (e.g. *Karna · कर्ण · "Son of the Sun"*)
  - A role line (e.g. *Eldest son of Kunti, raised by a charioteer, king of Anga*)
  - Parents, spouse(s), children (each one is a link)
  - Dynasty chip, the parva where they first appear, and their fate (e.g. *Slain by Arjuna, Day 17*)

### 2.4 Click, search and navigation
- **Click** flies the camera to the node and pins it there, focused. You can move to linked relatives from the card, so you can walk the family on foot.
- **Search (⌘K or /)** uses fuzzy search across names, alternate names and epithets. *Partha*, *Gangeya* and *Vasudeva* all resolve correctly. Picking a result flies the camera to that character.
- **"How are they related?"** (stretch goal for Phase 1): pick two characters and the shortest family path between them lights up, with a sentence explaining it, e.g. *"Karna is Arjuna's elder half-brother through Kunti."*
- **Mini-map** in a corner, plus **inertial pan and zoom** with trackpad, wheel, touch and pinch.

### 2.5 Era scrubber
A thin timeline along the bottom: *Origins → Adi → Sabha → Vana → Virata → Udyoga → Kurukshetra (18 days) → After the War → Mahaprasthana*. Dragging it reveals the tree up to that point in the story. Characters who die during the war fade to hollow "ember" outlines, so the scale of loss becomes visible on the map.

### 2.6 Ambient details
- The cursor leaves a soft ripple in the milky background.
- Idle nodes drift on Perlin noise, a few pixels at most, so the tree floats.
- Optional tanpura drone, off by default.
- `prefers-reduced-motion` is fully respected.

---

## 3. Visual language

**Palette:** milk, ivory and pearl backgrounds. Ink-indigo for threads. One accent per dynasty, all muted (saffron for Kuru, lotus pink for Panchala, peacock blue for Yadava, and so on). Old gold for anything divine.

**Type:** an editorial serif for names (*Cormorant* or *Fraunces*), a quiet sans for UI (*Geist* or *Inter Tight*), and *Tiro Devanagari Sanskrit* for Sanskrit names.

**Relationship grammar.** This is the core of the design:

| Relationship | Thread style |
|---|---|
| Parent → child (blood) | Fine dotted line with slow particles flowing downward |
| Marriage | Two parallel dotted lines, a ribbon |
| Divine fatherhood (Surya→Karna, Dharma→Yudhishthira, Vayu→Bhima, Indra→Arjuna, Ashvins→Nakula & Sahadeva) | Shimmering **gold** dots |
| Niyoga (Vyasa→Dhritarashtra, Pandu, Vidura) | Dashed line with a small "rite" glyph at the midpoint |
| Adoption / fostering (Adhiratha→Karna, Kuntibhoja→Kunti, Nanda→Krishna) | Hollow dots |
| Curse- or boon-born (Drona from a vessel, Draupadi from fire, Shikhandi reborn as Amba) | Ember-colored dotted line with a soft glow |

**Node frames:** a circle for mortals, a lotus-petal frame for divine beings, a double ring for kings and queens. Ring color shows dynasty.

---

## 4. Scope of characters (target ≈ 300–350)

1. **Origins:** Brahma, Atri, Chandra, Budha + Ila, Pururavas + Urvashi, Ayu, Nahusha, Yayati (Devayani, Sharmishtha), with their sons Yadu, Puru, Turvasu, Druhyu, Anu. The Yadu branch flows into the Yadavas and the Puru branch flows into the Kurus.
2. **The Puru / Bharata line:** Dushyanta + Shakuntala, Bharata, Hastin, Kuru, … , Pratipa, Shantanu.
3. **Kuru core:** Shantanu with Ganga and Satyavati, Bhishma, Chitrangada, Vichitravirya, Amba / Ambika / Ambalika, Vyasa, Dhritarashtra, Pandu, Vidura.
4. **Pandavas and Kauravas:** all five Pandavas, the 100 Kauravas (the main ones shown individually, the rest gathered into an expandable "Kaurava constellation"), Duhshala, Yuyutsu, and the wives and children of each line (Upapandavas, Abhimanyu, Ghatotkacha, Iravan, Babhruvahana, Lakshmana Kumara…).
5. **Allied houses:** Panchala (Drupada, Dhrishtadyumna, Shikhandi, Draupadi), Yadava/Vrishni (Vasudeva, Krishna, Balarama, Subhadra, Pradyumna, Aniruddha, Satyaki, Kritavarma), Gandhara (Subala, Shakuni), Madra (Shalya, Madri), Matsya (Virata, Uttara, Uttar, Kichaka), Kekaya, Magadha (Jarasandha), Chedi (Shishupala), Sindhu (Jayadratha).
6. **Gurus and sages:** Parashurama, Drona, Kripa, Kripi, Ashwatthama, Vyasa's line (Shuka), Bharadvaja, Durvasa, Narada.
7. **Celestials and Nagas:** Surya, Indra, Vayu, Dharma/Yama, the Ashvins, Ganga, Ulupi, the Vasus (Bhishma's previous birth).
8. **After the war:** Parikshit, Janamejaya, Vajra (Krishna's great-grandson), the survivors, and the Yadava self-destruction at Prabhasa.

**Source discipline:** I'll use the BORI Critical Edition as the primary reference, with the Ganguli translation as secondary. Wherever traditions disagree (lineage gaps in the Puru line, Draupadi's sons' wives, Karna's sons), the node carries a small "variant tradition" marker instead of quietly choosing one version.

---

## 5. Technical architecture

| Layer | Choice | Why |
|---|---|---|
| App shell | **Vite + React + TypeScript** | Fast, simple, and grows easily into Phase 2 |
| Graph rendering | **PixiJS v8 (WebGL)** | Keeps 350 nodes, about 700 animated dotted edges and particle trails at 60 fps, which SVG and the DOM can't |
| Background | A custom **GLSL fragment shader** (milky fbm noise plus cursor ripple) | Silky motion that costs almost nothing |
| Layout | A **build-time script**: generation determines y, a dynasty-aware ordering determines x, then light d3-force relaxation, written to `layout.json` and hand-tunable | Positions are stable and meaningful, never jittery, and loading is instant |
| Camera | Custom spring camera (inertia, fly-to, zoom-to-cursor) | The feel of the motion matters more than anything else here |
| UI overlays | React + **Motion (Framer Motion)** | Glass cards, search, scrubber |
| Search | **Fuse.js** | Fuzzy matching across alternate names |
| Data | `characters.json` + `relations.json`, validated with **Zod** | Typed, checkable, and ready for Phase 2 stories |
| Hosting | **Vercel** (connector already available) | One-command preview links |

**Data shape (sketch):**
```ts
Character { id, name, devanagari, aliases[], gender, dynasty, generation,
            kind: 'mortal'|'divine'|'sage'|'naga'|'asura', roles[], epithet,
            summary, firstParva, fate?, variantNote? }
Relation  { from, to, type: 'parent'|'spouse'|'divine-father'|'niyoga'|
            'adoptive'|'boon-born', note? }
```

**Performance budget:** 60 fps on an M1 MacBook Air and a mid-range Android phone, under 300 KB of JS (gzipped) on first load, and first paint in under 1.5 s.

---

## 6. Milestones

| # | Milestone | Deliverable |
|---|---|---|
| M0 | Scaffold | Vite/React/TS/Pixi project, design tokens, fonts |
| M1 | **Dataset v1** | About 300 characters and relations with a validation script that catches orphan nodes, impossible generations and duplicate aliases |
| M2 | Layout engine | Generation-band plus dynasty layout, `layout.json`, debug view |
| M3 | Renderer | Milky shader background, dotted and flowing threads per relationship type, node frames, camera |
| M4 | Interactions | Hover bloom, bloodline illumination, glass card, click-to-focus, search |
| M5 | Story layers | Intro sequence, era scrubber, war "ember" state, mini-map |
| M6 | Polish | Mobile and touch, reduced motion, keyboard navigation, performance pass, Vercel deploy |
| ★ | Stretch | "How are they related?" path finder |

**Status (2026-10-06):** M0–M4 done, plus the intro sequence (M5, partial) and mobile layout (M6, partial).
Still to do: era scrubber, mini-map, the relationship path finder, keyboard navigation between nodes, and a performance pass on low-end Android.

I'll show you a working preview at the end of M3. That is when the "feel" decisions get made, so it's the right point for your input.

---

## 7. Phase 2 preview (not built now)
Rich character pages with story arcs per parva, an illustrated portrait set in one consistent style (the Higgsfield image connector is already attached), relationships beyond family (guru, rival, oath, curse), story trails ("follow Karna's life"), Hindi and Telugu translations, and shareable deep links.

---

## 8. What I need from you

**Nothing is required to start.** Node and npm are installed and every library is free. Optional items for later:
1. **A name.** I'm using *Vamsha* (वंश, "lineage") as a working title.
2. **Deployment:** should I deploy previews to your Vercel account (the connector is already present), or keep everything local for now?
3. **GitHub:** if you'd like version control on GitHub, run `gh auth login` once, or tell me to keep it as a local git repo only.
4. **Domain:** only when we go public.
