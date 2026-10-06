"""A second witness: Vettam Mani's *Puranic Encyclopaedia* (1975), which digests the Mahabharata, the
Harivamsha and the Puranas entry by entry.

For every family bond of a main character we ask whether either person's entry in the Encyclopaedia names
the other. Bonds neither the epic's text (verify_text.py) nor the Encyclopaedia supports are the ones most
likely to be wrong, and are listed for review in research/pe_report.txt.

Run from the repo root:  PYTHONPATH=research python3 research/verify_pe.py
"""
import json
import re
from collections import defaultdict

from translit import key

PE = open('research/puranic_enc.txt', encoding='utf8', errors='replace').read()
CUR = json.load(open('research/curated.json'))
CEN = json.load(open('src/data/census.json'))
EV = json.load(open('src/data/evidence.json'))


def norm(w):
    w = re.sub(r'[^a-z]', '', w.lower()).replace('w', 'v').replace('b', 'v')
    return re.sub(r'ri', 'r', key(w).replace('b', 'v'))     # the scan drops diacritics: Krsna, Dhrtarastra


# ── entries: "KRSNA.", "ARJUNA II.", "GANDHARI I." … each runs until the next headword ──
HEAD = re.compile(r'^([A-Z][A-Z1l]{1,30})(?:\s+([IVX]{1,5}))?\s*(?:\([^)\n]{0,40}\))?\s*\.\s', re.M)
entries = defaultdict(list)            # name key → [text of each homonym]
heads = list(HEAD.finditer(PE))
for i, m in enumerate(heads):
    end = heads[i + 1].start() if i + 1 < len(heads) else len(PE)
    body = PE[m.end():end]
    if len(body) < 8:
        continue
    entries[norm(m.group(1).replace('1', 'I').replace('l', 'I'))].append(re.sub(r'\s+', ' ', body))
print('entries', sum(len(v) for v in entries.values()), 'names', len(entries))

people = {c['id']: [c['n']] + c.get('al', []) for c in CUR['characters']}
for r in CEN['chars']:
    people[r[0]] = [r[1]]
tier = {c['id']: c['t'] for c in CUR['characters']}
for r in CEN['chars']:
    tier[r[0]] = r[5]
name = {c['id']: c['n'] for c in CUR['characters']}
name.update({r[0]: r[1] for r in CEN['chars']})


def forms(pid):
    out = set()
    for n in people.get(pid, [])[:6]:
        for part in [n] + n.split():
            k = norm(part)
            if len(k) >= 4 and k not in {'king', 'line', 'kings', 'puru'}:
                out.add(k)
    return out


def text_of(pid):
    t = []
    for n in people.get(pid, [])[:1]:
        t += entries.get(norm(n.split()[0] if n.startswith('The ') is False else n.split()[-1]), [])
        t += entries.get(norm(n), [])
    return ' '.join(dict.fromkeys(t))


def mentions(txt, pid):
    words = {norm(w) for w in re.findall(r'[A-Za-z]{3,}', txt)}
    return bool(forms(pid) & words)


rels = []
for c in CUR['characters']:
    for p in c.get('p', []):
        rels.append((p, c['id'], 'parent'))
rels += [tuple(r) for r in CUR['relations']]
rels += [tuple(r) for r in CEN['rels']]

report = defaultdict(list)
for a, b, t in rels:
    if min(tier.get(a, 4), tier.get(b, 4)) > 2:
        continue
    ta, tb = text_of(a), text_of(b)
    pe = (ta and mentions(ta, b)) or (tb and mentions(tb, a))
    ev = EV.get(f'{a}|{b}|{t}') or EV.get(f'{b}|{a}|{t}') or {}
    status = ('text' if ev.get('q') else 'later' if ev.get('l') else 'index') + ('+PE' if pe else ('-PE' if (ta or tb) else ' noPE'))
    report[status].append(f'{t:9s} {name.get(a, a):20s} → {name.get(b, b):22s} [{min(tier.get(a, 4), tier.get(b, 4))}]')

with open('research/pe_report.txt', 'w') as f:
    for k in sorted(report):
        f.write(f'\n## {k} · {len(report[k])}\n' + '\n'.join(sorted(report[k], key=lambda s: s[-2])) + '\n')
for k in sorted(report):
    print(f'{k:14s} {len(report[k])}')

if __import__('os').environ.get('DEBUG'):
    for a, b in [('krishna', 'pradyumna'), ('kunti', 'bhima'), ('dhritarashtra', 'duryodhana'), ('brahma', 'marichi')]:
        ta = text_of(a)
        print(a, len(ta), forms(b), 'Pradyumna' in ta, ta[:120])
    t = text_of('dhritarashtra'); print('Duryodhana' in t, mentions(t, 'duryodhana'), norm('Duryodhana'), [w for w in re.findall(r'[A-Za-z]{3,}', t) if w.startswith('Duryo')][:3])
