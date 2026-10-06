"""Researched profile details for the main characters: banner, conch, bow and arms, chariot, teachers,
side in the war, and the turning points of a life.

Every detail that can be is tied to Ganguli's own words: `a` is a phrase that must occur in research/ganguli.txt.
This script checks each one and records its book and section, so a profile can say where the epic tells it.
A detail without a phrase carries the book it comes from (`p`, 1–18) and is shown as a summary.

Run from the repo root:  PYTHONPATH=research python3 research/details.py   → src/data/details.json
"""
import json
import re

from verify_text import anchor  # finds a quote in the text and returns (book, section)

# side: 'pandava' | 'kaurava' | 'neither' (did not fight) — the side each fought on at Kurukshetra
D = {
  # ───────────────────────── the Pandavas ─────────────────────────
  'yudhishthira': dict(
    side='pandava',
    banner=('A golden moon with the planets around it; the kettle-drums Nanda and Upananda tied to it',
            'bearing the device of a golden moon with planets around it'),
    conch=('Anantavijaya', 'Kunti\'s son king Yudhishthira blew (the conch called) Anantavijaya'),
    bow=('Mahendra', 'In Yudhishthira\'s hands was the celestial bow called Mahendra'),
    teachers=['kripa', 'drona'],
    life=[(1, 'Born to Kunti by Dharma; raised in the forest until Pandu’s death'),
          (1, 'Survives the house of lac; shares Draupadi with his brothers'),
          (2, 'Performs the Rajasuya and is crowned emperor at Indraprastha'),
          (2, 'Gambles away his kingdom, his brothers, himself and Draupadi'),
          (3, 'Answers the Yaksha at the lake and wins back his brothers’ lives'),
          (4, 'Lives a year in Virata’s court as the dice-master Kanka'),
          (7, 'Tells Drona the half-truth “Ashwatthama is dead”'),
          (9, 'Kills Shalya with a spear on the last day of the war'),
          (12, 'Crowned at Hastinapura; learns the duties of kings from Bhishma'),
          (17, 'Walks to the Himalayas; reaches heaven in his own body')]),
  'bhima': dict(
    side='pandava',
    banner=('A gigantic silver lion with eyes of lapis lazuli',
            'Bhimasena\'s standard, bearing the device of a gigantic lion in silver'),
    conch=('Paundra', 'Vrikodara of terrible deeds blew the huge conch (called) Paundra'),
    bow=('Vayavya', 'in the hands of Bhimasena, O king, was the celestial bow called Vayavya'),
    arms=('A great mace from the lake Bindu, given by the asura Maya', 'It is a fit weapon for Bhima, even as the Gandiva is for thee'),
    teachers=['drona', 'balarama'],
    life=[(1, 'Born to Kunti by Vayu; poisoned and thrown into the river by Duryodhana, he returns stronger'),
          (1, 'Kills Hidimba and Baka; marries Hidimbi'),
          (2, 'Kills Jarasandha in a wrestling match; vows to drink Duhshasana’s blood and break Duryodhana’s thigh'),
          (3, 'Meets his brother Hanuman while fetching flowers for Draupadi'),
          (4, 'Cook Ballava in Virata’s court; kills Kichaka'),
          (8, 'Drinks Duhshasana’s blood on the seventeenth day'),
          (9, 'Breaks Duryodhana’s thighs in the mace duel'),
          (17, 'Falls on the final journey')]),
  'arjuna': dict(
    side='pandava',
    banner=('An ape — Hanuman — of fierce face and lion-like tail',
            'The standard, bearing the sign of the ape of fierce face and tail'),
    conch=('Devadatta, from Varuna, found in the lake Bindu', 'a large conch-shell called Devadatta of loud sound, that came from Varuna'),
    bow=('Gandiva — made by Brahma, given by Varuna through Agni at Khandava, with two inexhaustible quivers',
         'celestial and first of bows created by Brahman of old and called Gandiva'),
    arms=('The Pashupata weapon, from Shiva himself', 'I myself have given him the celestial weapon called Pasupata'),
    charioteer='krishna',
    teachers=['drona', 'kripa', 'indra', 'shiva'],
    life=[(1, 'Born to Kunti by Indra; Drona’s finest pupil'),
          (1, 'Wins Draupadi at her svayamvara'),
          (1, 'Exile of twelve months; marries Ulupi, Chitrangada and Subhadra; burns the Khandava forest'),
          (3, 'Fights Shiva disguised as a hunter; studies weapons in Indra’s heaven'),
          (4, 'Lives as the dancer Brihannala; defeats the whole Kaurava host alone'),
          (6, 'Hears the Bhagavad Gita from Krishna before the battle'),
          (6, 'Brings down Bhishma from behind Shikhandi'),
          (7, 'Kills Jayadratha before sunset to avenge Abhimanyu'),
          (8, 'Kills Karna'),
          (14, 'Guards the horse of the Ashvamedha; killed by Babhruvahana and revived by Ulupi'),
          (16, 'Cannot protect the Yadava women; his strength fails')]),
  'nakula': dict(
    side='pandava',
    banner=('A sharabha with a back of gold', 'bearing the device of a Sarabha with its back'),
    conch=('Sughosha', 'Nakula and Sahadeva, (those conches called respectively) Sughosa and Manipushpaka'),
    bow=('Vaishnava', 'The Vaishnava bow was held by Nakula'),
    teachers=['drona'],
    life=[(1, 'Born to Madri by the Ashvins'), (4, 'Keeps Virata’s horses as Granthika'),
          (17, 'Falls on the final journey, for pride in his beauty')]),
  'sahadeva': dict(
    side='pandava',
    banner=('A silver swan with bells', 'A beautiful silver swan with bells and banner terrible to look'),
    conch=('Manipushpaka', 'Nakula and Sahadeva, (those conches called respectively) Sughosa and Manipushpaka'),
    bow=('Ashvina', 'the bow called Aswina was held by Sahadeva'),
    teachers=['drona'],
    life=[(1, 'Born to Madri by the Ashvins'), (2, 'Vows to kill Shakuni'), (4, 'Keeps Virata’s cattle as Tantipala'),
          (9, 'Kills Shakuni on the last day'), (17, 'The first of the brothers to fall on the final journey')]),
  'draupadi': dict(
    side='pandava',
    life=[(1, 'Born from Drupada’s sacrificial fire'), (1, 'Won by Arjuna; marries all five brothers'),
          (2, 'Dragged into the dice hall; her honour saved; she wins back her husbands’ freedom'),
          (3, 'Jayadratha tries to carry her off'), (4, 'Serves Sudeshna as the maid Sairandhri; Kichaka is killed for her'),
          (10, 'Her five sons are killed in the night raid'), (17, 'The first to fall on the final journey')]),
  'abhimanyu': dict(
    side='pandava',
    banner=('A golden peacock', 'an excellent standard that bore a golden peacock'),
    bow=('Raudra, the bow Balarama gave him', 'That excellent and best of bows, called the Raudra, which Rohini\'s son'),
    teachers=['arjuna', 'balarama'],
    life=[(4, 'Marries Virata’s daughter Uttara'), (7, 'Breaks into the Chakravyuha on the thirteenth day and is killed inside it')]),
  'ghatotkacha': dict(
    side='pandava',
    banner=('A vulture', 'On Ghatotkacha\'s standard, O king, a vulture shone brightly'),
    bow=('Paulastya', 'terrible bow called the Paulastya, was held by Ghatotkacha'),
    life=[(1, 'Born to Hidimbi; promises to come whenever his father calls'), (7, 'Wrecks the Kaurava army in the night battle; killed by Karna’s Shakti')]),
  'dhrishtadyumna': dict(
    side='pandava',
    banner=('Made of the trunk of a lofty kovidara tree', 'whose standard was made of a lofty Kovidara'),
    teachers=['drona'],
    life=[(1, 'Born from the fire, in armour, to kill Drona'), (5, 'Made commander of the Pandava army'),
          (7, 'Beheads Drona'), (10, 'Strangled by Ashwatthama in his sleep')]),
  'krishna': dict(
    side='pandava',
    banner=('Garuda', 'for my standard and for the heroic Garuda thereon'),
    conch=('Panchajanya', 'Panchajanya and Dhananjaya (that called) Devadatta'),
    arms=('The discus Sudarshana from Agni and the mace Kaumodaki from Varuna, given at Khandava', 'Pavaka then gave unto Krishna a discus'),
    charioteer='i3153_daruka',
    horses=('Shaibya, Sugriva, Meghapushpa and Valahaka', 'yoking thereto my foremost of steeds named Valahaka and Meghapushpa and Saivya and Sugriva'),
    life=[(1, 'Born to Devaki in Kamsa’s prison; raised by Nanda and Yashoda'),
          (2, 'Has Jarasandha killed; given the first honour at the Rajasuya; kills Shishupala'),
          (5, 'Goes to Hastinapura as the Pandavas’ envoy; shows his universal form'),
          (6, 'Speaks the Bhagavad Gita to Arjuna'),
          (11, 'Cursed by Gandhari to see his own clan destroyed'),
          (16, 'Killed by the hunter Jara after the Yadavas destroy one another')]),
  'satyaki': dict(side='pandava', teachers=['arjuna'],
    life=[(7, 'Fights his way to Arjuna on the fourteenth day; beheads Bhurishravas'), (16, 'Killed in the brawl at Prabhasa')]),
  'virata': dict(side='pandava', life=[(4, 'Shelters the Pandavas in disguise for their thirteenth year'), (7, 'Killed by Drona on the fifteenth day')]),
  'drupada': dict(side='pandava', teachers=['bharadvaja'],
    life=[(1, 'Insults his childhood friend Drona; defeated by Drona’s students and loses half his kingdom'),
          (1, 'Holds the sacrifice from which Draupadi and Dhrishtadyumna are born'), (7, 'Killed by Drona on the fifteenth day')]),
  'shikhandi': dict(side='pandava', teachers=['drona'],
    life=[(5, 'Born a daughter and becomes a man by exchanging sex with a yaksha'), (6, 'Rides before Arjuna against Bhishma on the tenth day'),
          (10, 'Killed by Ashwatthama in the night raid')]),
  'iravan': dict(side='pandava', life=[(6, 'Killed by the rakshasa Alambusha on the eighth day')]),

  # ───────────────────────── the Kaurava side ─────────────────────────
  'bhishma': dict(
    side='kaurava',
    banner=('A golden palmyra tree with five stars, on a silver standard',
            'graced with the device of the palmyra with five stars'),
    teachers=['vasishtha', 'shukra', 'parashurama'],
    life=[(1, 'Born to Ganga; swears never to marry or rule'), (1, 'Carries off the princesses of Kashi for Vichitravirya'),
          (5, 'Fights Parashurama, his own teacher, to a standstill over Amba'),
          (6, 'Commands the Kauravas for ten days; tells the Pandavas how he can be beaten'),
          (6, 'Falls to Arjuna’s arrows on the tenth day'), (12, 'From the bed of arrows, teaches Yudhishthira the duties of kings'),
          (13, 'Dies at the winter solstice')]),
  'drona': dict(
    side='kaurava',
    banner=('A black deer-skin above a beautiful water-pot', 'His standard, with a black deer-skin waving on its top and the beautiful water-pot'),
    teachers=['bharadvaja', 'parashurama'],
    life=[(1, 'Born from a vessel; spurned by Drupada'), (1, 'Teaches the Kuru princes; asks Ekalavya for his thumb'),
          (1, 'Takes half of Drupada’s kingdom as his fee'), (7, 'Commands the Kauravas after Bhishma; forms the Chakravyuha'),
          (7, 'Lays down his weapons at “Ashwatthama is dead”; beheaded by Dhrishtadyumna')]),
  'karna': dict(
    side='kaurava',
    banner=('An elephant-rope of gold', 'The standard of Adhiratha\'s son bore the mark of an elephant-rope made of gold'),
    bow=('Vijaya, the bow of Indra, from Parashurama', 'I also have that excellent, celestial, and formidable bow called Vijaya'),
    arms=('Indra’s Shakti, which could kill one foe; spent on Ghatotkacha', 'Indra'),
    charioteer='shalya',
    teachers=['drona', 'parashurama'],
    life=[(1, 'Born to Kunti by Surya with armour and earrings; set adrift and raised by Adhiratha and Radha'),
          (1, 'Challenges Arjuna at the tournament; made king of Anga by Duryodhana'),
          (3, 'Gives his armour and earrings to Indra disguised as a brahmin'),
          (5, 'Learns from Kunti and Krishna that he is the eldest Pandava; stays with Duryodhana'),
          (6, 'Refuses to fight while Bhishma commands'), (7, 'Kills Ghatotkacha with the Shakti'),
          (8, 'Commands the Kauravas; killed by Arjuna while freeing his chariot wheel')]),
  'ashwatthama': dict(
    side='kaurava',
    banner=('A lion’s tail', 'the lion-tail standard-top of Drona\'s son'),
    teachers=['drona'],
    life=[(7, 'Releases the Narayana weapon after his father’s death'), (10, 'Massacres the sleeping Pandava camp'),
          (10, 'Turns the Brahmashira on Uttara’s unborn child; cursed by Krishna')]),
  'kripa': dict(
    side='kaurava',
    banner=('A bull', 'Kripa the son of Gotama, had for his mark an'),
    life=[(1, 'Found as an infant with his twin Kripi and raised by Shantanu'), (1, 'First teacher of the Kuru princes'),
          (10, 'Keeps watch at the gate during the night raid'), (17, 'Survives; becomes Parikshit’s teacher')]),
  'shalya': dict(
    side='kaurava',
    banner=('A golden ploughshare — the goddess of the furrow', 'had on his standard-top an image like the presiding goddess of'),
    life=[(5, 'Tricked onto the Kaurava side by Duryodhana’s hospitality; promises Yudhishthira to weaken Karna'),
          (8, 'Drives Karna’s chariot and mocks him'), (9, 'Commands the Kauravas on the last day; killed by Yudhishthira')]),
  'jayadratha': dict(
    side='kaurava',
    banner=('A silver boar on golden chains', 'A silver boar adorned the standard-top of the'),
    life=[(3, 'Tries to carry off Draupadi; shaved and humiliated by Bhima'), (3, 'Wins Shiva’s boon of one day against the Pandavas'),
          (7, 'Holds the Pandavas back while Abhimanyu dies'), (7, 'Beheaded by Arjuna at sunset on the fourteenth day')]),
  'bhurishravas': dict(
    side='kaurava',
    banner=('A golden sacrificial stake', 'The standard of Somadatta\'s son, devoted to sacrifices, bore the sign of the sacrificial stake'),
    life=[(7, 'His arm cut off by Arjuna as he is about to kill Satyaki; beheaded by Satyaki')]),
  'duryodhana': dict(
    side='kaurava',
    banner=('An elephant worked in gems', 'device of an elephant worked in gems'),
    arms=('The mace, learned from Balarama', 'Balarama'),
    teachers=['drona', 'balarama'],
    life=[(1, 'Poisons Bhima; plots the house of lac'), (2, 'Humiliated at Indraprastha’s hall of illusions; plans the dice game'),
          (5, 'Refuses the Pandavas even five villages'), (9, 'Hides in a lake; his thighs broken by Bhima'),
          (10, 'Dies on hearing of the night raid')]),
  'duhshasana': dict(side='kaurava', teachers=['drona'],
    life=[(2, 'Drags Draupadi into the dice hall and tries to strip her'), (8, 'Killed by Bhima, who drinks his blood')]),
  'vikarna': dict(side='kaurava', life=[(2, 'Alone among the Kauravas, protests the treatment of Draupadi'), (7, 'Killed by Bhima, who grieves for him')]),
  'shakuni': dict(side='kaurava',
    life=[(2, 'Wins the dice game for Duryodhana'), (9, 'Killed by Sahadeva on the last day')]),
  'bhagadatta': dict(side='kaurava', life=[(7, 'Hurls the Vaishnava weapon at Arjuna; Krishna takes it on his chest'), (7, 'Killed by Arjuna on the twelfth day')]),
  'kritavarma': dict(side='kaurava', life=[(10, 'Joins Ashwatthama’s night raid'), (16, 'Beheaded by Satyaki at Prabhasa')]),
  'susharma': dict(side='kaurava', life=[(4, 'Raids Virata’s cattle'), (7, 'Leads the Samshaptakas sworn to kill Arjuna'), (9, 'Killed by Arjuna')]),
  'vrishasena': dict(side='kaurava', banner=('A golden peacock, adorned with jewels', 'Vrishasena has a peacock made of gold'),
    life=[(8, 'Killed by Arjuna on the seventeenth day as Karna watches')]),
  'yuyutsu': dict(side='pandava', life=[(6, 'Crosses over to the Pandavas before the battle'), (17, 'Left to guard the kingdom when the Pandavas depart')]),

  # ───────────────────────── those who did not fight ─────────────────────────
  'balarama': dict(side='neither', arms=('The plough and the pestle', 'Halayudha'),
    life=[(5, 'Refuses to take sides; leaves on pilgrimage'), (9, 'Returns for the mace duel and rages at Bhima’s foul blow'),
          (16, 'Leaves his body in meditation by the sea')]),
  'vidura': dict(side='neither', life=[(1, 'Warns the Pandavas of the house of lac'), (2, 'Speaks against the dice game'),
          (5, 'Shelters Krishna in his house'), (15, 'Dies in the forest; his spirit enters Yudhishthira')]),
  'dhritarashtra': dict(side='kaurava', life=[(1, 'Born blind; passed over for the throne'), (2, 'Allows the dice game'),
          (5, 'Sends Sanjaya to the Pandavas'), (11, 'Crushes an iron statue of Bhima in his grief'),
          (15, 'Dies in a forest fire with Gandhari and Kunti')]),
  'gandhari': dict(side='neither', life=[(1, 'Blindfolds herself for life on marrying Dhritarashtra'),
          (1, 'Gives birth to a mass of flesh that becomes the hundred'), (11, 'Curses Krishna’s clan to destruction'),
          (15, 'Dies in a forest fire')]),
  'kunti': dict(side='neither', life=[(1, 'Given Durvasa’s mantra; bears Karna and sets him adrift'),
          (1, 'Bears Yudhishthira, Bhima and Arjuna by the gods'), (5, 'Reveals herself to Karna; wins his promise to spare four of her sons'),
          (11, 'Tells the Pandavas that Karna was their brother'), (15, 'Dies in a forest fire')]),
  'vyasa': dict(side='neither', life=[(1, 'Fathers Dhritarashtra, Pandu and Vidura by niyoga'), (6, 'Gives Sanjaya divine sight'),
          (11, 'Shows the widows their dead husbands for one night')]),
  'sanjaya': dict(side='neither', life=[(5, 'Carries Dhritarashtra’s message to the Pandavas'), (6, 'Narrates the war, and the Gita, to the blind king')]),
  'parashurama': dict(side='neither', life=[(3, 'Clears the earth of kshatriyas twenty-one times'), (5, 'Fights Bhishma for Amba'),
          (12, 'Curses Karna for hiding his birth')]),
}

RELATIONS = {'charioteer'}
out = {}
problems = []
for cid, d in D.items():
    rec = {}
    for field in ('banner', 'conch', 'bow', 'arms', 'horses'):
        if field not in d:
            continue
        text, phrase = d[field]
        item = {'t': text}
        if len(phrase) > 18:                                   # a real phrase from the text, not just a name
            try:
                bk, sec = anchor(phrase)
                item.update(b=bk, s=sec)
            except SystemExit:
                problems.append(f'{cid}.{field}: {phrase}')
        rec[field] = item
    for field in ('side', 'charioteer', 'teachers'):
        if field in d:
            rec[field] = d[field]
    if 'life' in d:
        rec['life'] = [[p, t] for p, t in d['life']]
    out[cid] = rec

json.dump(out, open('src/data/details.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'characters with details')
for p in problems:
    print('NOT FOUND', p)
