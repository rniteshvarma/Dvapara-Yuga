"""Build the full census of Mahabharata characters.

Source: S. Sørensen, *An Index to the Names in the Mahābhārata* (London 1904), public domain,
digitised by the Cologne Digital Sanskrit Lexicon (INM). Every person-like entry becomes a
character; family links, service, teaching and slayings are read from Sørensen's glosses and
citation notes. The hand-curated dataset (src/data/characters.ts) stays authoritative: curated
characters are matched onto their index entries and gain the index's aliases and citations.

Run from the repo root:  PYTHONPATH=research python3 research/build_census.py
Output: src/data/census.json
"""
import json
import math
import re
from collections import Counter, defaultdict, deque

from translit import iast_to_en, key, slp1_to_deva

R = json.load(open('research/inm_classified.json'))
K1 = {int(L): k1 for L, k1 in re.findall(r'<L>(\d+)<pc>[^<]*<k1>([^<]*)<k2>', open('research/inm.txt', encoding='utf8').read())}
CUR = json.load(open('research/curated.json'))
BY_L = {r['L']: r for r in R}

ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11,
         'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18}

# ─────────────────────────── 1. who counts as a person ───────────────────────────

LIST_SECTIONS = {
    'Aṃśāvat': 'Named among the beings who were born on earth as kings and heroes.',
    'Amśāvat': 'Named among the beings who were born on earth as kings and heroes.',
    'Aṃśāv': 'Named among the beings who were born on earth as kings and heroes.',
    'Pūruvaṃś': 'Named in the genealogy of the line of Puru.',
    'Pūruv': 'Named in the genealogy of the line of Puru.',
    'Skanda': 'One of the host of Skanda.',
    'Sabhākriyāp': 'Named among those gathered in the assembly halls.',
    'Brahmasabhāv': 'Present in the assembly hall of Brahma.',
    'Yamasabhāv': 'Present in the assembly hall of Yama.',
    'Varuṇasabhāv': 'Present in the assembly hall of Varuna.',
    'Vaiśravaṇasabhāv': 'Present in the assembly hall of Kubera.',
    'Svayaṃvarap': 'One of the kings at Draupadi’s svayamvara.',
    'Rājasūyārambhap': 'Named at the Rajasuya of Yudhishthira.',
    'Rājasūyikap': 'Named at the Rajasuya of Yudhishthira.',
    'Karṇap': 'A warrior in the battles of the Karna Parva.',
    'Śalyap': 'A warrior in the battles of the Shalya Parva.',
    'Bhīṣmavadhap': 'A warrior in the battles of the Bhishma Parva.',
    'Droṇābhiṣekap': 'A warrior in the battles of the Drona Parva.',
    'Sainyodyogap': 'Named in the gathering of the armies.',
    'Ṣoḍaśarājop': 'One of the sixteen great kings of old.',
    'Yayātyup': 'Named in the tale of Yayati.',
    'Goharaṇap': 'Named in the cattle raid on Matsya.',
    'Draupadīharaṇap': 'Named in the abduction of Draupadi.',
    'Śiśupālavadhap': 'Named in the slaying of Shishupala.',
    'Sarpasattra': 'A serpent burned at Janamejaya’s snake sacrifice.',
    'Āṅgirasa': 'Named in the account of Angiras and the sacred fires.',
    'Anukram': 'Named in the opening summary of the epic.',
    'Anukr': 'Named in the opening summary of the epic.',
    'Ānuśāsanik': 'Named in the Anushasana Parva.',
    'Nārāyaṇīya': 'Named in the Narayaniya.',
    'Bhagavadyānap': 'Named in Krishna’s peace mission.',
    'Yamas': 'Present in the assembly hall of Yama.',
}

EXTRA_PERSON = re.compile(r'\b(rājarṣi|maharṣi|brahmarṣi|devarṣi|matṛ|māṭr|mātṛs|Rudras|Ādityas|Vasus|princes|kings|'
                          r'brahmans|ṛṣis|standard-bearers|horses|elephants|mothers|daughters|personif|yajñamuṣ|'
                          r'an Agni|caravan leader|the Creator|the planet|surgeons of the gods|upādhyāya|cowherd)\b', re.I)
NON = re.compile(r'\b(place|tīrtha|tirtha|varṣa|dvīpa|wind|treasure|vyūha|term of dice|class of gods|mountain|river|'
                 r'capital|city|abode|month)\b', re.I)
DISGUISE = re.compile(r'the name which (\w+)(?: Pāṇḍava)? (?:assumed|gave himself)', re.I)


def clean_gloss(g):
    g = re.sub(r'\[Page[^\]]*\]', '', g)
    # Sørensen's descriptions sometimes run on into his citations: "…brother of Śakuni: II, 34, 1266 (…)"
    cut = re.search(r':\s*(?:[IVX]{1,5}[,.]\s*[θαβγ†]?\s*\d|\d{2,})|\s\((?:[^()]*\b[IVX]{1,5},\s*\d)', g)
    if cut:
        g = g[:cut.start()]
    g = re.sub(r'^(name of (a|an|one or more) (man|woman|person|being)s?,?\s*)', '', g)
    g = re.sub(r'^\((.*)\)\.?$', r'\1', g.strip())
    g = re.sub(r'(\w)- (\w)', r'\1\2', g)
    g = re.sub(r'\^\d+', '', g)
    g = g.replace('˚', '…')
    g = re.sub(r'\s+', ' ', g).strip(' —.,;')
    if g.count('(') > g.count(')'):
        g = re.sub(r'\s*\([^()]*$', '', g).strip(' —.,;')
    return (g[:1].upper() + g[1:] + '.') if g else ''


