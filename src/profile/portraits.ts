/**
 * Public-domain paintings and prints, one person each, by character id. Each was chosen because the
 * person is named on the print or the painting carries the painter's own title for them, then cropped
 * to that one figure. Characters without one keep their generated medallion.
 *
 * The images live in public/portraits/, cropped to the 3:4 arch they are shown in. Sources are on
 * Wikimedia Commons under the file names given here.
 */
export type Portrait = {
  src: string
  /** the painting, as the credit line names it */
  work: string
  by: string
  date?: string
  /** a note on how faithful it is to the Mahabharata, when it needs one */
  note?: string
  commons: string
}

const p = (id: string, commons: string, by: string, work: string, date?: string, note?: string): [string, Portrait] =>
  [id, { src: `/portraits/${id}.jpg`, commons, by, work, date, note }]

export const PORTRAITS: Record<string, Portrait> = Object.fromEntries([
  p('draupadi', 'Draupadi, Raja Ravi Varma.jpg', 'Raja Ravi Varma', 'The Disrobing of Draupadi (detail)', 'c. 1888–90'),
  p('arjuna', 'Arjun A very beautiful Hindu religious lithographic print.jpg', 'Hemchand Bhargava, Delhi; printed by Bolton F.A.L. Works, Bombay', 'Arjuna, lithograph', 'c. 1920'),
  p('bhima', "Indians 1920's print of General Bhima Sena.jpg", 'Hemchand Bhargava, Delhi', 'General Bhimsena of Mahabharata, lithograph', 'c. 1920s'),
  p('duryodhana', 'Duryodhana, Raja Ravi Varma (cropped).jpg', 'Raja Ravi Varma', 'The Disrobing of Draupadi (detail)', 'c. 1888–90'),
  p('bhishma', 'Bheeshma oath by RRV (cropped).jpg', 'Raja Ravi Varma', 'Bhishma’s Vow (detail)', 'before 1906'),
  p('krishna', 'Sri Krishna as Envoy (cropped).jpg', 'Raja Ravi Varma', 'Sri Krishna as Envoy (detail)', 'before 1906'),
  p('urvashi', 'Urvashi.jpg', 'Raja Ravi Varma', 'Urvashi and Pururavas, oleograph (detail)', '1896'),
  p('shakuntala', 'Raja Ravi Varma, Shakuntala lost in thoughts (1901).jpg', 'Raja Ravi Varma', 'Shakuntala Lost in Thought', '1901',
    'Painted from Kalidasa’s play; the Mahabharata’s telling has no curse or ring.'),
  p('i3065_damayanti', 'Raja Ravi Varma, Damayanthi.jpg', 'Raja Ravi Varma', 'Damayanti (detail)'),
  p('bharata', 'Bharat playing with Lion cubs.jpg', 'Raja Ravi Varma', 'Bharata Playing with Lion Cubs'),
  p('parashurama', 'Raja Ravi Varma, Parashuram.jpg', 'Raja Ravi Varma', 'Parashurama, print', 'before 1920'),
  p('i9843_savitri', 'Savitri.jpg', 'Raja Ravi Varma', 'Savitri (detail)', '19th century'),
  p('garuda', 'Raja Ravi Varma, Lord Garuda.jpg', 'Raja Ravi Varma', 'Garuda, print', undefined, 'Shown carrying Vishnu and Lakshmi.'),
  p('skanda', 'Murugan by Raja Ravi Varma.jpg', 'Raja Ravi Varma', 'Murugan, print', undefined,
    'His consort Valli is a Tamil tradition; the epic gives him Devasena.'),
  p('surya', 'Surya Narayana.jpg', 'Ravi Varma Press', 'Surya Narayana, lithograph'),
])
