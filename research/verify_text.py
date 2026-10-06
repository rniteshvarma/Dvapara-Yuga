"""Check every family connection on the map against the text of the epic itself.

Source: K. M. Ganguli's English translation of the Mahabharata (1883–96, public domain),
complete 18 books, from archive.org. For each connection (curated and index-derived) we look
for a passage where both people are named together with a word for that bond — son, begot,
wife, wedded, brother… If found, the connection is *confirmed* and the passage is kept as
evidence (it is shown on the map). If not, the connection is listed for review.

Run from the repo root:  PYTHONPATH=research python3 research/verify_text.py
Output: src/data/evidence.json and research/verification_report.txt
"""
import json
import re
from collections import defaultdict

from translit import key

TXT = open('research/ganguli.txt', encoding='utf8', errors='replace').read()
CUR = json.load(open('research/curated.json'))
CEN = json.load(open('src/data/census.json'))

# ─────────────────────────── 1. the text, by book and section ───────────────────────────

BOOKS = ['Adi', 'Sabha', 'Vana', 'Virata', 'Udyoga', 'Bhishma', 'Drona', 'Karna', 'Shalya', 'Sauptika', 'Stri',
         'Shanti', 'Anushasana', 'Ashvamedhika', 'Ashramavasika', 'Mausala', 'Mahaprasthanika', 'Svargarohana']

flat_parts, marks = [], []          # marks: (char offset, book index 1-18, section)
off, book, sec = 0, 0, 0
raw_lines = TXT.split('\n')
ones = [i for i, ln in enumerate(raw_lines) if re.match(r'^Section 1\s*$', ln)]
# the first "Section 1" of each book; a contents page or a stray sub-book restart sits within a few dozen lines
book_starts = []
for i in ones[1:]:
    if book_starts and i - book_starts[-1] < 60:
        book_starts[-1] = i
    else:
        book_starts.append(i)
assert len(book_starts) == 18, book_starts
bs = set(book_starts)
for i, ln in enumerate(raw_lines):
    m = re.match(r'^Section (\d+)\s*$', ln)
    if m:
        if i in bs:
            book += 1
        sec = int(m.group(1))
        marks.append((off, book, sec))
    flat_parts.append(ln)
    off += len(ln) + 1
flat = '\n'.join(flat_parts)
flat = flat.replace('\n', ' ')
mark_offs = [m[0] for m in marks]

import bisect
def where(pos):
    i = bisect.bisect_right(mark_offs, pos) - 1
    return (marks[i][1], marks[i][2]) if i >= 0 else (0, 0)

def norm(word: str) -> str:
    w = re.sub(r'[^a-z]', '', word.lower())
    w = w.replace('w', 'v').replace('b', 'v')         # Ganguli writes Jamvavati, Aswatthaman, Suvahu
    k = key(w).replace('b', 'v')
    return k[:-1] if len(k) >= 4 and k.endswith('s') else k      # Ayus = Ayu, Hiranyadhanus = Hiranyadhanu

index = defaultdict(list)
for m in re.finditer(r"[A-Z][a-z]{2,}", flat):
    index[norm(m.group(0))].append(m.start())
for k in index:
    index[k].sort()
print('name occurrences', sum(len(v) for v in index.values()))

# ─────────────────────────── 2. names each person goes by ───────────────────────────

STOP = {'king', 'lord', 'mighty', 'great', 'son', 'sons', 'the', 'and', 'kings', 'line', 'kaurava', 'kauravya',
        'yadava', 'pancala', 'suta', 'sutaputra', 'aditya', 'arka', 'kururaja', 'raja', 'devi', 'rishi'}
# Ganguli's own spellings where they differ from the index
SPELL = {'hidimbi': ['Hidimba'], 'tamsu': ['Tansu'], 'k_vyudhoraska': ['Vyudhoru'], 'k_somakirti': ['Somakitri'],
         'k_kundi': ['Kunda'], 'k_sadahsuvak': ['Sada', 'Suvak'], 'jambavan': ['Jamvavat', 'Jambavat'],
         'dasharaja': ['fishermen', 'Dasa'], 'shrutashrava': ['Srutasrava', 'Srutasravas'], 'kichaka': ['Kichaka'],
         'upakichakas': ['Upakichakas'], 'dauhshasani': ['Duhsasana'],
         'druhyu': ['Drahyu'], 'surya': ['Vivaswat', 'Martanda'], 'bahlika': ['Valhika', 'Vahlika'], 'karna': ['Kama'], 'anashvan': ['Anaswan', 'Anas'], 'ulupi': ['Ulupi'], 'iravan': ['Iravat'],
         'adrika': ['Adrika'], 'prishati': ['queen'], 'uttar': ['Uttara', 'Bhuminjaya'], 'vrishaketu': ['Vrishaketu'], 'k_vivimshati': ['Vivinsati'], 'kauravya': ['Kauravya'], 'prabhasa': ['Dyu']}