def person_gloss(r):
    if r['kind'] == 'person':
        return r['gloss']
    if r['kind'] != 'unknown':
        return None
    g = r['gloss']
    sec = g.strip(' .')
    for k, v in LIST_SECTIONS.items():
        if sec.startswith(k):
            return v
    if NON.search(g):
        return None
    if EXTRA_PERSON.search(g):
        return g
    return None


FORCE = {239: 'The god of fire, Agni.', 4493: 'Himavat, the Himalaya personified as a king of mountains; father of Uma.'}
persons, aliases = {}, []
for r in R:
    r['gloss'] = re.sub(r'(\w)- (\w)', r'\1\2', r['gloss'])
    g = r['gloss']
    mm = re.match(r'^[“(][^=]{0,80}?\)?\s*=\s*([A-ZĀĪŪṚŚṢ][^\s:,.;()^]*)(?:\^(\d+))?', g)
    if mm or re.search(r'\b(patron|metron)\.', g[:60]) and '=' in g[:90]:
        if not mm:
            mm = re.search(r'=\s*([A-ZĀĪŪṚŚṢ][^\s:,.;()^]*)(?:\^(\d+))?', g)
        if mm:
            aliases.append((r['head'], mm.group(1), int(mm.group(2) or 0)))
            continue
    m = DISGUISE.search(g)
    if m:
        aliases.append((r['head'], m.group(1), 0))
        continue
    if r['kind'] == 'alias':
        m = re.match(r'^[^=]*=\s*(?:the\s+)?([A-ZĀĪŪṚŚṢ][^\s:,.;()]*?)(?:\^(\d+))?(?=[\s:,.;()]|$)', g)
        if m and not re.search(r'1000 names', g):
            aliases.append((r['head'], m.group(1), int(m.group(2) or 0)))
        continue
    # usages, not people: "Pāṇḍava, sg. ('son of Pāṇḍu') = Arjuna", "Śauri, son of Śūra = Vasudeva",
    # "Parjanya, the god of rain = Indra", "Acyuta, a proper name of Kṛṣṇa"
    NM = r'([A-ZĀĪŪṚŚṢ][^\s:,.;()^]*)(?:\^(\d+))?'
    g0 = re.sub(r'\([^()]*\)', '', g).strip()
    if re.match(r'^(sg|pl|du|dual|adj|subst)\b\.?', g0, re.I) or re.match(r'^[“"]', g.strip()) and '=' in g[:120]:
        mm = re.search(r'=\s*' + NM, g)
        if mm:
            aliases.append((r['head'], mm.group(1), int(mm.group(2) or 0)))
        continue
    mm = re.match(r'^[^,;=]{0,45},?\s*=\s*' + NM, g0)
    if mm:
        aliases.append((r['head'], mm.group(1), int(mm.group(2) or 0)))
        continue
    # "Vivasvat … identical with Sūrya", "Vaicitravīryi … properly identical with Dhṛtarāṣṭra"
    mm = re.search(r'identical with\s+' + NM, g[:160])
    if mm:
        aliases.append((r['head'], mm.group(1), int(mm.group(2) or 0)))
        continue
    mm = re.search(r'proper name of\s*(?:\([^)]*\)\s*)?' + NM, g[:120])
    if mm:
        aliases.append((r['head'], mm.group(1), int(mm.group(2) or 0)))
        continue
    m = re.match(r'^v\.\s*([A-ZĀĪŪṚŚṢ][^\s:,.;()^]*)(?:\^(\d+))?', g)
    if m:
        aliases.append((r['head'], m.group(1), int(m.group(2) or 0)))
        continue
    gloss = FORCE.get(r['L']) or person_gloss(r)
    # epithet compounds and patronymic stubs: Śakuniputra, Ekalavyasuta, Śalyānuja, "the son of Kṛtavarman"
    if gloss is not None and (re.search(r'(putra|suta|sūnu|sunu|tanaya|ātmaja|atmaja|bhrātṛ|anuja|duhitṛ)$', r['head'])
                              or not gloss.strip(' .')
                              or re.fullmatch(r'\s*(or\s+\S+\s*)?\(?[“"][^”"]*[”"]\)?[.,]?\s*', gloss)):
        continue
    mm = re.search(r'\bi\.\s?e\.\s*([A-ZĀĪŪṚŚṢ][^\s:,.;()^]*)', gloss[:90]) if gloss else None
    if mm and gloss.strip().startswith(('“', '(“', '"')):
        aliases.append((r['head'], mm.group(1), 0))
        continue
    # pointer stubs: "(III, 2897), v. Kosala."
    if gloss and re.match(r'^\(?\s*[IVX]{1,5},\s*\d|.*\berror in C\.', gloss):
        gloss = None
    if gloss is None:
        continue
    head = re.sub(r'\(.*?\)|[\[\]*?]', '', r['head']).strip()
    if not head or not head[0].isupper() or ' ' in head:
        continue
    persons[r['L']] = dict(L=r['L'], head=head, hom=r['hom'], gloss=gloss, body=r['body'])

# ─────────────────────────── 2. the curated characters ───────────────────────────

