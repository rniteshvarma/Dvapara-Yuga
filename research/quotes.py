"""“In their own words” — lines each character speaks in the epic, quoted from K. M. Ganguli's translation
(1883–96, public domain). Every quote is checked against research/ganguli.txt and placed by book and section;
a quote that cannot be found stops the build.

The scan's OCR slips are corrected for display (it reads "Kama" for Karna); the check allows for them.

Run from the repo root:  PYTHONPATH=research python3 research/quotes.py   → src/data/quotes.json
"""
import json

from verify_text import anchor

# id → [(quote, to whom / when)]
Q = {
  'yudhishthira': [
    ('Day after day countless creatures are going to the abode of Yama, yet those that remain behind believe themselves to be immortal. What can be more wonderful than this?',
     'Answering the Yaksha at the lake'),
    ('O great Indra, I shall not abandon this dog today from desire of my happiness.',
     'At the gate of heaven, refusing to leave the dog that followed him'),
  ],
  'draupadi': [
    ('Go, and ask that gambler present in the assembly, whom he hath lost first, himself, or me.',
     'To the messenger sent to fetch her to the dice hall'),
  ],
  'bhima': [
    ('The earth shall drink the blood of Duryodhana, and Karna, and the wicked Sakuni, and Dussasana that maketh the fourth.',
     'Leaving for exile after the dice game'),
  ],
  'arjuna': [
    ('I wish not to slay these though they slay me, O slayer of Madhu, even for the sake of the sovereignty of the three worlds, what then for the sake of (this) earth?',
     'To Krishna, as the armies stood ready at Kurukshetra'),
  ],
  'krishna': [
    ('Whenever, O Bharata, loss of piety and the rise of impiety occurreth, on those occasions do I create myself. For the protection of the righteous and for the destruction of the evil doers, for the sake of establishing Piety, I am born age after age.',
     'The Bhagavad Gita, to Arjuna'),
  ],
  'duryodhana': [
    ('As long as I live, even that much of our land which may be covered by the point of a sharp needle shall not, O Madhava, be given by us unto the Pandavas.',
     'Refusing Krishna’s embassy of peace'),
  ],
  'bhishma': [
    ('O fisherman, from this day I adopt the vow of Brahmacharya (study and meditation in celibacy).',
     'To Satyavati’s father, so that Shantanu might marry her'),
  ],
  'karna': [
    ('O famous lady, the number of thy sons will never be less than five. Five it will always be,—either with me, or with Arjuna, and myself slain.',
     'To Kunti, when she revealed that she was his mother'),
  ],
  'drona': [
    ('I should like then to have the thumb of thy right hand.',
     'To Ekalavya, asking his teacher’s fee'),
  ],
  'gandhari': [
    ('Since thou wert indifferent to the Kurus and the Pandavas whilst they slew each other, therefore, O Govinda, thou shalt be the slayer of thy own kinsmen!',
     'Cursing Krishna on the battlefield after the war'),
  ],
}

out = {}
for cid, qs in Q.items():
    out[cid] = []
    for q, when in qs:
        bk, sec = anchor(q)
        out[cid].append({'q': q, 'w': when, 'b': bk, 's': sec})
json.dump(out, open('src/data/quotes.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(sum(len(v) for v in out.values()), 'quotes for', len(out), 'characters')