people = {}
for c in CUR['characters']:
    people[c['id']] = [c['n']] + c.get('al', [])
for r in CEN['chars']:
    people[r[0]] = [r[1]]
for a, t in CEN['aliases']:
    if t in people and len(people[t]) < 40:
        people[t].append(a)
for pid, extra in SPELL.items():
    people.setdefault(pid, []).extend(extra)

def _raw_forms(pid):
    out = set()
    for n in people.get(pid, []):
        for part in [n] + n.split():
            k = norm(part)
            if len(k) >= 3 and (k not in STOP or n in SPELL.get(pid, ())) and (len(k) >= 4 or part == n):
                out.add(k)
    return out

# a form several people answer to (an epithet such as "Ajamidha") proves nothing about any one of them
_share = defaultdict(int)
for pid in people:
    for f in _raw_forms(pid):
        _share[f] += 1

def forms(pid):
    own = {norm(w) for n in people.get(pid, [])[:1] for w in n.split() if len(w) > 2} | {norm(x) for x in SPELL.get(pid, [])}
    return {f for f in _raw_forms(pid) if _share[f] <= 2 or f in own}

# ─────────────────────────── 3. bond words ───────────────────────────

BOND = {
    'parent': r'\b(bom|son|sons|daughter|daughters|begot|begat|begotten|beget|born|father|mother|sire|offspring|child|children|issue|conceived|bore|brought forth|gave birth|progeny|race)\b',
    'spouse': r'\b(begat upon|begot upon|wife|wives|husband|husbands|wedded|wed|married|marry|spouse|queen|consort|espoused|bride|took .* to wife)\b',
    'sibling': r'\b(brother|brothers|sister|sisters|uterine)\b',
    'adoptive': r'\b(adoptive|made her his daughter|made him his son|foster|adopted|reared|brought up|nursed|raised|took .* as)\b',
}
BOND['legal'] = BOND['parent']; BOND['divine'] = BOND['parent']; BOND['niyoga'] = BOND['parent']
BOND['boon'] = r'\b(born|sprang|arose|came out|issued|fire|vessel|reeds|daughter|son)\b'
BOND['rebirth'] = r'\b(born again|reborn|in a former life|became|was born as|incarnat)'
BOND['slew'] = (r'\b(slew|slain|slay|slayer|slaying|killed|kill|killing|despatched|dispatched|struck down|felled|'
                r'cut off .{0,30}head|deprived .{0,40}of life|sent .{0,30}to (?:the abode of )?Yama|death|destroyed)\b')
BOND['avatar'] = r'\b(incarnat|portion|born|Narayana|Vishnu)\b'


def snippet(lo, hi):
    """The passage from the start of the sentence holding `lo` to the end of the one holding `hi`."""
    s = max(flat.rfind('. ', 0, lo), flat.rfind('? ', 0, lo), flat.rfind('! ', 0, lo), flat.rfind("' ", 0, lo - 1) if False else -1)
    s = s + 2 if s >= 0 else lo
    e = min([x for x in (flat.find('. ', hi), flat.find('? ', hi), flat.find('! ', hi)) if x >= 0] or [hi + 80]) + 1
    # never run across a section heading
    heads = [m.end() for m in re.finditer(r'Section \d+\s+', flat[s:lo])]
    if heads:
        s += heads[-1]
    nxt = re.search(r'\s*Section \d+\s', flat[hi:e])
    if nxt:
        e = hi + nxt.start()
    q = re.sub(r'\s+', ' ', flat[s:e]).strip(' "\'')
    if len(q) > 340:                                 # centre a long passage on the two names
        mid = (lo + hi) // 2 - s
        a0 = max(0, min(len(q) - 330, mid - 165))
        q = ('…' if a0 else '') + q[a0:a0 + 330].strip() + ('…' if a0 + 330 < len(q) else '')
    return q