curated = {c['id']: c for c in CUR['characters']}
L_OF = {  # curated id → index entry, where homonyms or spelling defeat automatic matching
    'chandra': 9973, 'surya': 10477, 'dharma': 3411, 'ashvins': 123, 'budha': 1881, 'shukra': 2819, 'bharata': 1329,
    'shakti': 2299, 'ganga': 4032, 'bhishma': 1497, 'ambalika': 415, 'sharadvan': 2463, 'devaki': 3242,
    'devaka': 3240, 'nanda': 7550, 'bhima': 1454, 'vijaya': 12045, 'vikarna': 12052, 'lakshmana_k': 6424,
    'kunti': 6200, 'bahlika': 1187, 'vichitravirya': 11856, 'parashurama': 8963, 'kichaka': 5744, 'brahma': 1741,
    'hanuman': 4368, 'iravan': 4670, 'chitravahana': 2150, 'jambavan': 4745, 'jambavati': 4746,
    'hiranyadhanu': 4507, 'uparichara': 11672, 'banasura': 1209, 'krishna': 5907, 'bhurishravas': 1615,
    'astika': 900, 'valandhara': 1165, 'prishati': 8182, 'kashiraja': 4997, 'shatanika': 2538,
    'suhotra_s': 10217, 'suhotra': 10216, 'parikshit': 8154, 'parikshit_i': 8155, 'jaratkaru_m': 4815,
    'jaratkaru_f': 4816, 'hidimbi': 4488, 'uttar': 11251, 'manu': 7118, 'duryodhana': 3805, 'vrishaparva': 12335, 'dharma_': None, 'chitrangada_k': None, 'chitrangada_m': None,
}
NO_MATCH = {'puru_line', 'yadu_line', 'parishrami', 'sughada', 'upakichakas', 'captive_kings', 'maurvi', 'barbarika',
            'bhanumati', 'lakshmanaa', 'shrutashrava', 'damaghosha', 'sahadeva_m', 'shatanika_j', 'usha',
            'anasuya', 'asti', 'dasharaja', 'k_ugrasena', 'k_jarasandha', 'k_ugrashravas', 'shveta', 'bhimasena_i'}

by_key = defaultdict(list)
for r in R:
    if r['kind'] in ('person', 'unknown'):
        by_key[key(re.sub(r'\(.*?\)|[\[\]*?]', '', r['head']))].append(r)


def cites(r):
    return r['body'].count('§')


cur_rel = defaultdict(set)
for c in CUR['characters']:
    for p in c.get('p', []):
        cur_rel[c['id']].add(curated[p]['n'].split()[0])
        cur_rel[p].add(c['n'].split()[0])
for a, b, t in CUR['relations']:
    cur_rel[a].add(curated[b]['n'].split()[0])
    cur_rel[b].add(curated[a]['n'].split()[0])

L_of_cur, cur_of_L = {}, {}
# further index entries for the same person (the curated map treats Yama as Dharma, etc.)
SAME_AS = {12553: 'dharma', 5015: 'kashiraja'}
for cid, c in curated.items():
    if cid in NO_MATCH:
        continue
    if L_OF.get(cid):
        L = L_OF[cid]
    elif cid in L_OF:
        continue
    else:
        cands = []
        for n in [c['n']] + c.get('al', []):
            cands += by_key.get(key(n), [])
            if c['sx'] == 'f' and key(n).endswith('a'):
                cands += by_key.get(key(n) + '2', [])
        cands = [x for x in cands if x['L'] not in cur_of_L]
        if not cands:
            continue

        def score(x, c=c, cid=cid):
            txt = iast_to_en(x['gloss'] + ' ' + x['body'][:2500])
            s = sum(3 for r in cur_rel[cid] if r in txt)
            if c.get('cl') == 'kauravas':
                s += 20 if 'Dhritarashtra' in x['gloss'] or 'Dhritarashtra' in iast_to_en(x['gloss']) else 0
            elif re.search(r'son of Dhṛtarāṣṭra', x['gloss']):
                s -= 12
            return (s, cites(x))
        L = max(cands, key=score)['L']
    L_of_cur[cid] = L
    cur_of_L[L] = cid

for L, cid in SAME_AS.items():
    cur_of_L.setdefault(L, cid)

# the sons of Dhritarashtra: the index lists every name from every chapter; merge the spellings we already have
kaurava_ids = [cid for cid, c in curated.items() if 'dhritarashtra' in c.get('p', [])]
for L, p in persons.items():
    if L in cur_of_L or 'Dhṛtarāṣṭra' not in p['gloss'] or not re.search(r'\b(son|daughter)s? of Dhṛtarāṣṭra', p['gloss']):
        continue
    k = key(p['head'])
    for cid in kaurava_ids:
        if cid in L_of_cur:
            continue
        if key(curated[cid]['n']) == k:
            L_of_cur[cid] = L
            cur_of_L[L] = cid
            break

# every index entry that is another name for a curated character
cur_names = {}
for cid, c in curated.items():
    cur_names.setdefault(key(c['n']), cid)
for cid, L in L_of_cur.items():
    cur_names.setdefault(key(re.sub(r'\(.*?\)|[\[\]*?]', '', BY_L[L]['head'])), cid)
for cid, c in curated.items():
    for n in c.get('al', []):
        cur_names.setdefault(key(n), cid)

# ─────────────────────────── 3. resolving names in glosses ───────────────────────────

pkey = defaultdict(list)
for p in persons.values():
    pkey[key(p['head'])].append(p)

alias_to = {}
for a, t, th in aliases:
    alias_to.setdefault(key(re.sub(r'\(.*?\)|[\[\]*?]', '', a)), (t, th))

unresolved = Counter()
# bare names whose usual referent in Sørensen's glosses is not the most-cited namesake
PREFER = {'rama': 8964, 'paramesti': 'brahma', 'paramestin': 'brahma', 'dritarastra': 'dhritarashtra'}


