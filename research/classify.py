"""Classify every entry of Sørensen's Index to the Names in the Mahabharata (INM).

Each entry becomes one of:
  person  — a being who could stand on the map (human, god, sage, asura, serpent, animal with a name…)
  alias   — an epithet or another name for someone ("= Śiva", "= Arjuna")
  place   — rivers, tīrthas, mountains, cities, countries, peoples, sections, adjectives…
Output: research/inm_classified.json
"""
import json
import re

E = json.load(open('research/inm.json'))


def clean(s):
    s = re.sub(r'<sup>(.*?)</sup>', r'^\1', s)
    s = re.sub(r'\{[%@]|[%@]\}', '', s)
    return re.sub(r'\s+', ' ', s).strip()


ALIAS_START = re.compile(r'^(\^\d+\s*)?(\(do\.\)\s*|sg\.\s*|\(pl\.\)\s*|pl\.\s*|\(“[^”]*”\)\s*|\([^)]*\)\s*)*=\s*')
PLACE = re.compile(
    r'\b(tīrtha|river|mountain|city|town|forest|lake|country|region|kingdom|hermitage|āśrama|grove|pool|well|island|'
    r'sea|ocean|world|heaven|hell|region|province|district|plain|cave|peak|desert|tree|plant|metre|hymn|sāman|mantra|'
    r'section|episode|chapter|upākhyāna|parvan|weapon|arrow|bow|sword|conch|banner|chariot|vimāna|palace|hall|'
    r'sacrifice|vow|rite|festival|constellation|nakṣatra|lunar mansion|month|day|year|yuga|kalpa|caste|people|tribe|'
    r'family|race|school|sect|doctrine|metre|musical|tune|dance|a fire|fires|gate|road|path|ford|bathing-place)\b',
    re.I)
PERSON = re.compile(
    r'\b(son|daughter|wife|husband|mother|father|brother|sister|grandson|granddaughter|grandfather|'
    r'king|queen|prince|princess|ṛṣi|rishi|muni|brahman|brāhmaṇa|brāhmaṇī|Asura|Asurī|Daitya|Dānava|Rākṣasa|Rākṣasī|'
    r'Piśāca|Nāga|serpent|snake|Apsaras|Gandharva|Devagandharva|Yakṣa|Yakṣī|Kiṃnara|Kinnara|Guhyaka|Suparṇa|'
    r'warrior|hero|chief|general|commander|senāpati|minister|purohita|priest|charioteer|sūta|physician|hunter|'
    r'fowler|mendicant|ascetic|sage|seer|teacher|pupil|disciple|śūdra|vaiśya|kṣatriya|caṇḍāla|maid|servant|'
    r'slave|nurse|courtesan|woman|man|boy|girl|child|female|mātṛ|attendant|companion|follower|Prajāpati|Vasu|'
    r'Rudra|Āditya|Viśvadeva|Marut|Sādhya|god|goddess|deity|demon|Vidyādhara|Siddha|Cāraṇa|Pitṛ|manes|Manu|'
    r'patriarch|horse|steed|elephant|bird|dog|bitch|jackal|vulture|crow|parrot|pigeon|tortoise|fish|mouse|cat|'
    r'monkey|ape|bear|deer|cow|bull|lion|tiger|ichneumon|owl|crane|swan|frog|worm|insect|Pāṇḍava|Kaurava|'
    r'Pāñcāla|Yādava|Vṛṣṇi|Andhaka|Bhoja|Kuru|Trigarta|Kekaya|Cedi|Matsya|Magadha|Sṛñjaya|Somaka|Bālhīka|'
    r'Kāmboja|Sindhu|Gāndhāra|Madra|Kosala|Kāśi|Niṣāda|Kirāta|Śabara|Vānara|bard|herald|messenger|wrestler|'
    r'thief|robber|potter|barber|washerman|weaver|merchant|Dāsa|dancer|singer|musician|cook)\b', re.I)
NONPERSON_START = re.compile(r'^(pl\b|pl\.|\(pl\.\)|adj\.|mostly pl|dual|n\.|neut\.|\(“the section|\(“the episode|\(“the world|\(“the city|name of a (people|city|country|river|mountain|forest|tīrtha|town|region|hell|metre|sāman))', re.I)


def classify(d, body):
    if not d or d in ('.', ':'):
        # fall back on the first parenthetical gloss in the citations
        m = re.search(r'\(([^()]{3,140})\)', body)
        d2 = clean(m.group(1)) if m else ''
        if d2.startswith('=') or not d2:
            return 'unknown', d2
        if PERSON.search(d2) and not PLACE.search(d2):
            return 'person', d2
        if PLACE.search(d2):
            return 'place', d2
        return 'unknown', d2
    if ALIAS_START.match(d):
        return 'alias', d
    if NONPERSON_START.match(d):
        return 'place', d
    if re.match(r'^(\^\d+\s*)?,?\s*(an? |the |one of|son|daughter|wife|king|queen|prince|mother|father|brother|sister|grand)', d) or re.match(r'^(\^\d+\s*)?\(“(the )?(son|daughter|king|wife|lord|mother|father|grandson)', d):
        p, q = PERSON.search(d), PLACE.search(d)
        if p and (not q or p.start() < q.start()):
            return 'person', d
        if q:
            return 'place', d
    if PERSON.search(d) and not PLACE.search(d):
        return 'person', d
    if PLACE.search(d):
        return 'place', d
    return 'unknown', d


out = []
prev = None
for e in E:
    d = clean(e['desc']).lstrip(',').strip()
    d = re.sub(r'^\^\d+\s*,?\s*', '', d)
    body = clean(e['body'])
    if d.startswith('(do.)') and prev and not re.match(r'^\(do\.\)\s*=', d):
        # "(do.)" repeats only the previous entry's etymology; what follows is this entry's own description
        own = d.replace('(do.)', '', 1).strip(' ,.')
        if own and prev['kind'] == 'alias' and not re.match(r'(wife|son|daughter|mother|husband|father|brother|sister)\s+of\b', own):
            kind, gloss = 'alias', own                        # another title for someone ("i.e. Ghaṭotkaca", "= Ṛtuparṇa")
        elif own:
            kind, gloss = classify(own, body)
            if kind == 'unknown' and prev['kind'] in ('person', 'alias'):
                kind = 'person'
        else:
            kind, gloss = prev['kind'], prev['gloss']
    elif re.match(r'^(\(“[^”]*”\))?\s*:', d):
        kind, gloss = 'alias', d                              # a title listed with whom it names: "Cedirāja: II, 1070 (i.e. Śiśupāla)…"
    else:
        kind, gloss = classify(d, body)
    hom = re.search(r'<sup>(\d+)</sup>', e['desc'])
    rec = dict(L=e['L'], head=clean(re.sub(r'<sup>.*?</sup>', '', e['head'])), hom=int(hom.group(1)) if hom else 0,
               kind=kind, gloss=gloss, body=body)
    out.append(rec)
    prev = rec

json.dump(out, open('research/inm_classified.json', 'w'), ensure_ascii=False)
from collections import Counter
print(Counter(r['kind'] for r in out))
