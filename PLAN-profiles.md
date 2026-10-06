# Dvapara Yuga — Character profiles

**Goal:** every one of the 3,616 characters gets a full profile page that opens from their card. The page has the same calm, crafted feel as the Feather Atlas reference, but speaks the map's own visual language: milk, ink, gold, dotted threads and Devanagari.

---

## 1. The idea in one line

> The map shows **where** someone sits in the epic. The profile shows **who** they were.

The profile does not leave the map. Clicking **"Open profile"** on a card makes the card grow into a full page. Behind it, the map stays alive, blurred and slowly drifting toward that character. Pressing Esc (or "Back to the map") shrinks the page back into the card at exactly the spot you left.

Each profile has its own address (`/c/karna`), so a link can be shared or bookmarked and opens straight onto that character.

---

## 2. Layout (desktop), mapped from Feather Atlas

```
┌──────────────┬──────────────────────────────────────────────┬────────────────────────────┐
│ ← Back       │  [Kunti] [Surya] [Adhiratha] [Duryodhana] …  │  HOUSE OF KARNA · ANGA     │
│              │      ↑ kin tabs (portrait · name · bond)     │  Karna                     │
│ LINEAGE      │                                              │  कर्ण  ·  Son of the Sun    │
│ SPINE        │            ┌──────────────┐                  │  [Warrior] [King] [Archer] │
│  Surya ·     │            │              │   कर्ण           │                            │
│    ┊ gold    │            │   PORTRAIT   │  (huge, faint     │  Kunti's firstborn…        │
│  Kunti       │            │  (breathing, │   Devanagari     │                            │
│    ┊         │            │   parallax)  │   watermark)     │  Key facts                 │
│ ◉ KARNA      │            └──────────────┘                  │  ⚔ Weapons  Vijaya bow…    │
│    ┊         │            soft ground shadow                │  ⚑ Banner   Elephant rope  │
│  Vrishasena  │  ◀ ━━━━━━━●━━━━━━━━━━●━━━━━━━━━━━━●━━━━ ▶    │  🐚 Conch    —              │
│  Vrishaketu  │     the 18 books: life timeline              │  ☸ Teacher  Parashurama    │
│              │   "Born in armour, given to the river."      │  ⚔ Side     Kauravas       │
│ ┌──────────┐ │                                              │  ✦ Fate     Day 17, Arjuna │
│ │HOUSE CARD│ │                                              │  Story threads (13) →      │
│ └──────────┘ │                                              │  [ Banner close-up    › ]  │
└──────────────┴──────────────────────────────────────────────┴────────────────────────────┘
```

| Feather Atlas | Dvapara Yuga profile |
|---|---|
| Left nav (bird families) | **Lineage spine:** a compact vertical piece of the river showing 3 generations above, the character, and their children below, drawn with the map's own dotted threads. Every name can be clicked. |
| Featured-species card | **House card:** dynasty emblem, colour and motto line, with "46 of this house on the map" and a link to light them all. |
| Bird tabs (Hoopoe, Kingfisher) | **Kin tabs:** parents, spouses, siblings and rivals as small portrait tiles. Clicking one swaps the portrait with the same slide-and-overshoot animation as the bird switch, so you can walk the family without going back. |
| 3D bird on the stage | **Portrait** (see §3), with idle "breathing", cursor parallax and a slow gold light sweep. |
| Zoom / rotate rail | **Portrait rail:** lean closer, a lamp toggle (day ↔ dusk, the same token swap as Feather Atlas), Devanagari ↔ English name, and "show on map". |
| 360° turn pill | **Life timeline:** the 18 parvas as a slim scrubber. Dots mark where they appear; larger marks are key moments (birth, vow, curse, death). Hovering a mark shows the moment and clicking opens it. |
| Caption | **Epigraph:** one italic line that holds the whole life. |
| Key traits | **Key facts:** born of, house, spouses, children, teacher, weapons, banner, conch, mount or charioteer, side in the war, fate. |
| Habitat | **Realm:** kingdom, capital and allegiance. |
| Close-up detail | **Banner close-up.** The epic names each hero's battle banner (Arjuna's monkey, Bhishma's palm tree, Drona's water-pot, Karna's elephant rope). The lens zooms onto a drawn emblem of it. |

**Below the fold** (the page scrolls gently; the hero section stays 100vh):
1. **Their story:** the story moments as a vertical chapter list in parva order, each with its source label.
2. **Relationships:** grouped chips for family, teachers, allies, rivals and slayer/slain.
3. **Also known as:** every epithet, with its meaning where known ("Partha, son of Pritha").
4. **Sources and variants:** the critical edition versus later tradition, plus the Sørensen index entry.

**Tablet:** the lineage spine collapses into a horizontal strip.
**Phone:** a portrait-first stack with the details in a bottom sheet, the same pattern as Feather Atlas.

---

## 3. Portraits: one consistent style for 3,616 people

Painting 3,600 portraits by hand or with AI is neither realistic nor consistent, so the plan has two layers that share one visual system.