HOUSE_WORDS = {
    'yadava': 'Yādava|Vṛṣṇi|Andhaka|Bhoja|Daśārha|Sātvata|Mādhava', 'pandava': 'Pāṇḍava|Pāṇḍu|Kuntī|Pṛthā',
    'kaurava': 'Dhārtarāṣṭra|Kaurava|Kuru', 'kuru': 'Kuru|Kaurava|Bhārata', 'panchala': 'Pāñcāla|Somaka|Sṛñjaya',
    'matsya': 'Matsya', 'gandhara': 'Gāndhāra', 'madra': 'Madra', 'anga': 'Aṅga|Rādheya|Sūta',
    'lunar': 'Paurava|Pūru|Bharata', 'deva': 'god', 'rishi': 'ṛṣi', 'naga': 'serpent|Nāga', 'asura': 'Asura|Rākṣas',
}


def context_ok(cid, src):
    """Does the entry that names this person share any context with the curated character?"""
    if src not in persons:
        return True
    # the entry is itself a curated character linked to this one
    if src in cur_of_L and curated[cur_of_L[src]]['n'].split()[0] in cur_rel[cid]:
        return True
    txt = persons[src]['gloss'] + ' ' + persons[src]['body'][:600]
    plain = iast_to_en(txt)
    if any(r and len(r) > 3 and r in plain for r in cur_rel[cid]):
        return True
    words = HOUSE_WORDS.get(curated[cid]['d'])
    return bool(words and re.search(words, txt))


def resolve(name, hom=0, depth=0, hint=None, src=None):
    """A name as written in a gloss → curated id or index entry number."""
    hom = int(hom or 0)
    k = key(name)
    cands = pkey.get(k, [])
    if hint and cands:
        hinted = [p for p in cands if hint in p['gloss']]
        if hinted:
            L = max(hinted, key=lambda p: p['body'].count('§'))['L']
            return cur_of_L.get(L, L)
    if hom:
        exact = [p for p in cands if p['hom'] == hom]
        if exact:
            L = exact[0]['L']
            return cur_of_L.get(L, L)
    if not hom and k in PREFER:
        v = PREFER[k]
        return v if isinstance(v, str) else cur_of_L.get(v, v)
    cid = cur_names.get(k)
    mine = L_of_cur.get(cid) if cid else None
    others = [p for p in cands if p['L'] != mine and cur_of_L.get(p['L']) != cid]
    # a namesake whose own entry names the person we are reading about is the one meant
    if src in persons and len(cands) > 1:
        head = persons[src]['head']
        mutual = [p for p in cands if p['L'] != src and head in (p['gloss'] + p['body'][:2000])]
        if len(mutual) == 1:
            L = mutual[0]['L']
            return cur_of_L.get(L, L)
    # a bare name means its most famous bearer — a main character — unless other namesakes exist
    # and nothing in the entry connects it to the main character
    if cid and (not others or (curated[cid]['t'] <= 2 and context_ok(cid, src))):
        return cid
    if cid and curated[cid]['t'] <= 2 and others:
        best = max(others, key=lambda p: p['body'].count('§'))
        # an obscure namesake is not meant over a famous one unless something points to it
        if best['body'].count('§') <= 3 and (mine is None or BY_L[mine]['body'].count('§') >= 40):
            return cid
        return cur_of_L.get(best['L'], best['L'])
    if cands:
        pool = cands + ([BY_L[mine]] if mine else [])
        L = max(pool, key=lambda p: p['body'].count('§'))['L']
        return cur_of_L.get(L, L)
    if cid:
        return cid
    if k in alias_to and depth < 3:
        t, th = alias_to[k]
        r = resolve(t, th, depth + 1, src=src)
        # reached a main character only through another name: it must still make sense in context
        if isinstance(r, str) and curated[r]['t'] <= 2 and not context_ok(r, src):
            unresolved[name] += 1
            return None
        return r
    unresolved[name] += 1
    return None


# ─────────────────────────── 4. new characters ───────────────────────────

FEMALE = re.compile(r'\b(daughter|wife|mother|queen|princess|Apsaras|Rākṣasī|Asurī|female|goddess|mātṛ|matṛ|sister|'
                    r'maid|nurse|courtesan|woman|girl|Yakṣī|she)\b', re.I)
MALE = re.compile(r'\b(son|king|brother|father|husband|prince|ṛṣi|muni|brahman|warrior|hero|Asura|Daitya|Dānava|'
                  r'Rākṣasa|Gandharva|Yakṣa|serpent|god|he|his|man|boy)\b', re.I)

HOUSES = [  # word in a gloss → (dynasty, house label)
    (r'Pāṇḍava', 'pandava', None), (r'Dhārtarāṣṭra|son of Dhṛtarāṣṭra|Kaurava|Kuru warrior', 'kaurava', None),
    (r'Pāñcāla|Somaka|Sṛñjaya|Prabhadraka', 'panchala', None),
    (r'Yādava|Vṛṣṇi|Andhaka|Daśārha|Sātvata|Bhoja|Kukura|Madhu\b', 'yadava', None),
    (r'Matsya', 'matsya', None), (r'Gāndhāra', 'gandhara', None), (r'Madra', 'madra', None),
    (r'Kekaya', 'realms', 'Kekaya'), (r'Cedi', 'realms', 'Chedi'), (r'Magadha|Māgadha', 'realms', 'Magadha'),
    (r'Kāśi|Kāśya', 'realms', 'Kashi'), (r'Kosala|Kausalya|Ayodhyā', 'solar', 'Kosala'),
    (r'Ikṣvāku', 'solar', 'Ikshvaku line'), (r'Videha|Mithilā', 'realms', 'Videha'), (r'Avanti', 'realms', 'Avanti'),
    (r'Trigarta', 'realms', 'Trigarta'), (r'Sindhu|Saindhava|Sauvīra', 'realms', 'Sindhu'),
    (r'Kaliṅga', 'realms', 'Kalinga'), (r'Aṅga\b', 'anga', None), (r'Vidarbha|Vaidarbha', 'realms', 'Vidarbha'),
    (r'Niṣāda|Naiṣādha|Niṣadha', 'realms', 'Nishada'), (r'Kirāta', 'realms', 'Kirata'),
    (r'Prāgjyotiṣa', 'realms', 'Pragjyotisha'), (r'Kāmboja', 'realms', 'Kamboja'), (r'Bālhīka|Bāhlīka', 'kuru', None),
    (r'Pūru|Paurava|Bharata line', 'lunar', None), (r'Haihaya', 'realms', 'Haihaya'),
    (r'Maṇipūra', 'realms', 'Manipura'), (r'Mahiṣmatī|Māhiṣmatī', 'realms', 'Mahishmati'),
]

