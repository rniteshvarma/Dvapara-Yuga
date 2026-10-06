import type { Tradition } from './types'

/**
 * Where the tellings disagree. Each topic sets the epic's own account beside the Harivamsha and the Puranas,
 * and beside the regional, folk and television retellings that many readers know best — so a reader can see
 * which part of a familiar story the Mahabharata itself tells.
 *
 * `critical` is the BORI Critical Edition; `vulgate` the longer recensions Ganguli translated.
 */
export interface Reading { trad: Tradition; text: string; src?: string }
export interface VersionTopic { topic: string; readings: Reading[] }

export const VERSIONS: Record<string, VersionTopic[]> = {
  krishna: [{
    topic: 'His wives',
    readings: [
      { trad: 'critical', src: 'Sabha, Udyoga, Anushasana and Mausala Parvas',
        text: 'Names Rukmini, Satyabhama and Jambavati again and again. At his death the Mausala Parva says Rukmini, “Gandhari”, Shaibya, Haimavati and Jambavati entered the pyre and Satyabhama went to the forest; it never lists eight queens.' },
      { trad: 'purana', src: 'Bhagavata Purana 10.58; Vishnu Purana; Harivamsha',
        text: 'Eight principal queens — Rukmini, Satyabhama, Jambavati, Kalindi, Mitravinda, Nagnajiti, Bhadra and Lakshmana — and sixteen thousand women he freed from Naraka. The Harivamsha and Vishnu Purana name a Madri or Rohini in place of Bhadra.' },
      { trad: 'folk', src: 'Gita Govinda (12th century) and devotional tradition',
        text: 'Radha, the beloved of his youth in Vrindavan, is central to devotion — but she is not named in the Mahabharata or the Bhagavata Purana, and was never his wife.' },
    ],
  }],
  karna: [{
    topic: 'His wife',
    readings: [
      { trad: 'critical', src: 'Karna and Stri Parvas',
        text: 'Never names a wife. It names his sons — Vrishasena, Vrishaketu, Sushena and others — and in the Stri Parva the mother of Vrishasena mourns him.' },
      { trad: 'modern', src: 'Shivaji Sawant, Mrityunjaya (1967); television serials',
        text: 'Vrushali, a charioteer’s daughter, and Supriya are his wives — characters from the Marathi novel Mrityunjaya, made familiar by later television.' },
    ],
  }, {
    topic: '“My birth is in fate’s hands; my courage is in mine”',
    readings: [
      { trad: 'critical', text: 'Not in the Mahabharata.' },
      { trad: 'modern', src: 'Bhatta Narayana, Venisamhara (c. 8th century)',
        text: 'The line comes from a Sanskrit play written centuries after the epic, and is now often quoted as Karna’s.' },
    ],
  }],
  draupadi: [{
    topic: 'Who saved her in the dice hall',
    readings: [
      { trad: 'critical', src: 'Sabha Parva 61',
        text: 'As Duhshasana pulls at her garment, more cloth appears, again and again — the critical edition gives no prayer and names no rescuer.' },
      { trad: 'vulgate', src: 'Sabha Parva, in Ganguli’s translation',
        text: 'She cries out to Krishna — “O Govinda, O thou who dwellest in Dwaraka” — and while she calls on him, Dharma, unseen, covers her with garments of many hues.' },
      { trad: 'modern', src: 'Television (B. R. Chopra, 1988, and later)',
        text: 'Krishna appears and himself sends the endless sari — the image most readers now know.' },
    ],
  }, {
    topic: '“The son of a blind man is blind”',
    readings: [
      { trad: 'critical', src: 'Sabha Parva',
        text: 'Duryodhana is mocked in the hall of illusions at Indraprastha — by Bhima, Arjuna and the twins, and the servants — but Draupadi’s famous taunt is not in the text.' },
      { trad: 'modern', text: 'The line given to Draupadi comes from later retellings and television, where it becomes a cause of the war.' },
    ],
  }],
  abhimanyu: [{
    topic: 'How he learned the Chakravyuha',
    readings: [
      { trad: 'critical', src: 'Drona Parva',
        text: 'He tells Yudhishthira that Arjuna taught him how to break into the formation, but not how to come out.' },
      { trad: 'folk', text: 'He overheard Arjuna explaining it to Subhadra while still in her womb, and she fell asleep before the way out was told.' },
    ],
  }],
  shakuni: [{
    topic: 'Why he worked for the Kauravas’ ruin',
    readings: [
      { trad: 'critical', text: 'He is simply Duryodhana’s uncle, ally and counsellor — no hidden revenge is told.' },
      { trad: 'folk', src: 'Regional retellings; television',
        text: 'Bhishma imprisoned and starved his family for marrying Gandhari to a blind man, and Shakuni’s dice were carved from his dead father’s bones — he meant to destroy the Kurus from within.' },
    ],
  }],
  ganesha: [{
    topic: 'The scribe of the epic',
    readings: [
      { trad: 'critical', text: 'Not present: the critical edition has no scribe episode.' },
      { trad: 'vulgate', src: 'Adi Parva 1 (Ganguli)',
        text: 'Brahma tells Vyasa to have Ganesha write the poem; Ganesha agrees on condition that his pen never stop, and Vyasa asks that he understand every verse before writing it.' },
    ],
  }],
  barbarika: [{
    topic: 'His story',
    readings: [
      { trad: 'critical', text: 'Not in the Mahabharata.' },
      { trad: 'purana', src: 'Skanda Purana', text: 'Ghatotkacha’s son, who could end the war with three arrows, gives Krishna his head and watches the war from a hill.' },
      { trad: 'folk', src: 'Rajasthan', text: 'Worshipped as Khatu Shyam at Khatu, where his head is said to rest.' },
    ],
  }],
  bhishma: [{
    topic: 'Which Vasu he was',
    readings: [
      { trad: 'critical', src: 'Adi Parva 93', text: 'The Vasu Dyu (Dyaus), who stole Vasishtha’s cow for his wife.' },
      { trad: 'purana', text: 'Later retellings name him Prabhasa.' },
    ],
  }],
  vidura: [{
    topic: 'His mother’s name',
    readings: [
      { trad: 'critical', text: 'Only a Shudra maid of Ambika’s, sent to Vyasa in her place.' },
      { trad: 'modern', text: 'Later retellings call her Parishrami.' },
    ],
  }],
}
