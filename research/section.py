"""
Print Ganguli's text for one book and section, as the verifiers number them.

    python3 research/section.py 1 98          # Adi Parva, section 98
    python3 research/section.py 1 96-100      # a range
    python3 research/section.py 1 98 --find "eighth"   # only the lines that mention a word
"""
import re, sys

TXT = open('research/ganguli.txt', encoding='utf8', errors='replace').read()
lines = TXT.split('\n')
ones = [i for i, ln in enumerate(lines) if re.match(r'^Section 1\s*$', ln)]
starts = []
for i in ones[1:]:
    if starts and i - starts[-1] < 60:
        starts[-1] = i
    else:
        starts.append(i)
assert len(starts) == 18

def sections():
    book, sec, buf = 0, 0, []
    bs = set(starts)
    for i, ln in enumerate(lines):
        m = re.match(r'^Section (\d+)\s*$', ln)
        if m:
            if book: yield book, sec, buf
            if i in bs: book += 1
            sec, buf = int(m.group(1)), []
            continue
        if book: buf.append(ln)
    yield book, sec, buf

if __name__ == '__main__':
    b = int(sys.argv[1])
    lo, _, hi = sys.argv[2].partition('-')
    lo, hi = int(lo), int(hi or lo)
    find = sys.argv[sys.argv.index('--find') + 1].lower() if '--find' in sys.argv else None
    for book, sec, buf in sections():
        if book == b and lo <= sec <= hi:
            text = re.sub(r'\n{3,}', '\n\n', '\n'.join(buf)).strip()
            print(f'\n═══ Book {book}, Section {sec} ═══')
            if find:
                for para in text.split('\n\n'):
                    if find in para.lower(): print(para.strip(), '\n')
            else:
                print(text)