GROUPS = [  # (id, title, subtitle, pattern) — first match wins for anyone who floats free of the family tree
    ('skanda', 'The host of Skanda', 'Mothers and companions of the war god', r'Skanda|mātṛ|matṛ|māṭr|mothers of Śiśu'),
    ('serpents', 'The serpents', 'Nagas named in the lists of the epic', r'serpent|Nāga|snake|Sarpasattra|snake sacrifice'),
    ('creatures', 'Creatures with names', 'Horses, elephants, birds and beasts',
     r'\b(horse|horses|elephant|elephants|bird|dog|jackal|vulture|crow|parrot|pigeon|tortoise|fish|mouse|cat|monkey|ape|'
     r'bear|deer|cow|bull|lion|tiger|owl|crane|swan|frog|worm|insect|śārṅgikā|ichneumon|steed)\b'),
    ('celestials', 'Apsaras, Gandharvas & Yakshas', 'Dancers, singers and guardians of the heavens',
     r'Apsaras|Gandharva|Yakṣa|Yakṣī|Kiṃnara|Kinnara|Guhyaka|Vidyādhara|Siddha|Cāraṇa|Suparṇa'),
    ('asuras', 'Asuras, Daityas & Rakshasas', 'The enemies of the gods, and the night-walkers',
     r'Asura|Asurī|Daitya|Dānava|Rākṣasa|Rākṣasī|Piśāca|demon'),
    ('gods', 'Gods and their orders', 'Adityas, Vasus, Rudras, Vishvedevas and powers personified',
     r'\b(god|goddess|deity|Viśvadeva|Viśvedeva|Rudra|Āditya|Vasu|Marut|Sādhya|Agni|personif|Prajāpati|yajñamuṣ|Pitṛ|'
     r'planet|Creator|Fire|Manu)'),
    ('pandava_side', 'Warriors for the Pandavas', 'Named in the battle books',
     r'Pāṇḍava warrior|Pāñcāla|Somaka|Sṛñjaya|Prabhadraka|Kekaya|Matsya warrior|Cedi warrior'),
    ('kaurava_side', 'Warriors for the Kauravas', 'Named in the battle books', r'Kuru warrior|Kaurava|Trigarta|Saṃśaptaka'),
    ('warriors', 'Other warriors of Kurukshetra', 'Named in the battle books', r'warrior|standard-bearer|battles of'),
    ('sages', 'Sages and seers', 'Rishis, munis, brahmins and ascetics',
     r'ṛṣi|muni|brahman|brāhmaṇ|maharṣi|devarṣi|brahmarṣi|ascetic|sage|seer|teacher|purohita|upādhyāya'),
    ('kings', 'Kings of old', 'Rulers named in genealogies, assemblies and tales',
     r'king|prince|princess|queen|rājarṣi|Puru|opening summary|svayamvara|Rajasuya|assembly|sixteen great'),
    ('people', 'People of the tales', 'Servants, hunters, merchants and others', r'.'),
]


def parvas_of(body):
    books = set()
    for m in re.finditer(r'\b(XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I),\s', body):
        books.add(ROMAN[m.group(1)])
    return sorted(books)


SECTION_ABBR = {
    'Anukram': 'Anukramanika', 'Anukr': 'Anukramanika', 'Parvasangr': 'Parvasangraha', 'Parvas': 'Parvasangraha',
    'Aṃśāvat': 'Amshavatarana', 'Aṃśāv': 'Amshavatarana', 'Pūruv': 'Puruvamsha', 'Pūruvaṃś': 'Puruvamsha',
    'Sarpasattra': 'Sarpasattra', 'Skanda': 'Skanda episode', 'Rājadh': 'Rajadharma', 'Mokṣadh': 'Mokshadharma',
    'Ānuśāsanik': 'Anushasanika', 'Āpaddh': 'Apaddharma', 'Tīrthay': 'Tirthayatra',
}


def section_of(body):
    m = re.search(r'§\s*\d+\s*\(([^)]{3,40})\)', body)
    if not m:
        return ''
    raw = m.group(1).strip()
    for k, v in SECTION_ABBR.items():
        if raw.rstrip('.').startswith(k):
            return v
    # "Kīcakavadhap." → "Kichakavadha section"
    name = re.sub(r'p\.$', '', raw).rstrip('.')
    name = iast_to_en(name.replace('˚', ''))
    return f'{name} section' if raw.endswith('p.') else name


def display_name(head):
    n = head.replace('á', 'a').replace('í', 'i')
    n = re.sub(r'(?<=ā)man$', 'ma', n)
    n = re.sub(r'(?<=[^a])in$', 'i', n)
    n = re.sub(r'(m|v)at$', r'\1an', n)
    return iast_to_en(n)


def devanagari(L):
    s = K1.get(L, '')
    s = re.sub(r'(?<=A)man$', 'mA', s)
    s = re.sub(r'(?<=[^a])in$', 'I', s)
    s = re.sub(r'(m|v)at$', r'\1An', s)
    s = re.sub(r'as$', 'AH', s)
    return slp1_to_deva(s)