def positions(pid):
    out = []
    for f in forms(pid):
        out += index.get(f, [])
    return sorted(out)


LIST117 = re.search(r'are\s+Duryodhana,\s+Yuyutsu,\s+Duhsasana', flat).start()            # Adi §117, the hundred in order of birth
LIST67 = re.search(r'they\s+are\s+as\s+follows:\s+Duryodhana,\s+and\s+Yuyutsu', flat).start()   # Adi §67
THY_SONS = [m.start() for m in re.finditer(r"\bthy (?:heroic |brave |mighty )?sons?\b|sons? of Dhritarashtra|Dhartarashtra", flat)]


def check(a, b, t, wide=False):
    pa, pb = positions(a), positions(b)
    if not pa or not pb:
        return None
    rx = re.compile(BOND.get(t, BOND['parent']), re.I)
    W = 650 if wide else 260
    pad = 90 if wide else 45
    best = None
    for x in pa:
        i = bisect.bisect_left(pb, x - W)
        while i < len(pb) and pb[i] <= x + W:
            y = pb[i]
            lo, hi = min(x, y), max(x, y)
            if 'Section ' in flat[lo:hi]:                 # two passages, not one
                i += 1
                continue
            span = flat[max(0, lo - pad):hi + pad]
            if rx.search(span):
                d = hi - lo
                if re.search(r'[.?!]\s', flat[lo:hi]):
                    d += 120                                   # the names sit in different sentences
                if re.match(r'\s*\d+:\d+', flat[max(0, lo - 40):lo].split('  ')[-1]):
                    d += 200                                   # a translator's footnote, not the epic
                if best is None or d < best[0]:
                    best = (d, lo, hi)
            i += 1
        if best and best[0] < 50:
            break
    if not best:
        return None
    _, lo, hi = best
    bk, sec = where(lo)
    return snippet(lo, hi), bk, sec


def in_hundred(cid):
    """Is this name in the Adi Parva list of Dhritarashtra's hundred sons?"""
    for f in forms(cid):
        for p in index.get(f, []):
            if LIST117 <= p <= LIST117 + 2000 or LIST67 <= p <= LIST67 + 2200:
                return p, None
    # or named in the battle books as one of "thy sons", Sanjaya speaking to Dhritarashtra
    for f in forms(cid):
        for p in index.get(f, []):
            i = bisect.bisect_left(THY_SONS, p - 220)
            if i < len(THY_SONS) and THY_SONS[i] <= p + 220:
                return p, snippet(min(p, THY_SONS[i]), max(p, THY_SONS[i]))
    return None


rels = []
for c in CUR['characters']:
    for p in c.get('p', []):
        rels.append((p, c['id'], 'parent', 'curated'))
for a, b, t in CUR['relations']:
    rels.append((a, b, t, 'curated'))
for a, b, t in CEN['rels']:
    rels.append((a, b, t, 'index'))
SLEW = [(x[0], x[1], 'slew', 'deaths') for x in CEN['stories'] if x[2] == 'slew']
rels += SLEW

tier = {c['id']: c['t'] for c in CUR['characters']}
for r in CEN['chars']:
    tier[r[0]] = r[5]

