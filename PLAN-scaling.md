# Dvapara Yuga — Scaling to every character

**Goal:** include every named person in the Mahabharata and its retellings, potentially thousands, plus the story connections between them, without the map ever feeling cluttered.

---

## 1. The core principle: two layers, revealed differently

There are two kinds of connection, and they need different treatment.

| Layer | What it is | When it's visible |
|---|---|---|
| **Lineage** (blood, marriage, adoption, divine birth) | The structure of the epic. It's what the map *is*. | Always, as it works today. |
| **Story** (mentor, rival, killed, served, cursed, vowed, betrayed, befriended…) | What happened between people. | **Only in focus.** It's never drawn on the overview. |

If both layers were drawn at once, a thousand characters would produce tens of thousands of lines, and the map would stop meaning anything. So the rule is: **family is the map, and story is what you see through it.**

---

## 2. How thousands of characters stay calm: five levels of presence

Every character gets a *presence level*. Presence decides when they appear, not whether they exist.

| Level | Who | Roughly | On the overview |
|---|---|---|---|
| **Pillars** | Krishna, Arjuna, Karna, Bhishma, Draupadi… | ~60 | Always visible and named |
| **Principals** | Shakuni, Virata, Jarasandha, Shishupala, Ekalavya… | ~250 | Visible as dots; names appear at mid zoom |
| **Supporting** | Kichaka, Sudeshna, Uluka, Subala, Barbarika, the Kekaya princes… | ~800 | Small dots; names appear when close |
| **Named** | Warriors in battle lists, kings at the Rajasuya, sages in the forest | thousands | **Inside constellations only** (see below) |
| **Groups** | "The 100 Kauravas", "The 5 Kekaya brothers", "Sages of Naimisha" | — | A single glowing knot showing a count |

### Constellations: how big families and courts collapse

The Kaurava disc you've already seen is the first example. It becomes a general mechanism:

- **Family constellations:** the hundred sons, Krishna's 80 sons, Jarasandha's allies.
- **Court constellations:** "Court of Matsya": Virata, Sudeshna, Kichaka and his 105 Upakichaka brothers, ministers.
- **Assembly constellations:** "Kings at the Rajasuya", "Sages of the Naimisha forest".

A constellation is drawn as one softly glowing knot with a small count (for example **·105**). It **blooms open** in an animated spiral when you zoom in close or click it, and folds back when you leave. One thread connects it to the family, so the overview stays as clean as it is today.

### Kingdoms as places, not lines

Kingdoms (Matsya, Magadha, Chedi, Gandhara, Madra…) are shown as **soft tinted regions**: a faint watercolour wash behind their people, with the kingdom's name in large faint type at mid zoom. "Kichaka served Matsya" then needs no line at all, because he is *inside* Matsya's region. Realms connect people without adding threads.

---

## 3. Focus mode: what happens when you click Shakuni

1. **The world steps back.** Everything not connected to Shakuni fades to about 8%.
2. **Family lights up in place,** exactly as it does now: Subala above, Gandhari beside him, Uluka below.
3. **Story threads appear:** curved arcs, drawn on top of the map, to everyone he interacted with. Each kind of interaction has its own colour and motion:
   - dice and deceit (Yudhishthira, Duryodhana)
   - killed by (Sahadeva)
   - vow and grievance (Subala)
   - alliance (Karna, Duhshasana)
4. **Only the most significant threads draw at once** (at most about 12). The rest wait in the side panel, grouped by kind. Hovering a row there draws that single arc.
5. **People who are off-screen** show up as small labelled pills at the screen edge, pointing toward where they are ("Sahadeva →"). Clicking a pill flies the camera there.

Characters keep their places on the map; nothing is rearranged. Your sense of where everyone sits is the most valuable thing the map gives you, so it is never broken.

### Story moments: clicking a thread

Clicking a story arc, or a row in the panel, opens a **Story Moment** card:

```
 THE PRISON OF GANDHARA                    ◦ Later tradition
 Shakuni  ⟶  Subala

 Imprisoned with his family by the Kurus, Subala starved while his
 sons shared a single grain of rice each day, so that the youngest,
 Shakuni, might survive. Dying, he crippled Shakuni's leg so he would
 never forget, and bade him avenge them. From his father's bones
 Shakuni made the dice that never lost.

 Source  Regional / folk retelling — not in Vyasa's text
 Leads to  ▸ The Dice Game (Sabha Parva)   ▸ Death at Kurukshetra
```

**A note on accuracy, important for a reference site.** Your Shakuni example is a good test case: the prison story and the dice made from bones are **not in the Mahabharata itself**. They come from later folk and television retellings. In Vyasa's text, Shakuni's motives are never explained that way. The design handles this honestly:

- Every story moment carries a **source badge**:
  - **Critical Edition**
  - **Vulgate / Southern recension**
  - **Purana / Harivamsha**
  - **Regional / Folk**
  - **Modern retelling** (TV, novels)
- A single toggle, **"Vyasa's text only,"** hides everything that isn't from the epic. That makes the site useful to scholars as well as curious readers.
- Each moment links to *what it led to*. That turns isolated facts into a chain you can follow: Subala's vow → the dice game → the exile → the war.

### Walking the story

- Clicking any name inside a card moves the focus to that person, keeping the camera's sense of direction.
- A **trail** of crumbs at the top (*Shakuni › Subala › Gandhari*) lets you step back.
- This makes exploring feel like following a story rather than searching a database.

---

## 4. Navigation aids that become essential at scale