new = {L: p for L, p in persons.items() if L not in cur_of_L}
for L in L_of_cur.values():
    new.pop(L, None)

NAME = r'([A-ZĀĪŪṚŚṢ][\wāīūṛṝḷṅñṇṭḍśṣṃḥ\-]+)(?:\^(\d+))?(?![\wāīūṛṝḷṅñṇṭḍśṣṃḥ’\'])'
# qualifiers after a name: "Bhīma, the Vidarbha king", "Parikṣit, king of Ayodhyā", "Duryodhana of Māhiṣmatī"
AFTER = (r'(?:,\s*(?:the\s+)?([\wāīūṛṅñṇṭḍśṣ]+)\s+king|,?\s*king\s+of\s+(?:the\s+)?([\wāīūṛṅñṇṭḍśṣ]+)'
         r'|\s+of\s+([A-ZĀĪŪṚŚṢ][\wāīūṛṅñṇṭḍśṣ]+))?')
REL_PAT = re.compile(
    r'\b(son|sons|daughter|daughters|wife|husband|mother|father|brother|sister|foster-mother|foster-father|'
    r'charioteer|minister|priest|purohita|teacher|preceptor|pupil|disciple|friend|companion|maid|servant|'
    r'attendant|horse|elephant|general|senāpati|commander|follower|messenger|chamberlain|confidant|helper|ally|'
    r'adviser|counsellor|favourite|guardian|nurse|bard|herald)'
    r'(?:-in-law)?(?:\s+and\s+\w+)?\s+of\s+(?:the\s+)?(?:([\wāīūṛṅñṇṭḍśṣ]+)\s+(?:king|prince|princess|queen|warrior|chief)\s+|king\s+|ṛṣi\s+|sage\s+|Rākṣasa\s+|Asura\s+|Daitya\s+|'
    r'Nāga\s+|serpent\s+|Sūta\s+|sūta\s+|cowherd\s+|Vasu\s+|god\s+|Apsaras\s+|Gandharva\s+)?' + NAME + AFTER + r'(?:\s+and\s+' + NAME + r')?')
SLAIN = re.compile(r'(?:slain|killed)\s+by\s+' + NAME)

rels, stories = [], []
for L, p in persons.items():
    me = cur_of_L.get(L, L)
    g = p['gloss']
    for m in REL_PAT.finditer(g):
        word = m.group(1)
        if '-in-law' in m.group(0):          # a brother-in-law is not a brother
            continue
        if re.match(r'\s+or\s', g[m.end(3):m.end(3) + 5]):   # "son of Bhīmasena or Sudeva": the source is unsure
            continue
        hint = m.group(2) or m.group(5) or m.group(6) or m.group(7)
        if hint and len(hint) > 4:
            hint = hint[:-2]          # "Ayodhyā" ↔ "Ayodhyā's", "Kāśis" ↔ "Kāśi": match on the stem
        targets = [resolve(m.group(3), m.group(4), hint=hint, src=L)]
        if m.group(8):
            targets.append(resolve(m.group(8), m.group(9), src=L))
        for t in targets:
            if not t or t == me:
                continue
            if word in ('son', 'sons', 'daughter', 'daughters'):
                rels.append((t, me, 'parent'))
            elif word in ('wife', 'husband'):
                rels.append((t, me, 'spouse'))
            elif word in ('mother', 'father'):
                rels.append((me, t, 'parent'))
            elif word in ('brother', 'sister'):
                rels.append((t, me, 'sibling'))
            elif word in ('foster-mother', 'foster-father'):
                rels.append((me, t, 'adoptive'))
            elif word in ('teacher', 'preceptor'):
                stories.append((me, t, 'teacher', word))
            elif word in ('pupil', 'disciple'):
                stories.append((t, me, 'teacher', word))
            elif word in ('friend', 'companion', 'confidant', 'helper', 'ally', 'favourite'):
                stories.append((me, t, 'ally', word))
            else:
                stories.append((me, t, 'service', word))
    for m in SLAIN.finditer(p['body'][:5000]):
        t = resolve(m.group(1), m.group(2), src=L)
        if t and t != me:
            sec = ''
            before = p['body'][:m.start()]
            sm = list(re.finditer(r'§\s*\d+\s*\(([^)]{3,40})\)', before))
            if sm:
                sec = sm[-1].group(1)
            stories.append((t, me, 'slew', sec))
            break

# a new entry that shares a curated character's name AND one of their relatives is the same person
cur_kin = defaultdict(set)
for c in CUR['characters']:
    for p_ in c.get('p', []):
        cur_kin[c['id']].add(p_); cur_kin[p_].add(c['id'])
for a, b, t in CUR['relations']:
    cur_kin[a].add(b); cur_kin[b].add(a)
ck = defaultdict(list)
for cid, c in curated.items():
    ck[key(c['n'])].append(cid)
    if c['sx'] == 'f' and key(c['n']).endswith('a'):
        ck[key(c['n']) + '2'].append(cid)
kin_new = defaultdict(set)
for a, b, t in rels:
    kin_new[a].add(b); kin_new[b].add(a)
merge = {}
for L in list(new):
    for cid in ck.get(key(persons[L]['head']), []):
        if kin_new[L] & cur_kin[cid] and cid not in L_of_cur:
            merge[L] = cid
            L_of_cur[cid] = L
            cur_of_L[L] = cid
            new.pop(L)
            break
rels = [(merge.get(a, a), merge.get(b, b), t) for a, b, t in rels]
stories = [(merge.get(a, a), merge.get(b, b), k, w) for a, b, k, w in stories]
print('merged duplicates', len(merge), sorted(merge.values()))

