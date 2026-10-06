"""Transliteration helpers: SLP1 → Devanagari, IAST → readable English."""
import re

V = {'a': '', 'A': 'ा', 'i': 'ि', 'I': 'ी', 'u': 'ु', 'U': 'ू', 'f': 'ृ', 'F': 'ॄ', 'x': 'ॢ', 'X': 'ॣ',
     'e': 'े', 'E': 'ै', 'o': 'ो', 'O': 'ौ'}
VI = {'a': 'अ', 'A': 'आ', 'i': 'इ', 'I': 'ई', 'u': 'उ', 'U': 'ऊ', 'f': 'ऋ', 'F': 'ॠ', 'x': 'ऌ', 'X': 'ॡ',
      'e': 'ए', 'E': 'ऐ', 'o': 'ओ', 'O': 'औ'}
C = {'k': 'क', 'K': 'ख', 'g': 'ग', 'G': 'घ', 'N': 'ङ', 'c': 'च', 'C': 'छ', 'j': 'ज', 'J': 'झ', 'Y': 'ञ',
     'w': 'ट', 'W': 'ठ', 'q': 'ड', 'Q': 'ढ', 'R': 'ण', 't': 'त', 'T': 'थ', 'd': 'द', 'D': 'ध', 'n': 'न',
     'p': 'प', 'P': 'फ', 'b': 'ब', 'B': 'भ', 'm': 'म', 'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'S': 'श',
     'z': 'ष', 's': 'स', 'h': 'ह', 'L': 'ळ'}
OTHER = {'M': 'ं', 'H': 'ः', '~': 'ँ', "'": 'ऽ'}


def slp1_to_deva(s: str) -> str:
    s = re.sub(r'[^a-zA-Z~\']', '', s)
    out = []
    prev_cons = False
    for ch in s:
        if ch in C:
            if prev_cons:
                out.append('्')
            out.append(C[ch])
            prev_cons = True
        elif ch in V:
            out.append(V[ch] if prev_cons else VI[ch])
            prev_cons = False
        elif ch in OTHER:
            out.append(OTHER[ch])
            prev_cons = False
    if prev_cons:
        out.append('्')
    return ''.join(out)


IAST = [('ṛ', 'ri'), ('ṝ', 'ri'), ('ḷ', 'li'), ('ś', 'sh'), ('ṣ', 'sh'), ('Ś', 'Sh'), ('Ṣ', 'Sh'), ('Ṛ', 'Ri'),
        ('c', 'ch'), ('C', 'Ch'), ('ā', 'a'), ('ī', 'i'), ('ū', 'u'), ('Ā', 'A'), ('Ī', 'I'), ('Ū', 'U'),
        ('ṅ', 'n'), ('ñ', 'n'), ('ṇ', 'n'), ('ṭ', 't'), ('ḍ', 'd'), ('Ṭ', 'T'), ('Ḍ', 'D'), ('ṃ', 'm'), ('ṁ', 'm'),
        ('ḥ', 'h'), ('Ṅ', 'N'), ('Ñ', 'N')]


def iast_to_en(s: str) -> str:
    s = re.sub(r'\[|\]|\*|\(\?\)|\(ḥ\)|\(ṃ\)|\(.*?\)', '', s).strip()
    for a, b in IAST:
        s = s.replace(a, b)
    s = s.replace('chch', 'cch')
    return s[:1].upper() + s[1:]


DIA = str.maketrans({'ā': 'a', 'ī': 'i', 'ū': 'u', 'ś': 's', 'ṣ': 's', 'ṅ': 'n', 'ñ': 'n', 'ṇ': 'n', 'ṭ': 't',
                     'ḍ': 'd', 'ṃ': 'm', 'ṁ': 'm', 'ḥ': 'h', 'á': 'a', 'í': 'i', 'ḷ': 'l'})


def key(s: str) -> str:
    """A forgiving comparison key: IAST 'Citrāṅgada' and English 'Chitrangada' meet as 'citrangada'."""
    fem = bool(re.search(r'ā\)?$', s.strip()))        # Hiḍimbā is not Hiḍimba
    s = s.lower().replace('ṛ', 'ri').replace('ṝ', 'ri').translate(DIA)
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'[^a-z]', '', s)
    s = s.replace('w', 'v').replace('sh', 's').replace('ch', 'c')
    s = re.sub(r'([kgcjtdpb])h', r'\1', s)
    s = re.sub(r'(.)\1+', r'\1', s)
    s = re.sub(r'(m|v)at$', r'\1an', s)  # Hanūmat → Hanuman
    s = re.sub(r'man$', 'ma', s)          # Aśvatthāman → Ashwatthama
    s = re.sub(r'(?<=[^a])in$', 'i', s)   # Śikhaṇḍin → Shikhandi
    s = re.sub(r'(?<=[^aeiou])an$', 'a', s)  # Vṛṣaparvan → Vrishaparva
    s = re.sub(r'(?<=[^aeiou])h$', '', s)
    return s + '2' if fem and s.endswith('a') else s


if __name__ == '__main__':
    for t in ['kIcaka', 'SiSupAla', 'DftarAzwra', 'kfzRa', 'aSvatTAman', 'dO:SAsana', 'BIzma']:
        print(t, slp1_to_deva(t))
    for t in ['Kīcaka', 'Śiśupāla', 'Dhṛtarāṣṭra', 'Aśvatthāman', 'Duḥśāsana']:
        print(t, iast_to_en(t), key(t))
    print(key('Ashwatthama'), key('Dhritarashtra'), key('Shishupala'))