### Layer A: medallion portraits, for everyone, at no cost
Every character gets a **generated emblem portrait** in the map's style, so no page is ever empty:
- **Frame** by kind: the lotus ring for celestials, the double ring for royals, the coiled ring for nagas, the seed ring for sages.
- **Colour** from their house.
- **Centre:** their Devanagari initial in gold leaf over a woven pattern unique to them (seeded from their id).
- **Motif** from their role: bow, mace, discus, kamandalu, crown, serpent and so on.

Rendered live as SVG or WebGL, these animate gently: the ring draws itself, the gold catches the light.

### Layer B: painted portraits, for the main characters
For about 70 tier-1 characters first (then about 250 tier-2), a **painted bust** in one fixed art direction:
- the same framing: three-quarter bust, facing right, transparent background (exactly like the bird PNGs);
- the same light: soft warm key from the upper left, cool rim light;
- the same palette: ivory, ink, the house colour and gold;
- one **style bible** prompt with a character sheet for each person, so Arjuna looks like the same Arjuna on every page and in his kin tiles.

Each painted portrait **replaces** the medallion on that character's page and kin tiles; the medallion becomes a small badge in the corner. "Animated" means breathing, parallax and light sweep at first. Short looping video portraits for the top 20 could follow later.

---

## 4. Data each profile needs

| Field | Tier 1–2 (≈340) | Everyone else (≈3,270) |
|---|---|---|
| Name, Devanagari, house, kin | ✓ already in the map | ✓ already in the map |
| Summary | ✓ curated | Sørensen's description |
| Story moments, appears-in parvas | ✓ | ✓ (from the index) |
| **Epigraph** | research | generated from the description |
| **Roles** (warrior, king, sage…) | research | inferred from the description |
| **Weapons, banner, conch, bow, mount, charioteer** | research (the epic lists these) | where the index records them |
| **Teachers and students** | research | from the index (teacher/pupil links) |
| **Side in the war, day and manner of death** | research (battle books) | "slain by" links from the index |
| **Epithets with meanings** | research | aliases (meanings where obvious) |
| **Life timeline** (key moments with their parva) | research | appears-in parvas only |

Research sources: the Ganguli translation (public domain) for battle books, banners and conches; Sørensen for cross-checks; critical-edition notes for variants.

---

## 5. Build phases

| Phase | Delivers | Cost |
|---|---|---|
| **P1 · Profile shell** | Routes (`/c/:id`), the card-to-page transition, hero layout, lineage spine, kin tabs, life timeline, key facts, below-the-fold sections, medallion portraits for all 3,616, phone and tablet layouts | none |
| **P2 · Deep data** | Researched profiles for the ~70 tier-1 characters (banners, conches, weapons, teachers, war side, death, epigraphs, timelines), then tier 2 | none |
| **P3 · Portrait style** | 3 style directions × 3 test characters (Karna, Draupadi, Krishna). You pick one; I write the style bible. | image-generation credits |
| **P4 · Portraits** | Painted portraits for tier 1 with consistent character sheets, plus breathing, parallax and light animation | image-generation credits |
| **P5 · More** | Tier-2 portraits; optional looping video for the top 20 | credits |

P1 and P2 make every profile complete and beautiful with no images at all. P3 and P4 then layer the paintings on top.

---

## Status (2026-10-06)

**Decisions:**
- Pahari-miniature art direction.
- Test portraits (Karna, Draupadi, Krishna) first, then ask before generating the full set.
- P1 built in parallel.

**P1, done.** Every one of the 3,616 characters has a profile at `/c/:id`:
- **Opening and closing:** opens from the card or the story panel. The map stays alive behind it, blurred. Browser back and forward work, and shared links open straight onto a profile.
- **Layout:** lineage spine and house card on the left. On the stage, a breathing, parallax medallion portrait with the Devanagari name as a watermark. Kin tabs that walk the family with a spring-slide swap.
- **Life timeline:** marks for each story moment across the 18 books.
- **Key facts:** born of, spouses, children, siblings, house, teachers, allies, rivals, served, slew / slain by, fate, first seen.
- **Below the fold:** the story as chapters, also known as, appears in, sources.
- **Controls:** a day/dusk lamp (remembered between visits), a Devanagari name toggle, and "show on the map".
- **Smaller screens:** tablet and phone layouts.

**Medallion portraits for everyone:**
- frame by kind (lotus for celestials, double ring for royals, coil for nagas, spikes for asuras, seed ring for sages);
- house colour;
- a rosette unique to each id;
- the first Devanagari syllable in shimmering gold;
- a role motif (bow, mace, discus, crown, serpent, flame, water-pot, wheel).

**P3, blocked:** the connected image account has 0 credits and no trial allowance. Painted portraits go in `src/profile/portraits.ts` (id → URL) once they exist; nothing else changes.

**Next:** P2, the researched data (banners, conches, weapons, teachers, war side, death, epigraphs) for the tier-1 characters.