# drop links between two curated characters: the curated data is authoritative there
rels = [r for r in rels if not (isinstance(r[0], str) and isinstance(r[1], str))]
seen, uniq = set(), []
for a, b, t in rels:
    k = (a, b, t) if t != 'spouse' and t != 'sibling' else (min(str(a), str(b)), max(str(a), str(b)), t)
    if k in seen:
        continue
    seen.add(k)
    uniq.append((a, b, t))
rels = uniq
# a child cannot have more than two blood parents; keep the first two
pc = defaultdict(int)
kept = []
for a, b, t in rels:
    if t == 'parent':
        pc[b] += 1
        if pc[b] > 2:
            continue
    kept.append((a, b, t))
rels = kept

# ─────────────────────────── 5. placing the new characters ───────────────────────────

gen = {cid: c['g'] for cid, c in curated.items()}
adj = defaultdict(list)
for a, b, t in rels:
    if t == 'parent' or t == 'adoptive':
        adj[a].append((b, +1))
        adj[b].append((a, -1))
    else:
        adj[a].append((b, 0))
        adj[b].append((a, 0))

dq = deque(cid for cid in curated)
while dq:
    x = dq.popleft()
    for y, d in adj[x]:
        if y in gen or isinstance(y, str):
            continue
        g = gen[x] + d
        if g < 0 or g > 38:
            continue
        gen[y] = round(g, 1)
        dq.append(y)

attached = {L for L in new if L in gen}

# islands: families that never touch the main tree
comp_of, islands = {}, []
for L in new:
    if L in attached or L in comp_of:
        continue
    comp, q = [], deque([L])
    comp_of[L] = -1
    while q:
        x = q.popleft()
        comp.append(x)
        for y, _ in adj[x]:
            if y in new and y not in comp_of and y not in attached:
                comp_of[y] = -1
                q.append(y)
    if len(comp) >= 3:
        idx = len(islands)
        for x in comp:
            comp_of[x] = idx
        islands.append(comp)
    else:
        for x in comp:
            del comp_of[x]

island_meta = []
for idx, comp in enumerate(islands):
    # local generations inside the island
    lg = {comp[0]: 0}
    q = deque([comp[0]])
    while q:
        x = q.popleft()
        for y, d in adj[x]:
            if y in lg or y not in comp_of or comp_of.get(y) != idx:
                continue
            lg[y] = lg[x] + d
            q.append(y)
    mn = min(lg.values())
    rows = defaultdict(list)
    for x in comp:
        rows[lg[x] - mn].append(x)
    # barycentric ordering, top-down
    pos = {}
    for r in sorted(rows):
        row = rows[r]
        def bary(x):
            ps = [pos[y][0] for y, d in adj[x] if y in pos and d == -1]
            sp = [pos[y][0] for y, d in adj[x] if y in pos and d == 0]
            v = ps or sp
            return sum(v) / len(v) if v else 0
        row.sort(key=bary)
        w = len(row)
        for i, x in enumerate(row):
            pos[x] = ((i - (w - 1) / 2) * 76, r * 130)
    star = max(comp, key=lambda x: persons[x]['body'].count('§'))
    island_meta.append(dict(id=f'island{idx}', title=f'{display_name(persons[star]["head"])} and kin',
                            members=comp, pos=pos))


def group_of(text):
    for gid, title, sub, pat in GROUPS:
        if re.search(pat, text, re.I):
            return gid
    return 'people'


def tier_of(p):
    c = p['body'].count('§')
    return 2 if c >= 70 else 3 if c >= 18 else 4


# dynasty: from the gloss, else from the nearest relative already placed
dyn_cur = {cid: (c['d'], c.get('h')) for cid, c in curated.items()}


def house_of(text):
    for pat, d, h in HOUSES:
        if re.search(pat, text):
            return d, h
    return None


def kind_of(text):
    if re.search(r'serpent|Nāga\b|snake', text): return 'naga'
    if re.search(r'Asura|Daitya|Dānava|Rākṣas|Piśāca|Asurī', text): return 'asura'
    if re.search(r'Apsaras', text): return 'apsara'
    if re.search(r'\b(god|goddess|deity|Gandharva|Yakṣa|Viśvadeva|Rudra|Āditya|Vasu\b|Marut|Sādhya|Agni|mātṛ|matṛ|personif|Kiṃnara|Vidyādhara|Siddha|Suparṇa|planet|Creator)', text): return 'divine'
    if re.search(r'ṛṣi|muni|maharṣi|devarṣi|brahmarṣi|ascetic|sage|seer', text): return 'sage'
    return 'mortal'


DYN_OF_KIND = {'naga': 'naga', 'asura': 'asura', 'apsara': 'deva', 'divine': 'deva', 'sage': 'rishi'}

out_chars = []
ids = {}
for L, p in sorted(new.items()):
    base = re.sub(r'[^a-z]', '', iast_to_en(p['head']).lower()) or 'x'
    ids[L] = f'i{L}_{base}'
