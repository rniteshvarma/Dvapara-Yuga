# The census of characters

How the map grows from 341 hand-curated characters to every person named in the epic.

## Source

**S. Sørensen, *An Index to the Names in the Mahābhārata* (London, 1904).** It is public domain and indexes every proper name in the epic, with a short gloss and every place the name is cited. The digitised, proofread text comes from the Cologne Digital Sanskrit Lexicon (dictionary code `INM`).

Sørensen cites the **Calcutta and Bombay editions** (the vulgate), not the later BORI Critical Edition. That is why links drawn from the index carry the **Index** source label and are hidden by the "Vyasa's text only" switch until they are checked against the Critical Edition.

## Rebuild

```bash
sh research/fetch.sh                                   # download INM (7 MB)
python3 research/parse_inm.py                           # → inm.json (12,647 entries)
python3 research/classify.py                            # person / alias / place
npx tsx scripts/export-curated.ts > research/curated.json
PYTHONPATH=research python3 research/build_census.py    # → src/data/census.json
npm run validate
```

## What the pipeline does

1. **Classifies** all 12,647 entries.
   - About 3,600 are **people**: humans, gods, sages, asuras, nāgas, apsaras, Skanda's host, and named animals.
   - About 5,400 are **other names**: epithets, disguise names (Kaṅka = Yudhiṣṭhira) and spelling variants. These become search aliases.
   - The rest are places, peoples, sections and the "1000 names" hymns.
2. **Matches the curated characters** onto their entries, so they gain aliases and citations.
   - About 50 homonyms are pinned by hand in `L_OF`: Bhīṣma's main entry is filed under "Anukram.", and there are three Rāmas, eight Bhīmas and a dozen Citrasenas.
   - A new entry that shares a curated character's name *and* a relative is merged into it.
3. **Reads relationships from the glosses**:
   - son / daughter / wife / mother / brother of → family threads
   - charioteer / minister / maid / teacher / pupil / friend of → story threads
   - "slain by X" in the citation notes → a story thread
4. **Places everyone**:
   - People linked to the tree inherit a generation from their relatives.
   - Self-contained families become **islands** (Nala, Rāma, Kubera, Sāvitrī…).
   - Everyone else goes into a themed **constellation**.

## Known limits

- **Name resolution is heuristic.** A bare name in a gloss resolves to a main character if one exists, otherwise to the most-cited namesake. Mistakes are possible among minor namesakes; open `census.json` and search for the id to audit one.
- **The hundred Kauravas.** Sørensen lists *every* name the epic gives a son of Dhṛtarāṣṭra across all its lists, which comes to about 180. Exact matches are merged; the rest sit in the Kaurava constellation with a note that the lists differ.
- **Names outside the epic are not in the index.** Later retellings (Vṛṣālī, Barbarīka, Shakuni's prison story) need the curated layer, as they have now.
- **Interactions.** Glosses record only the defining relationship. Most story moments still come from the curated `stories.ts`. Deeper interactions for minor characters need a chapter-by-chapter reading, which is planned next.
