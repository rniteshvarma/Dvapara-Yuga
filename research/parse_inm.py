"""Step 1: split the INM text into entries → research/inm.json."""
import json
import re

t = open('research/inm.txt', encoding='utf8').read()
# the digitisers' corrections, {{old->new|date|editor|url}}: keep the corrected reading
t = re.sub(r'\{\{[^{}]*?->([^|{}]*)\|[^{}]*\}\}', r'\1', t)
t = re.sub(r'\{\{[^{}]*\}\}', '', t)
t = re.sub(r'</?is>', '', t)
ents = re.findall(r'<L>(\d+)<pc>([^<]*)<k1>([^<]*)<k2>([^\n]*)\n(.*?)<LEND>', t, re.S)
out = []
for L, pc, k1, k2, body in ents:
    m = re.match(r'\{@(.+?)@\}', body.strip())
    head = m.group(1) if m else k1
    rest = (body.strip()[m.end():] if m else body).replace('¦', '').strip()
    out.append(dict(L=int(L), head=head, desc=re.sub(r'\s+', ' ', rest.split('§')[0]).strip(), body=re.sub(r'\s+', ' ', rest)))
json.dump(out, open('research/inm.json', 'w'), ensure_ascii=False)
print(len(out), 'entries')