# Read by hand where the bond is told without the plain kinship words, or across a long passage.
# (key, quote, book, section) — quotes are Ganguli's words.
MANUAL = {
    'adrika|satyavati|parent': ('The fish-smelling daughter of the Apsara in her piscatorial form was then given by the king unto the fishermen… That girl was known by the name of Satyavati.', 1, 63),
    'dasharaja|satyavati|adoptive': ('The fish-smelling daughter of the Apsara… was then given by the king unto the fishermen, saying, ‘Let this one be thy daughter.’ That girl was known by the name of Satyavati.', 1, 63),
    'parishrami|vidura|parent': ('She, however, sent unto him, a maid of hers, endued with the beauty of an Apsara… And, O king, the son thus begotten upon her by Krishna-Dwaipayana was afterwards known by the name of Vidura.', 1, 0),
    'shantanu|kripa|adoptive': ('Santanu, the son of Pratipa having brought Gautama’s twins into his house, performed in respect of them the usual rites of religion. And he began to bring them up and called them Kripa and Kripi.', 1, 129),
    'shantanu|kripi|adoptive': ('Santanu, the son of Pratipa having brought Gautama’s twins into his house, performed in respect of them the usual rites of religion. And he began to bring them up and called them Kripa and Kripi.', 1, 129),
    'vasudeva|devaki|spouse': ('Vishnu himself, of world-wide fame, and worshipped of all the worlds, was born of Devaki through Vasudeva.', 1, 63),
    'vasudeva|rohini|spouse': ('Those two hairs entered the wombs of two of the Yadu race, by name Devaki and Rohini. And one of these hairs viz., that which was white, became Valadeva.', 1, 199),
    'prabhasa|bhishma|rebirth': ('And O best of kings, from the Rishi’s curse, this one only, viz., Dyu, himself, is to live on earth for some time… And that child of Santanu was named both Gangeya and Devavrata.', 1, 99),
    'prishati|shikhandi|parent': ('The eldest and beloved queen of king Drupada was, O monarch, childless (at first)… And saying that the child was a son, Drupada’s queen kept her counsels very carefully.', 5, 189),
    'drupada|prishati|spouse': ('The eldest and beloved queen of king Drupada was, O monarch, childless (at first).', 5, 189),
    'kauravya|ulupi|parent': ('There is a Naga of the name of Kauravya, born in the line of Airavata. I am, O prince, the daughter of that Kauravya, and my name is Ulupi.', 1, 216),
    'ulupi|iravan|parent': ('Iravat… that daughter’s son of the king of the Nagas, displaying his prowess, then began to consume with great activity thy ranks.', 6, 90),
    'duhshala|suratha|parent': ('Dussala then answered him… ‘Burning with grief on account of the slaughter of his sire, the heroic father of this child…’ The child was the son of Suratha (the son of Jayadratha).', 14, 78),
    'shrutashrava|shishupala|parent': ('Hearing that the son of Srutasravas (Sisupala) had been slain by me, Salwa… came to the city of Dwaravati!', 3, 15),
    'damaghosha|shrutashrava|spouse': ('Sisupala, the son of Damaghosa… / the son of Srutasravas (Sisupala) — the epic names both as Shishupala’s parents.', 3, 15),
    'krishna|i3996_gandhari|spouse': ('Rukmini, the princess of Gandhara, Saivya, Haimavati, and queen Jamvabati ascended the funeral pyre. Satyabhama and other dear wives of Krishna entered the woods.', 16, 0),
    'kichaka|upakichakas|sibling': ('Then all the relatives of Kichaka, arriving at that place, beheld him there and began to wail aloud… And all the Kichakas assembled there, exclaimed, ‘Let this unchaste woman be slain for whom Kichaka hath himself lost his life.’', 4, 0),
    'vasudeva|krishna|parent': ('Vishnu himself, of world-wide fame, and worshipped of all the worlds, was born of Devaki through Vasudeva, for the benefit of the three worlds.', 1, 0),
    'surya|karna|divine': ('Thus speaking unto the daughter of Kuntibhoja, the illustrious Tapana—the illuminator of the universe—gratified his wish. And of this connection there was immediately born a son known all over the world as Karna accoutred with natural armour.', 1, 0),
    'surya|dharma|parent': ('And of Vivaswat was born the lord Yama. And Martanda (Vivaswat) also begat another son after Yama, gifted with great intelligence and named Manu.', 1, 0),
    'surya|manu|parent': ('And of Vivaswat was born the lord Yama. And Martanda (Vivaswat) also begat another son after Yama, gifted with great intelligence and named Manu.', 1, 0),
    'aniruddha|vajra|parent': ('Vajra, the grandson of the intelligent Krishna… The rule of Indraprastha was given to Vajra.', 16, 7),
}
# Bonds the Mahabharata does not tell; they come from the books that continue it.
LATER_LINKS = {
    'nanda|yashoda|spouse': 'Harivamsha · Bhagavata Purana',
    'yashoda|krishna|adoptive': 'Harivamsha · Bhagavata Purana (the Mahabharata names her only in passing)',
    'jambavan|jambavati|parent': 'Harivamsha · Bhagavata Purana',
    'shura|shrutashrava|parent': 'Harivamsha · Bhagavata Purana',
    'vasudeva|subhadra|parent': 'The Mahabharata calls her “the sister of Vasudeva” (Krishna); that the elder Vasudeva was her father is told in the Harivamsha.',
    'vasudeva|balarama|parent': 'The Mahabharata calls him the son of Rohini and Krishna’s elder brother; that Vasudeva was his father is told in the Harivamsha.',
    'surya|ashvins|parent': 'The Mahabharata calls the Ashvins “nose-born”; their birth to the Sun and Saranyu in the form of a mare is told in the Harivamsha.',
}
def anchor(q):
    """Find a hand-picked quote in the text (by its longest plain run of words) and return its book and section."""
    runs = sorted(re.split(r'…|/|‘|’|—|\(|\)', q), key=len, reverse=True)
    for r in runs:
        r = r.strip(' .,;!—')
        if len(r) < 25:
            continue
        pat = r'\s+'.join(re.escape(w) for w in r.replace('’', "'").split())
        pat = pat.replace('born', '(?:born|bom)').replace('Karna', '(?:Karna|Kama)')     # the scan's OCR slips
        m = re.search(pat, flat, re.I)
        if m:
            return where(m.start())
    raise SystemExit('quote not found in the text: ' + q[:80])