for L, p in sorted(new.items()):
    g = clean_gloss(p['gloss'])
    text = p['gloss'] + ' ' + section_of(p['body'])
    kind = kind_of(p['gloss'])
    h = house_of(p['gloss'])
    dyn, house = (h if h else (DYN_OF_KIND.get(kind, None), None))
    if not dyn:
        # inherit from a relative
        for y, _ in adj[L]:
            if isinstance(y, str) and y in dyn_cur:
                dyn, house = dyn_cur[y]
                break
    if not dyn:
        dyn = 'realms'
    sex = 'f' if FEMALE.search(p['gloss']) and not re.search(r'\b(son|king|brother|father|husband)\b', p['gloss']) else \
          'm' if MALE.search(p['gloss']) else 'n'
    extra_kaurava = bool(re.search(r'\bsons? of Dhṛtarāṣṭra', p['gloss'])) and not re.search(r'daughter', p['gloss'])
    if extra_kaurava:
        g = g.rstrip('.') + '. The lists of the hundred differ from chapter to chapter, so this may be another name for one of the brothers.'
    grp = 'kauravas' if extra_kaurava else None if L in attached or L in comp_of else group_of(text)
    isl = comp_of.get(L)
    ix = iy = None
    if isl is not None:
        ix, iy = island_meta[isl]['pos'][L]
    out_chars.append([
        ids[L], display_name(p['head']), devanagari(L), gen.get(L), dyn, tier_of(p), kind, sex, house or '',
        iast_to_en_text if (iast_to_en_text := re.sub(r'([A-ZĀĪŪṚŚṢa-zāīūṛṝḷṅñṇṭḍśṣṃḥ]+)', lambda m: iast_to_en(m.group(1)) if re.search(r'[āīūṛṝḷṅñṇṭḍśṣṃḥĀĪŪṚŚṢ]', m.group(1)) else m.group(1), g)) else g,
        ''.join(chr(64 + b) for b in parvas_of(p['body'])), section_of(p['body']), L, grp,
        f'island{isl}' if isl is not None else None, ix, iy,
    ])


def cid_or_id(x):
    return x if isinstance(x, str) else ids.get(x)


out_rels = [[cid_or_id(a), cid_or_id(b), t] for a, b, t in rels if cid_or_id(a) and cid_or_id(b)]

TITLE = {'charioteer': 'Charioteer', 'minister': 'Minister', 'priest': 'Priest', 'purohita': 'Family priest',
         'maid': 'Maid', 'servant': 'Servant', 'attendant': 'Attendant', 'horse': 'Horse', 'elephant': 'Elephant',
         'general': 'General', 'senāpati': 'Commander', 'commander': 'Commander', 'follower': 'Follower',
         'messenger': 'Messenger', 'chamberlain': 'Chamberlain', 'teacher': 'Teacher', 'preceptor': 'Teacher',
         'pupil': 'Pupil', 'disciple': 'Disciple', 'friend': 'Friend', 'companion': 'Companion', 'confidant': 'Confidant',
         'helper': 'Helper', 'ally': 'Ally', 'adviser': 'Adviser', 'counsellor': 'Counsellor', 'favourite': 'Favourite',
         'guardian': 'Guardian', 'nurse': 'Nurse', 'bard': 'Bard', 'herald': 'Herald'}


def nm(x):
    if isinstance(x, str):
        return curated[x]['n']
    return display_name(persons[x]['head'])


out_stories, sseen = [], set()
for a, b, kind, word in stories:
    A, B = cid_or_id(a), cid_or_id(b)
    if not A or not B or (A, B, kind) in sseen:
        continue
    sseen.add((A, B, kind))
    if kind == 'slew':
        title = f'Slain by {nm(a)}'
        text = f'{nm(b)} is slain by {nm(a)}.' + (f' The index records it in the {iast_to_en(word)}.' if word else '')
    elif kind == 'teacher':
        title = f'{nm(a)} teaches {nm(b)}'
        text = f'{nm(a)} is named as the teacher of {nm(b)}.'
    else:
        t = TITLE.get(word, word.capitalize())
        title = f'{t} of {nm(b)}'
        text = f'{nm(a)} is named as the {word} of {nm(b)}.'
    out_stories.append([A, B, kind, title, text])

out_aliases = []
seen_alias = set()
for a, t, th in aliases:
    r = resolve(t, th)
    target = cid_or_id(r) if r is not None else None
    if target:
        nm_ = display_name(re.sub(r'\(.*?\)|[\[\]*?{}<>|]', '', a)).strip()
        k = (key(nm_.rstrip('h')), target)   # "Kashirajasuta" and "Kashirajasutah" are one name
        own = curated[target]['n'] if target in curated else next((c[1] for c in out_chars if c[0] == target), '')
        if nm_ and len(nm_) > 2 and k not in seen_alias and key(nm_) != key(own) and re.fullmatch(r"[A-Za-z' -]+", nm_):
            seen_alias.add(k)
            out_aliases.append([nm_, target])

census = dict(
    source='S. Sørensen, An Index to the Names in the Mahābhārata (London, 1904), via the Cologne Digital Sanskrit Lexicon',
    chars=out_chars, rels=out_rels, stories=out_stories, aliases=out_aliases,
    curated={cid: [L, ''.join(chr(64 + b) for b in parvas_of(BY_L[L]['body'])), section_of(BY_L[L]['body'])] for cid, L in L_of_cur.items()},
    groups=[dict(id=g[0], title=g[1], sub=g[2]) for g in GROUPS],
    islands=[dict(id=m['id'], title=m['title']) for m in island_meta],
)
json.dump(census, open('src/data/census.json', 'w'), ensure_ascii=False, separators=(',', ':'))

print('index persons', len(persons), '· matched curated', len(L_of_cur), '· new characters', len(out_chars))
print('attached to the tree', len(attached), '· in islands', sum(len(c) for c in islands), f'({len(islands)} islands)',
      '· in constellations', sum(1 for c in out_chars if c[13]))
print('family links', len(out_rels), '· story links', len(out_stories), '· aliases', len(out_aliases))
print('groups', Counter(c[13] for c in out_chars if c[13]))
print('largest islands', sorted(((len(m['members']), m['title']) for m in island_meta), reverse=True)[:12])
print('unresolved', unresolved.most_common(12))
