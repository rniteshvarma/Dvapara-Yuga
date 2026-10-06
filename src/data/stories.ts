import type { StoryMoment } from './types'

/**
 * Story moments — the interactions between characters, beyond family.
 *
 * Pilot set: Shakuni, Karna, Bhishma, Draupadi, Krishna, Kichaka, Jarasandha,
 * Shishupala, Barbarika and Ekalavya. Every moment says which tradition tells it;
 * `critical` is reserved for episodes that stand in the BORI Critical Edition.
 */
export const STORIES: StoryMoment[] = [
  // ─────────────────────────────── Shakuni ───────────────────────────────
  {
    id: 'gandhara-prison', from: 'subala', to: 'shakuni', kind: 'vow', weight: 3, trad: 'folk',
    title: 'The prison of Gandhara',
    text: 'In regional and television retellings, the Kurus imprison Subala and his hundred sons. Fed a single handful of rice a day, the family gives it all to the youngest, Shakuni, so one of them survives to take revenge. Before he dies, Subala breaks Shakuni’s leg so he will never forget, and Shakuni later carves dice from his father’s bones that obey his will. None of this is in Vyasa’s Mahabharata, where Shakuni’s motives are never explained this way.',
    next: ['dice-game'],
  },
  {
    id: 'shakuni-counsel', from: 'shakuni', to: 'duryodhana', kind: 'ally', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'Win it with dice',
    text: 'Duryodhana came back from the Pandavas’ dazzling palace at Indraprastha sick with envy. Shakuni told him that their wealth could not be taken in battle, but could be won at dice, since Yudhishthira loved the game and he himself had no equal at it.',
    next: ['dice-game'],
  },
  {
    id: 'dice-game', from: 'shakuni', to: 'yudhishthira', kind: 'deceit', weight: 3, trad: 'critical', ref: 'Sabha Parva · Dyuta',
    title: 'The game of dice',
    text: 'Playing on Duryodhana’s behalf, Shakuni won every throw. Yudhishthira staked his treasure, his army and his kingdom, then his brothers one by one, then himself — and finally Draupadi. A second game followed, and its price was thirteen years of exile.',
    next: ['draupadi-dragged', 'sahadeva-vow'],
  },
  {
    id: 'council-of-four', from: 'shakuni', to: 'karna', kind: 'ally', weight: 1, trad: 'critical', ref: 'Adi & Sabha Parvas',
    title: 'The council of four',
    text: 'Duryodhana, Duhshasana, Karna and Shakuni formed the inner circle that plotted against the Pandavas, from the house of lac to the dice hall to the refusal of peace.',
  },
  {
    id: 'sahadeva-vow', from: 'sahadeva', to: 'shakuni', kind: 'slew', weight: 3, trad: 'critical', ref: 'Shalya Parva',
    title: 'Sahadeva keeps his vow',
    text: 'Leaving for exile, Sahadeva swore he would kill Shakuni. On the eighteenth day of the war he hunted him across the field and cut off his head with a broad-headed arrow — the man who began the war with dice died on its last day.',
  },

  // ─────────────────────────────── Karna ───────────────────────────────
  {
    id: 'anga-crown', from: 'duryodhana', to: 'karna', kind: 'ally', weight: 3, trad: 'critical', ref: 'Adi Parva',
    title: 'Crowned king of Anga',
    text: 'At the princes’ tournament Karna matched every feat of Arjuna and challenged him to single combat, but was mocked as a charioteer’s son. Duryodhana crowned him king of Anga on the spot. Karna asked what he could give in return; “your friendship, forever,” said Duryodhana — and Karna kept that promise to his death.',
  },
  {
    id: 'parashurama-curse', from: 'parashurama', to: 'karna', kind: 'curse', weight: 3, trad: 'critical', ref: 'Shanti Parva',
    title: 'The teacher’s curse',
    text: 'Karna studied under Parashurama, who would teach only brahmins. One day an insect bored into Karna’s thigh as his teacher slept in his lap, and he bore the pain without moving. Knowing no brahmin could endure so much, Parashurama saw through him and cursed him to forget the Brahmastra at the moment he needed it most.',
    next: ['karna-death'],
  },
  {
    id: 'surya-warning', from: 'surya', to: 'karna', kind: 'counsel', weight: 2, trad: 'critical', ref: 'Vana Parva',
    title: 'The warning in a dream',
    text: 'Surya came to his son in a dream: Indra would come disguised as a brahmin to beg for his armour and earrings, which made him impossible to kill. Karna replied that he would never refuse a gift that was asked of him.',
    next: ['kavacha'],
  },
  {
    id: 'kavacha', from: 'indra', to: 'karna', kind: 'deceit', weight: 3, trad: 'critical', ref: 'Vana Parva',
    title: 'The armour and the earrings',
    text: 'Indra came as a brahmin and asked for the armour Karna was born with. Karna cut it from his own body and gave it. Shamed, Indra gave him the Vasavi Shakti, a spear that would never miss — but only once.',
    next: ['ghatotkacha-shakti'],
  },
  {
    id: 'kunti-river', from: 'kunti', to: 'karna', kind: 'vow', weight: 3, trad: 'critical', ref: 'Udyoga Parva',
    title: 'The mother at the river',
    text: 'Before the war Kunti found Karna praying by the Ganga and told him she was his mother. He would not leave Duryodhana, but promised to spare four of her sons and fight only Arjuna: “Either way, you will still have five sons.”',
  },
  {
    id: 'krishna-offer', from: 'krishna', to: 'karna', kind: 'counsel', weight: 2, trad: 'critical', ref: 'Udyoga Parva',
    title: 'The offer of a throne',
    text: 'Leaving Hastinapura, Krishna took Karna into his chariot and told him the secret of his birth. As the eldest son of Kunti, he could be king, and the Pandavas would serve him. Karna refused, out of loyalty to Duryodhana and to the charioteer’s family who had raised him.',
  },
  {
    id: 'ardharatha', from: 'bhishma', to: 'karna', kind: 'rival', weight: 2, trad: 'critical', ref: 'Udyoga & Bhishma Parvas',
    title: 'Half a warrior',
    text: 'Counting the Kaurava champions, Bhishma ranked Karna only as half a warrior. Stung, Karna swore not to fight while Bhishma led. When Bhishma lay dying on his arrows, Karna came to him and Bhishma revealed that he had always known whose son Karna was.',
  },
  {
    id: 'karna-insult', from: 'karna', to: 'draupadi', kind: 'rival', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'The insult in the dice hall',
    text: 'When Draupadi was dragged into the hall, Karna called her a woman with many husbands and told Duhshasana to strip the Pandavas and her of their clothes.',
  },
  {
    id: 'not-a-suta', from: 'draupadi', to: 'karna', kind: 'rival', weight: 1, trad: 'vulgate',
    title: '“I will not wed a charioteer’s son”',
    text: 'At Draupadi’s swayamvara, Karna stepped up to string the great bow, and Draupadi refused him for his low birth. The critical edition omits this exchange; it survives in other recensions and in nearly every retelling.',
  },
  {
    id: 'ghatotkacha-shakti', from: 'karna', to: 'ghatotkacha', kind: 'slew', weight: 3, trad: 'critical', ref: 'Drona Parva',
    title: 'The spear meant for Arjuna',
    text: 'On the night of the fourteenth day, Ghatotkacha’s sorcery was destroying the Kaurava army. The desperate Kauravas begged Karna to stop him, and he hurled the Vasavi Shakti he had saved for Arjuna. Ghatotkacha fell — and Krishna rejoiced, because Arjuna was now safe.',
  },
  {
    id: 'shalya-charioteer', from: 'shalya', to: 'karna', kind: 'service', weight: 1, trad: 'critical', ref: 'Karna Parva',
    title: 'The charioteer who mocked him',
    text: 'Made Karna’s charioteer, Shalya praised Arjuna and belittled Karna at every turn, wearing away his spirit — just as Shalya had secretly promised Yudhishthira he would.',
  },
  {
    id: 'karna-death', from: 'arjuna', to: 'karna', kind: 'slew', weight: 3, trad: 'critical', ref: 'Karna Parva',
    title: 'The seventeenth day',
    text: 'Karna’s chariot wheel sank into the earth, and the Brahmastra slipped from his memory, as his curses had foretold. While he struggled with the wheel and called on the rules of war, Krishna reminded him of Draupadi and Abhimanyu, and Arjuna cut off his head.',
  },

  // ─────────────────────────────── Bhishma ───────────────────────────────
  {
    id: 'terrible-vow', from: 'bhishma', to: 'dasharaja', kind: 'vow', weight: 3, trad: 'critical', ref: 'Adi Parva',
    title: 'The terrible vow',
    text: 'Shantanu longed to marry Satyavati, but her father would agree only if her sons inherited the throne. Prince Devavrata gave up his crown, then swore never to marry so he would have no heirs to dispute it. The gods called him Bhishma — the one of the terrible vow.',
    next: ['death-at-will'],
  },
  {
    id: 'death-at-will', from: 'shantanu', to: 'bhishma', kind: 'boon', weight: 2, trad: 'critical', ref: 'Adi Parva',
    title: 'Death at his own wish',
    text: 'Moved by his son’s sacrifice, Shantanu granted Bhishma the boon that death would come to him only when he chose it.',
    next: ['arrow-bed'],
  },
  {
    id: 'kashi-abduction', from: 'bhishma', to: 'amba', kind: 'rival', weight: 3, trad: 'critical', ref: 'Adi & Udyoga Parvas',
    title: 'The abduction at Kashi',
    text: 'Bhishma carried off the three princesses of Kashi from their swayamvara for his brother Vichitravirya. Amba had already chosen King Shalva of Saubha; Bhishma let her go, but Shalva would not take her back, and Bhishma, bound by his vow, could not marry her. With nowhere left to go, she lived for revenge.',
    next: ['guru-battle', 'behind-shikhandi'],
  },
  {
    id: 'guru-battle', from: 'parashurama', to: 'bhishma', kind: 'teacher', weight: 2, trad: 'critical', ref: 'Udyoga Parva',
    title: 'The battle with his teacher',
    text: 'At Amba’s plea, Parashurama ordered his former student to marry her. Bhishma refused, and teacher and student fought at Kurukshetra for twenty-three days until the gods and ancestors stopped them. Neither could win.',
  },
  {
    id: 'question-in-hall', from: 'draupadi', to: 'bhishma', kind: 'counsel', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'The question no one answered',
    text: 'Draupadi asked the assembly whether Yudhishthira, having already lost himself, had any right to stake her. Bhishma replied that the ways of dharma were subtle and he could not decide — and the elders of the court sat silent.',
  },
  {
    id: 'krishna-wheel', from: 'krishna', to: 'bhishma', kind: 'rival', weight: 2, trad: 'critical', ref: 'Bhishma Parva',
    title: 'Krishna breaks his vow',
    text: 'Seeing Arjuna hold back against his grandsire, Krishna leapt from the chariot and rushed at Bhishma himself, ready to break his vow not to take up arms. Bhishma lowered his bow and welcomed death at his hands; Arjuna caught Krishna and promised to fight in earnest.',
  },
  {
    id: 'behind-shikhandi', from: 'shikhandi', to: 'bhishma', kind: 'slew', weight: 3, trad: 'critical', ref: 'Bhishma Parva',
    title: 'Behind Shikhandi',
    text: 'Bhishma had told the Pandavas themselves how he could be beaten: he would not fight one who had been born a woman. On the tenth day Shikhandi rode before Arjuna, and Bhishma would not raise his bow — Amba had her revenge.',
    next: ['arrow-bed'],
  },
  {
    id: 'arrow-bed', from: 'arjuna', to: 'bhishma', kind: 'slew', weight: 3, trad: 'critical', ref: 'Bhishma Parva',
    title: 'The bed of arrows',
    text: 'Arjuna’s arrows pierced Bhishma so thickly that when he fell his body never touched the ground. Arjuna made him a pillow of arrows and drew water from the earth with another, and the grandsire waited fifty-eight nights for the winter solstice.',
    next: ['shanti-counsel'],
  },
  {
    id: 'shanti-counsel', from: 'bhishma', to: 'yudhishthira', kind: 'teacher', weight: 2, trad: 'critical', ref: 'Shanti & Anushasana Parvas',
    title: 'Teachings from the bed of arrows',
    text: 'Grief-stricken after the war, Yudhishthira came to his dying grandsire. Bhishma taught him the duties of kings, the law in times of crisis, and the path to liberation — the longest discourse in the entire epic.',
  },

  // ─────────────────────────────── Draupadi ───────────────────────────────
  {
    id: 'swayamvara', from: 'arjuna', to: 'draupadi', kind: 'love', weight: 3, trad: 'critical', ref: 'Adi Parva',
    title: 'The swayamvara',
    text: 'Kings from across the land failed even to string Drupada’s great bow. Then a young brahmin rose — Arjuna in disguise — strung it, and shot five arrows through the spinning target into the eye of the fish. Draupadi placed the garland around his neck.',
    next: ['share-equally'],
  },
  {
    id: 'share-equally', from: 'kunti', to: 'draupadi', kind: 'counsel', weight: 2, trad: 'critical', ref: 'Adi Parva',
    title: '“Share it equally”',
    text: 'The brothers came home calling out that they had brought alms. Without looking up, Kunti told them to share it equally among themselves. A mother’s word could not be taken back, and Vyasa revealed that Draupadi was fated to have five husbands.',
  },
  {
    id: 'draupadi-dragged', from: 'duhshasana', to: 'draupadi', kind: 'rival', weight: 3, trad: 'critical', ref: 'Sabha Parva',
    title: 'Dragged into the hall',
    text: 'Duhshasana dragged Draupadi into the dice hall by her hair and tried to strip her before the court. However much he pulled, the cloth kept coming. Bhima vowed in front of everyone to tear open Duhshasana’s chest and drink his blood.',
    next: ['krishnaa-krishna'],
  },
  {
    id: 'krishnaa-krishna', from: 'krishna', to: 'draupadi', kind: 'ally', weight: 2, trad: 'vulgate',
    title: 'Sakhi and sakha',
    text: 'In many recensions, Draupadi cries out to Krishna in the dice hall and her endless garment is his grace. Throughout the epic they are close friends — sakha and sakhi — and it is Krishna to whom she brings her grievances.',
  },
  {
    id: 'forest-abduction', from: 'jayadratha', to: 'draupadi', kind: 'rival', weight: 2, trad: 'critical', ref: 'Vana Parva',
    title: 'Seized in the forest',
    text: 'Passing through the Kamyaka forest while the brothers were out hunting, Jayadratha carried Draupadi off in his chariot. The Pandavas caught him; Bhima shaved his head into five tufts, and Yudhishthira spared his life for Duhshala’s sake.',
  },
  {
    id: 'kichaka-desire', from: 'kichaka', to: 'draupadi', kind: 'rival', weight: 3, trad: 'critical', ref: 'Virata Parva',
    title: 'Sairandhri and the commander',
    text: 'In disguise as the queen’s maid Sairandhri, Draupadi caught the eye of Kichaka. When she refused him he kicked her in front of the court, and King Virata dared not stop him.',
    next: ['sent-for-wine'],
  },
  {
    id: 'sauptika-jewel', from: 'draupadi', to: 'ashwatthama', kind: 'rival', weight: 2, trad: 'critical', ref: 'Sauptika Parva',
    title: 'The jewel for the sons',
    text: 'Ashwatthama killed her five sleeping sons. Draupadi vowed to fast to death unless he was punished. The Pandavas hunted him down and brought her the jewel from his forehead, and she gave it to Yudhishthira to wear.',
  },

  // ─────────────────────────────── Krishna ───────────────────────────────
  {
    id: 'gita', from: 'krishna', to: 'arjuna', kind: 'counsel', weight: 3, trad: 'critical', ref: 'Bhishma Parva · Bhagavad Gita',
    title: 'The Bhagavad Gita',
    text: 'Between the two armies, Arjuna saw his grandsire, his teachers and his kinsmen, and laid down his bow. Krishna answered his despair with the teaching on duty, action without attachment, and devotion — and showed him his universal form.',
  },
  {
    id: 'mathura-arena', from: 'krishna', to: 'kamsa', kind: 'slew', weight: 3, trad: 'purana', ref: 'Harivamsha',
    title: 'The arena of Mathura',
    text: 'Kamsa invited the young cowherd brothers to a wrestling festival intending to have them killed. Krishna and Balarama killed his champion wrestlers, and Krishna dragged Kamsa from his throne and killed him, freeing Ugrasena, Vasudeva and Devaki.',
    next: ['mathura-sieges'],
  },
  {
    id: 'mathura-sieges', from: 'jarasandha', to: 'krishna', kind: 'rival', weight: 3, trad: 'purana', ref: 'Harivamsha · Sabha Parva',
    title: 'The sieges of Mathura',
    text: 'To avenge his son-in-law Kamsa, Jarasandha attacked Mathura again and again. Rather than see the city destroyed, Krishna led the Yadavas west to the sea and founded Dvaraka. The epic itself recalls the retreat; the Harivamsha tells the sieges in full.',
    next: ['girivraja'],
  },
  {
    id: 'rukmini-letter', from: 'rukmini', to: 'krishna', kind: 'love', weight: 2, trad: 'purana', ref: 'Harivamsha · Bhagavata',
    title: 'The letter from Vidarbha',
    text: 'Promised by her brother Rukmi to Shishupala, Rukmini sent a secret letter asking Krishna to carry her away. He took her from the temple on the eve of the wedding and defeated the pursuing kings.',
  },
  {
    id: 'peace-mission', from: 'krishna', to: 'duryodhana', kind: 'counsel', weight: 3, trad: 'critical', ref: 'Udyoga Parva',
    title: 'The embassy of peace',
    text: 'Krishna went to Hastinapura and asked, for the Pandavas, for half the kingdom — then for just five villages. Duryodhana would not give them land the size of a needle’s point and plotted to seize Krishna, who revealed his cosmic form to the court.',
    next: ['gita'],
  },
  {
    id: 'gandhari-curse', from: 'gandhari', to: 'krishna', kind: 'curse', weight: 3, trad: 'critical', ref: 'Stri Parva',
    title: 'A mother’s curse',
    text: 'Walking among her hundred dead sons on the battlefield, Gandhari blamed Krishna for not stopping the war. She cursed him: in thirty-six years his own clan would destroy itself and he would die alone. Krishna accepted the curse.',
    next: ['prabhasa-arrow'],
  },
  {
    id: 'ashwatthama-curse', from: 'krishna', to: 'ashwatthama', kind: 'curse', weight: 2, trad: 'critical', ref: 'Sauptika Parva',
    title: 'Three thousand years',
    text: 'Ashwatthama turned the Brahmashira weapon on the unborn child in Uttara’s womb. Krishna cursed him to wander the earth for three thousand years, unseen and friendless, his body oozing pus and blood.',
  },
  {
    id: 'womb-revival', from: 'krishna', to: 'parikshit', kind: 'boon', weight: 2, trad: 'critical', ref: 'Ashvamedhika Parva',
    title: 'Life restored in the womb',
    text: 'Parikshit was born dead, killed by Ashwatthama’s weapon. Krishna touched the child and swore by his own truthfulness, and the last heir of the Kurus breathed.',
  },
  {
    id: 'prabhasa-arrow', from: 'jara_hunter', to: 'krishna', kind: 'slew', weight: 3, trad: 'critical', ref: 'Mausala Parva',
    title: 'The hunter at Prabhasa',
    text: 'After the Yadavas killed one another in a drunken brawl, Krishna lay in yogic stillness in the forest. The hunter Jara mistook his foot for a deer and shot it. Krishna comforted the stricken hunter, and left the world.',
  },

  // ─────────────────────────────── Kichaka ───────────────────────────────
  {
    id: 'matsya-commander', from: 'kichaka', to: 'virata', kind: 'service', weight: 2, trad: 'critical', ref: 'Virata Parva',
    title: 'The power behind the throne',
    text: 'Kichaka, the queen’s brother, commanded Virata’s army. With his hundred and five brothers he had defeated Matsya’s enemies, and the old king relied on him — and feared him.',
  },
  {
    id: 'sent-for-wine', from: 'sudeshna', to: 'draupadi', kind: 'deceit', weight: 2, trad: 'critical', ref: 'Virata Parva',
    title: 'Sent for wine',
    text: 'To please her brother, Queen Sudeshna sent her maid Sairandhri to Kichaka’s rooms to fetch wine, knowing what he intended.',
    next: ['dance-hall'],
  },
  {
    id: 'dance-hall', from: 'bhima', to: 'kichaka', kind: 'slew', weight: 3, trad: 'critical', ref: 'Virata Parva',
    title: 'The dance hall at night',
    text: 'Draupadi pretended to agree to meet Kichaka in the dark dance hall. Bhima waited there instead, and crushed him so completely that his body became an unrecognisable ball of flesh.',
    next: ['upakichaka-pyre', 'cattle-raid'],
  },
  {
    id: 'upakichaka-pyre', from: 'bhima', to: 'upakichakas', kind: 'slew', weight: 2, trad: 'critical', ref: 'Virata Parva',
    title: 'The pyre',
    text: 'Kichaka’s brothers blamed Sairandhri and carried her off to burn on his pyre. Bhima tore up a tree and killed all hundred and five of them.',
  },
  {
    id: 'cattle-raid', from: 'susharma', to: 'virata', kind: 'rival', weight: 2, trad: 'critical', ref: 'Virata Parva',
    title: 'The cattle raid',
    text: 'News of Kichaka’s death reached Susharma of Trigarta, who had long suffered at his hands. With the Kauravas he raided Matsya’s cattle and captured Virata — until Bhima rescued him. Meanwhile the Kauravas struck from the north, and Arjuna, still disguised as Brihannala, drove them off.',
  },

  // ─────────────────────────────── Jarasandha ───────────────────────────────
  {
    id: 'jara-joined', from: 'jara', to: 'jarasandha', kind: 'boon', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'Joined by Jara',
    text: 'Brihadratha’s two queens each bore half a child, and the halves were thrown out. The rakshasi Jara picked them up, and as she brought them together the infant became whole and cried out. He was named Jarasandha, “joined by Jara”.',
  },
  {
    id: 'kamsa-alliance', from: 'jarasandha', to: 'kamsa', kind: 'ally', weight: 1, trad: 'purana', ref: 'Harivamsha',
    title: 'Father-in-law of Kamsa',
    text: 'Jarasandha gave his daughters Asti and Prapti to Kamsa, binding Mathura to Magadha. When Krishna killed Kamsa, the widowed daughters went home to their father and demanded vengeance.',
  },
  {
    id: 'hamsa-dimbhaka', from: 'hamsa', to: 'jarasandha', kind: 'service', weight: 1, trad: 'critical', ref: 'Sabha Parva',
    title: 'The two generals',
    text: 'Hamsa and Dimbhaka were Jarasandha’s invincible generals. When Balarama killed a different king named Hamsa, the rumour that “Hamsa is dead” reached Dimbhaka, who drowned himself in the Yamuna; grieving for him, Hamsa did the same. Jarasandha went home without them.',
  },
  {
    id: 'girivraja', from: 'jarasandha', to: 'captive_kings', kind: 'rival', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'The kings in the fortress',
    text: 'Jarasandha kept eighty-six defeated kings imprisoned in Girivraja, to be sacrificed to Rudra once he had a hundred. Before Yudhishthira could hold his imperial sacrifice, Krishna said, Jarasandha had to fall.',
    next: ['magadha-wrestle'],
  },
  {
    id: 'magadha-wrestle', from: 'bhima', to: 'jarasandha', kind: 'slew', weight: 3, trad: 'critical', ref: 'Sabha Parva',
    title: 'The fourteen-day wrestle',
    text: 'Krishna, Bhima and Arjuna entered Girivraja disguised as snataka brahmins and challenged Jarasandha to single combat. He chose Bhima. They wrestled without rest for thirteen days; on the fourteenth Bhima raised him overhead, broke his back, and tore his body into the two halves he was born from.',
    next: ['magadha-crown'],
  },
  {
    id: 'magadha-crown', from: 'krishna', to: 'sahadeva_m', kind: 'boon', weight: 1, trad: 'critical', ref: 'Sabha Parva',
    title: 'A new king in Magadha',
    text: 'Krishna freed the captive kings and set Jarasandha’s son Sahadeva on the throne of Magadha, who became a loyal ally of the Pandavas.',
  },
  {
    id: 'jarasandha-general', from: 'shishupala', to: 'jarasandha', kind: 'service', weight: 1, trad: 'critical', ref: 'Sabha Parva',
    title: 'Jarasandha’s commander',
    text: 'Krishna told Yudhishthira that the mighty Shishupala had placed himself under Jarasandha and served as the commander of his armies.',
  },

  // ─────────────────────────────── Shishupala ───────────────────────────────
  {
    id: 'hundred-offences', from: 'krishna', to: 'shishupala', kind: 'vow', weight: 3, trad: 'critical', ref: 'Sabha Parva',
    title: 'A hundred offences',
    text: 'Shishupala was born with three eyes and four arms, and a voice foretold that the extra limbs would fall away when he sat in the lap of the one who would kill him. They fell away in Krishna’s lap. His mother begged for mercy, and Krishna promised to forgive her son a hundred offences.',
    next: ['first-honour'],
  },
  {
    id: 'stolen-bride', from: 'krishna', to: 'shishupala', kind: 'rival', weight: 2, trad: 'purana', ref: 'Harivamsha · Bhagavata',
    title: 'The stolen bride',
    text: 'Rukmini was to marry Shishupala until Krishna carried her off on the eve of the wedding. Shishupala never forgave him.',
  },
  {
    id: 'first-honour', from: 'shishupala', to: 'bhishma', kind: 'rival', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'The first honour',
    text: 'At Yudhishthira’s Rajasuya, Bhishma advised that the guest of first honour should be Krishna. Shishupala rose in fury, mocking Krishna as a cowherd and Bhishma as a hypocrite, and then turned his abuse on Yudhishthira.',
    next: ['sudarshana'],
  },
  {
    id: 'sudarshana', from: 'krishna', to: 'shishupala', kind: 'slew', weight: 3, trad: 'critical', ref: 'Sabha Parva',
    title: 'The hundred-and-first',
    text: 'Krishna counted the insults aloud. At the hundred-and-first his promise was fulfilled, and he released the Sudarshana discus and cut off Shishupala’s head. A light rose from the body and entered Krishna.',
  },
  {
    id: 'dantavakra-death', from: 'krishna', to: 'dantavakra', kind: 'slew', weight: 1, trad: 'purana', ref: 'Bhagavata Purana',
    title: 'The cousin’s revenge',
    text: 'Dantavakra came to avenge Shishupala and fought Krishna with a mace. Krishna killed him.',
  },

  // ─────────────────────────────── Barbarika ───────────────────────────────
  {
    id: 'three-arrows', from: 'krishna', to: 'barbarika', kind: 'deceit', weight: 3, trad: 'folk', ref: 'Skanda Purana',
    title: 'The head given in charity',
    text: 'Barbarika came to Kurukshetra with three arrows that could end the war on their own, and a vow to always fight for the losing side. Krishna, disguised as a brahmin, saw that such a warrior would destroy both armies, and asked for his head in charity. Barbarika gave it, asking only to watch the war.',
    next: ['hilltop-witness'],
  },
  {
    id: 'hilltop-witness', from: 'barbarika', to: 'bhima', kind: 'counsel', weight: 2, trad: 'folk', ref: 'Skanda Purana · Rajasthani tradition',
    title: 'The witness on the hill',
    text: 'After the war the Pandavas argued over who deserved credit for the victory and asked Barbarika’s head, which had seen everything. He said he saw only Krishna’s discus cutting down the armies. He is worshipped today as Khatu Shyam.',
  },

  // ─────────────────────────────── Ekalavya ───────────────────────────────
  {
    id: 'thumb', from: 'drona', to: 'ekalavya', kind: 'teacher', weight: 3, trad: 'critical', ref: 'Adi Parva',
    title: 'The teacher’s fee',
    text: 'Turned away by Drona for being a Nishada, Ekalavya made a clay image of him and taught himself archery before it. When Drona found how good he had become, he asked for his right thumb as his teacher’s fee. Ekalavya cut it off without hesitating — and was never as quick with the bow again.',
  },
  {
    id: 'dog-mouth', from: 'ekalavya', to: 'arjuna', kind: 'rival', weight: 2, trad: 'critical', ref: 'Adi Parva',
    title: 'Seven arrows in a dog’s mouth',
    text: 'The princes’ dog barked at a dark archer in the forest, and he silenced it with seven arrows in its mouth, without wounding it. Arjuna, who had been promised he would be the greatest archer, went to Drona in distress.',
    next: ['thumb'],
  },
  {
    id: 'ekalavya-magadha', from: 'ekalavya', to: 'jarasandha', kind: 'service', weight: 1, trad: 'purana', ref: 'Harivamsha',
    title: 'At Jarasandha’s side',
    text: 'In the Harivamsha, Ekalavya fights alongside Jarasandha in his wars against the Yadavas.',
  },
  {
    id: 'ekalavya-slain', from: 'krishna', to: 'ekalavya', kind: 'slew', weight: 2, trad: 'critical', ref: 'Drona Parva',
    title: 'For Arjuna’s sake',
    text: 'After Ghatotkacha’s death, Krishna told Arjuna that for his sake he had killed Jarasandha, Shishupala and the Nishada Ekalavya — who, with his thumb, could not have been beaten even by the gods.',
  },
  // ── the deaths of the war, as the battle books tell them ──
  {
    id: 'abhimanyu-death', from: 'dauhshasani', to: 'abhimanyu', kind: 'slew', weight: 3, trad: 'critical', ref: 'Drona Parva',
    title: 'The last blow in the Chakravyuha',
    text: 'On the thirteenth day, with his bow cut, his chariot broken and his sword shattered, Abhimanyu fought on with a chariot wheel and then a mace. He and Duhshasana’s son struck each other down together; Dauhshasani rose first and crushed the boy’s head as he was getting up.',
  },
  {
    id: 'shveta-death', from: 'bhishma', to: 'shveta', kind: 'slew', weight: 2, trad: 'critical', ref: 'Bhishma Parva',
    title: 'The first day',
    text: 'On the first day of the war Virata’s son Shveta broke Bhishma’s standard and drove deep into the Kaurava ranks. At sunset Bhishma took up a Brahma-weapon of an arrow and killed him — the first great loss of the Pandava side.',
  },
  {
    id: 'jayadratha-death', from: 'arjuna', to: 'jayadratha', kind: 'slew', weight: 3, trad: 'critical', ref: 'Drona Parva',
    title: 'Before the sun went down',
    text: 'Arjuna swore to kill Jayadratha before sunset on the fourteenth day or enter the fire himself. As the light failed, Krishna veiled the sun; Jayadratha came out of hiding, and Arjuna struck off his head, sending it into the lap of his father Vriddhakshatra, whose boon then shattered his own head.',
  },
  {
    id: 'bhurishravas-death', from: 'satyaki', to: 'bhurishravas', kind: 'slew', weight: 2, trad: 'critical', ref: 'Drona Parva',
    title: 'The severed arm',
    text: 'Bhurishravas had Satyaki down and his sword raised when Arjuna, unasked, cut off his arm. Bhurishravas reproached him, spread his arrows and sat down to fast unto death; Satyaki rose and beheaded him as he sat, to the dismay of both armies.',
  },
  {
    id: 'drupada-virata-death', from: 'drona', to: 'drupada', kind: 'slew', weight: 2, trad: 'critical', ref: 'Drona Parva',
    title: 'The old friend',
    text: 'At dawn on the fifteenth day Drona killed Drupada — his boyhood friend, whose insult had begun their feud — with broad-headed arrows, and Virata with him.',
  },
  {
    id: 'virata-death', from: 'drona', to: 'virata', kind: 'slew', weight: 2, trad: 'critical', ref: 'Drona Parva',
    title: 'The king of the Matsyas',
    text: 'Virata, who had sheltered the Pandavas through their year in disguise, fell to Drona on the fifteenth day, in the same onslaught that killed Drupada.',
  },
  {
    id: 'drona-death', from: 'dhrishtadyumna', to: 'drona', kind: 'slew', weight: 3, trad: 'critical', ref: 'Drona Parva',
    title: '“Ashwatthama is dead”',
    text: 'Bhima killed an elephant named Ashvatthama, and Yudhishthira — who never lied — told Drona that Ashwatthama was dead, muttering “the elephant” under his breath. Drona laid down his weapons and sat in meditation on his chariot, and Dhrishtadyumna, born to kill him, cut off his head.',
  },
  {
    id: 'duhshasana-death', from: 'bhima', to: 'duhshasana', kind: 'slew', weight: 3, trad: 'critical', ref: 'Karna Parva',
    title: 'The vow of the dice hall',
    text: 'Thirteen years after Duhshasana dragged Draupadi into the hall by her hair, Bhima caught him on the seventeenth day, tore open his chest and drank his blood, as he had sworn he would.',
  },
  {
    id: 'shalya-death', from: 'yudhishthira', to: 'shalya', kind: 'slew', weight: 3, trad: 'critical', ref: 'Shalya Parva',
    title: 'The gentle king’s spear',
    text: 'On the last day Shalya led the Kauravas. Yudhishthira, the mildest of the brothers, fought him and killed him with a spear that blazed like the fire at the end of the world.',
  },
  {
    id: 'duryodhana-thighs', from: 'bhima', to: 'duryodhana', kind: 'slew', weight: 3, trad: 'critical', ref: 'Shalya Parva',
    title: 'The blow below the waist',
    text: 'Duryodhana hid in a lake; called out, he fought Bhima with the mace. When Bhima could not prevail, Arjuna slapped his own thigh at Krishna’s word, and Bhima broke Duryodhana’s thighs — keeping his vow from the dice hall and breaking the rules of the mace. Balarama raged; Duryodhana lay dying until night.',
  },
  {
    id: 'dhrishtadyumna-death', from: 'ashwatthama', to: 'dhrishtadyumna', kind: 'slew', weight: 3, trad: 'critical', ref: 'Sauptika Parva',
    title: 'The night raid',
    text: 'In the camp at night Ashwatthama found Dhrishtadyumna asleep and, refusing him death by a weapon, kicked and strangled him like a beast for the killing of Drona.',
  },
  {
    id: 'shikhandi-death', from: 'ashwatthama', to: 'shikhandi', kind: 'slew', weight: 2, trad: 'critical', ref: 'Sauptika Parva',
    title: 'Cut down in the dark',
    text: 'In the same night raid Ashwatthama cut Shikhandi in two with his sword; the sons of Draupadi and the last of the Panchalas died around him.',
  },

  // ── Shiva, the giver of boons ──
  {
    id: 'gandhari-boon', from: 'shiva', to: 'gandhari', kind: 'boon', weight: 3, trad: 'critical', ref: 'Adi Parva',
    title: 'A hundred sons',
    text: 'Before her marriage Gandhari worshipped Shiva and won the boon of a hundred sons — the reason Bhishma sought her for the blind Dhritarashtra. Vyasa later blessed her with the same boon, and the hundred were born from a single mass of flesh.',
  },
  {
    id: 'amba-boon', from: 'shiva', to: 'amba', kind: 'boon', weight: 3, trad: 'critical', ref: 'Udyoga Parva',
    title: 'The vow on the pyre',
    text: 'Rejected by Shalva and by Bhishma, Amba did fierce penance until Shiva appeared and promised that in her next life she would become a man and kill Bhishma — and remember this life. She built a pyre on the bank of the Yamuna and entered it.',
  },
  {
    id: 'drupada-boon', from: 'shiva', to: 'drupada', kind: 'boon', weight: 2, trad: 'critical', ref: 'Udyoga Parva',
    title: 'A daughter who will be a son',
    text: 'Drupada prayed to Shiva for a son to avenge him on Bhishma. Shiva answered that a daughter would be born to him who would later become a man. So Shikhandini was born, raised as a son, and became Shikhandi.',
  },
  {
    id: 'draupadi-boon', from: 'shiva', to: 'draupadi', kind: 'boon', weight: 3, trad: 'critical', ref: 'Adi Parva',
    title: 'Five times she asked',
    text: 'In a former life Draupadi was a sage’s daughter who prayed to Shiva for a husband with every virtue, and asked five times over. Shiva told her she would have five husbands in her next birth — Vyasa told this to Drupada to settle the marriage to all five Pandavas.',
  },
  {
    id: 'kirata', from: 'shiva', to: 'arjuna', kind: 'boon', weight: 3, trad: 'critical', ref: 'Vana Parva',
    title: 'The mountain hunter',
    text: 'In the Himalayas a boar-demon charged Arjuna, and he and a hunter shot it at the same moment. They quarrelled and fought; Arjuna’s arrows vanished, his bow was snatched away, and even his fists failed. When he worshipped, the hunter revealed himself as Shiva, with Uma beside him, and gave him the Pashupata weapon.',
  },
  {
    id: 'jayadratha-boon', from: 'shiva', to: 'jayadratha', kind: 'boon', weight: 3, trad: 'critical', ref: 'Vana Parva',
    title: 'One day against the Pandavas',
    text: 'Shamed by Bhima after he tried to abduct Draupadi, Jayadratha did penance to Shiva and asked to defeat all five Pandavas. Shiva granted only that, for one day, he could hold back four of them — all but Arjuna. That day was the thirteenth of the war, when Abhimanyu died inside the Chakravyuha.',
  },
  {
    id: 'ashwatthama-shiva', from: 'shiva', to: 'ashwatthama', kind: 'boon', weight: 3, trad: 'critical', ref: 'Sauptika Parva',
    title: 'The god enters him',
    text: 'At the gate of the sleeping Pandava camp a terrible being blocked Ashwatthama. He offered himself into a fire to Shiva; Shiva gave him a bright sword and entered his body — and the massacre of the night raid followed.',
  },
  {
    id: 'samba-boon', from: 'shiva', to: 'krishna', kind: 'boon', weight: 2, trad: 'critical', ref: 'Anushasana Parva',
    title: 'A son for Jambavati',
    text: 'Seeing Rukmini’s sons, Jambavati asked Krishna for a son like him. Krishna went to the sage Upamanyu, was taught the worship of Shiva, and won the boon — Samba was born.',
  },
  {
    id: 'jarasandha-captives', from: 'jarasandha', to: 'shiva', kind: 'vow', weight: 2, trad: 'critical', ref: 'Sabha Parva',
    title: 'A hundred kings for Rudra',
    text: 'Jarasandha held eighty-six conquered kings in the temple of Shiva, meaning to sacrifice a hundred of them like animals. Krishna, Bhima and Arjuna went to Girivraja in disguise to free them.',
  },
  {
    id: 'daksha-sacrifice', from: 'shiva', to: 'daksha', kind: 'rival', weight: 2, trad: 'critical', ref: 'Shanti Parva',
    title: 'The ruined sacrifice',
    text: 'Daksha held a great sacrifice and left Shiva without a share. Grieved by Uma’s distress, Shiva created the fierce Virabhadra and destroyed it, until Daksha praised him with a thousand names and was forgiven.',
  },

]