LATER = {c['id'] for c in CUR['characters'] if re.search(r'Purana|not in the Mahabharata|not named in the Mahabharata|folk|television|TV|later tradition|Harivamsha|Bhagavata', c.get('v', ''))}
KUR = {c['id'] for c in CUR['characters'] if c.get('cl') == 'kauravas'}

evidence = {}
report = defaultdict(list)
for a, b, t, src in rels:
    k = f'{a}|{b}|{t}'
    if k in MANUAL:
        q = MANUAL[k][0]
        bk, sec = anchor(q)
        evidence[k] = {'q': q, 'b': bk, 's': sec}
        report['confirmed', src].append(k)
        continue
    if (a in LATER or b in LATER or LATER_LINKS.get(k)):
        note = LATER_LINKS.get(k) or next(c.get('v', '') for c in CUR['characters'] if c['id'] in (a, b) and c['id'] in LATER)
        evidence[k] = {'l': note}
        report['later tradition', src].append(k)
        continue
    kaurava = b in KUR and a in ('dhritarashtra', 'gandhari')
    res = None if kaurava else (check(a, b, t) or check(a, b, t, wide=True))
    if not res and kaurava:
        hit = in_hundred(b)
        if hit is not None:
            p, q = hit
            bk, sec = where(p)
            res = (q or 'Their names, O king, according to the order of birth, are Duryodhana, Yuyutsu, Duhsasana… '
                   '(the hundred sons of Dhritarashtra)', bk, sec)
    if res:
        quote, bk, sec = res
        evidence[k] = {'q': quote, 'b': bk, 's': sec}
        report['confirmed', src].append(k)
    else:
        report['unconfirmed', src].append(k)

json.dump(evidence, open('src/data/evidence.json', 'w'), ensure_ascii=False, separators=(',', ':'))

def name(pid):
    for c in CUR['characters']:
        if c['id'] == pid:
            return c['n']
    for r in CEN['chars']:
        if r[0] == pid:
            return r[1]
    return pid

with open('research/verification_report.txt', 'w') as f:
    for (status, src), ks in sorted(report.items()):
        f.write(f'\n## {status} · {src} · {len(ks)}\n')
        for k in sorted(ks, key=lambda k: min(tier.get(k.split('|')[0], 4), tier.get(k.split('|')[1], 4))):
            a, b, t = k.split('|')
            q = evidence.get(k, {}).get('q', '') or evidence.get(k, {}).get('l', '')
            f.write(f'{t:9s} {name(a):18s} → {name(b):18s} [{min(tier.get(a, 4), tier.get(b, 4))}] {BOOKS[evidence[k]['b']-1] + ' ' + str(evidence[k]['s']) + ' · ' if 'b' in evidence.get(k, {}) else ''}{q[:170]}\n')

for (status, src), ks in sorted(report.items()):
    print(f'{status:12s} {src:8s} {len(ks)}')

if __name__ == '__main__' and __import__('os').environ.get('DEBUG'):
    for k in report['unconfirmed', 'curated']:
        a, b, t = k.split('|')
        print(f'{t:8s} {a:14s} {len(positions(a)):5d} {sorted(forms(a))[:4]}   {b:14s} {len(positions(b)):5d} {sorted(forms(b))[:4]}')
