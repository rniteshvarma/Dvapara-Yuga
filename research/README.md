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
# research/ganguli.txt: the full-text (djvu.txt) download of archive.org item
#   the-mahabharata-of-krishna-dwaipayana-vyasa-complete-18-volumes-kisari-mohan-ganguli_202008
PYTHONPATH=research python3 research/verify_text.py     # → src/data/evidence.json, research/verification_report.txt
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

## Checking every bond against the text

`verify_text.py` reads **K. M. Ganguli's English translation (1883–96, public domain)** and, for every family bond and every
"slain by" link, looks for one passage that names both people together with a word for that bond (son, begot, wife, wedded,
brother, foster, slew…). It never matches across a section heading, and a name shared by several people (an epithet such
as "Ajamidha") does not count as evidence for any of them.

- A bond it finds is **confirmed**, and its passage, book and section are shown on the profile ("Family, as the epic tells it").
- A bond the text tells in other words is cited by hand (`MANUAL`), anchored to the exact place in the text.
- A bond the Mahabharata does not tell, because it comes from the Harivamsha or the Puranas, is labelled **later tradition** (`LATER_LINKS` and each character's `v` note).
- What remains is listed in `verification_report.txt` for review. These are mostly index links taken from lists of names, which the matcher cannot read.

The current state: every curated bond is either confirmed in the text or labelled later tradition.

The first audit found and fixed these errors:
- Index entries marked "(do.)" (ditto) took on the whole description of the entry before them, so Śaibyā², ³ and ⁴ (the wives of Sagara, Dyumatsena and Kṛṣṇa) all read as "= Sunandā, wife of Pratīpa".
- "Slain by" clauses about someone else were read as the entry's own death ("her husband had been slain by Garuḍa", "of whom five are slain by Irāvat").
- A bare "Arjuna" or "Bhīma" in a death note resolved to Kārtavīrya or the king of Vidarbha instead of the Pandava.
- Deaths the text contradicts were removed (Krishna → Jarasandha, Jayadratha → Abhimanyu, Ashwatthama → Parikshit), and the famous deaths of the war were added to the curated stories.
- Namesakes are told apart wherever a name could be mistaken: Krishna's queen Gandhari is "a princess of Gandhara", with "Not to be confused with Gandhari, the blindfolded queen" on her page.

## Known limits

- **Name resolution is heuristic.** A bare name in a gloss resolves to a main character if one exists, otherwise to the most-cited namesake. Mistakes are possible among minor namesakes; open `census.json` and search for the id to audit one.
- **The hundred Kauravas.** Sørensen lists *every* name the epic gives a son of Dhṛtarāṣṭra across all its lists, which comes to about 180. Exact matches are merged; the rest sit in the Kaurava constellation with a note that the lists differ.
- **Names outside the epic are not in the index.** Later retellings (Vṛṣālī, Barbarīka, Shakuni's prison story) need the curated layer, as they have now.
- **Interactions.** Glosses record only the defining relationship. Most story moments still come from the curated `stories.ts`. Deeper interactions for minor characters need a chapter-by-chapter reading, which is planned next.