| Aid | Why it matters at 1,000+ characters |
|---|---|
| **⌘K search** (exists) | Extended to kingdoms, events and story moments: "dice game", "Matsya", "Ekalavya's thumb" |
| **Lenses** (top-centre segmented control) | **Lineage** · **Kingdoms** · **War** (who fought for whom, and who killed whom) · **Teachers** (guru lines). Each lens re-tints the same map; it never redraws it. |
| **Mini-map** | A small overview in one corner showing where you are in the river |
| **"How are they related?"** | Pick two people and the shortest path lights up, family and story both, with a sentence of explanation |
| **Era scrubber** | Shows the map as it stood at a moment in the story; the dead fade to hollow ember outlines |
| **Relevance glow** | In the overview, a subtle pulse on pillar characters invites first-time visitors to click them |

---

## 5. Data: how to gather every name, accurately

Thousands of characters can't be typed into one source file the way the first 333 were. The data needs to become a reviewed corpus.

### Proposed shape

```
data/
  characters/          one YAML file per house or kingdom (kuru.yaml, matsya.yaml…)
  groups/              constellations (kauravas.yaml, upakichakas.yaml…)
  realms/              kingdoms: name, capital, ruler by era, allegiance in the war
  story/               story moments, one file per parva (adi.yaml, sabha.yaml…)
```

Every relation and every story moment records:
- **where it's told** (parva and chapter)
- **its tradition** (one of the source badges above)
- **who reviewed it**

### Sources (all usable without copyright problems)

1. **Sørensen, *An Index to the Names in the Mahabharata* (1904).** This is the definitive index of every name in the epic, with references, and it is public domain. It is the backbone for "don't miss anyone".
2. **K. M. Ganguli's English translation (1883–96)**, public domain. Used for chapter-by-chapter extraction of who did what to whom.
3. **The BORI Critical Edition**, used as the authority for deciding what counts as "Vyasa's text".
4. **Harivamsha and the Puranas**, for the Yadava and other extended lines, badged as such.
5. **Folk and TV traditions** (Barbarika, Shakuni's prison, and so on), included and clearly badged.

### Pipeline

I extract names and interactions parva by parva from the public-domain texts. A validator then checks the results: no orphan characters, no impossible generations, no duplicate names, every link cited. Each batch is published to the map as a reviewable change so you can check it before it goes live.

---

## 6. Engine changes needed

The renderer already handles this scale on the GPU. These parts need to grow:

- **Layout computed at build time** (written to `layout.json`), because running the layout for 3,000 nodes in the browser would slow the first load.
- **Constellation bloom:** clusters expand and collapse with a level-of-detail switch tied to zoom.
- **Realm regions:** soft watercolour fields rendered in the background shader from each kingdom's member positions.
- **Story arcs:** a second thread type that is only drawn in focus, arcing above the map instead of hanging below it.
- **A spatial index** for hit-testing and label collision with thousands of nodes.
- **Data loaded in chunks:** the "Named" level loads only when you zoom into a constellation, keeping the first load fast.

---

## 7. Roadmap

| Step | What | Why this order |
|---|---|---|
| **1.5a — Prove the UX** | Data schema v2, focus mode, story arcs, Story Moment cards, constellations and realms. Fully done for **10 pilot characters**: Shakuni, Karna, Bhishma, Draupadi, Krishna, Kichaka, Jarasandha, Shishupala, Barbarika, Ekalavya. | We confirm the interaction feels right on a small set *before* pouring in thousands of entries. |
| **1.5b — Navigation** | Trail, off-screen pills, lenses, mini-map, "Vyasa's text only" toggle | These only become necessary once the data grows. |
| **2a — The great census** | Parva-by-parva extraction against Sørensen's index, reviewed in batches | This is where the map grows into the thousands. |
| **2b — The story layer** | Story moments for every significant interaction, linked into "what led to what" chains; era scrubber | Turns the map into a way to read the epic. |

---

## Status (2026-10-06)

**1.5a, partly done:**
- **Lineage / Stories switch.** Family threads and story threads never draw at the same time. Shortcut: `S`.
- **Bridge into Stories.** The Lineage card has a "Follow their story" link that opens Stories mode on the same person.
- **Stories overview.** Characters who have stories glow; the family map fades to the background.
- **Focus.**
  - Clicking a character draws colour-coded story arcs that flow from the one who acts to the one acted upon.
  - The camera frames everyone the character is linked to.
  - People who are off-screen appear as labels at the screen edge, and clicking one flies there.
- **Story panel.** Threads are grouped by kind. Hovering a row isolates its arc. Clicking a row or an arc's knot opens the Story Moment card, with "Grew out of" / "Led to" links between moments.
- **Sources.** Every moment carries a source label, and the "Vyasa's text only" switch hides non-canonical episodes.
- **Breadcrumbs.** A trail of the characters you've followed sits under the switch.
- **Data.** 65 story moments for the 10 test characters, plus 8 new side characters (the Upakichakas, Susharma, Dantavakra, Jara the hunter, the captive kings, Hamsa, Dimbhaka, Maurvi).

**Still to do for 1.5a:**
- general constellations (beyond the Kaurava disc)
- shaded kingdom areas
- moving the data to YAML files
- computing the layout at build time

**2a, first census pass (2026-10-06):**
- 3,616 characters: 341 curated plus 3,275 from Sørensen's Index.
- 1,314 family links, 497 story moments, 3,364 alternate names.
- The family tree gains 542 relatives; minor children are gathered into 12 "broods".
- 35 tale-islands and 12 constellations with clickable titles.
- Spelling-forgiving search, plus an "Appears in" grid of the 18 books on every card.
- Method and known limits: see `research/README.md`.
