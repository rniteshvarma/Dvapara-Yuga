# The Volumes — how a chapter is made

The plan is in `../PLAN-volumes.md`. This folder holds the text.

```
content/
  volumes.json                      all 13 volumes: titles in each language, blurbs, which Parvas
  v01-the-vow/
    c01-the-king-who-looked-too-long/
      chapter.json                  number, titles, Ganguli sources, translation status, painting
      en.md                         the English text: the source every language follows
      te.md                         Telugu, with the same block ids
      hi.md                         Hindi, with the same block ids
```

## Writing a chapter (English)

1. Read the sections in Ganguli: `python3 research/section.py 1 96-100`.
2. Retell them in our own words. Quote Ganguli exactly where his words matter, and never put words in anyone's mouth that the text does not give them.
3. Mark every block:

```md
::scene{#s2 frame=ganga,prabhasa light=prabhasa}       the map frames these people, and lights these

A paragraph with a [name](character-id) and *emphasis*. {#p6 1.96}      id, then book.section

> Ganguli's exact words. {#q1 1.96}
> — Brahma

::aside{#a1 kind=versions src=1.96,1.99}               "versions differ", or kind=note
Text of the note.
::

***                                                     a pause
```

4. Run `npm run chapters`. It fails if a name is not on the map, a paragraph has no source, a source falls outside the chapter's sections, or a quote is not found word for word in the section it cites.

Label anything that is not in Vyasa's text: a later telling goes in an aside; a folk story is never told as the epic.

## Translating

Copy `en.md` to `te.md` or `hi.md` and translate the words only. Keep every `{#id}`, every `[name](id)`, and every scene and aside line exactly as they are. The English file decides the order, the scenes and the sources; a block the translation has not reached yet is shown in English.

Set `"translations": { "te": "draft" }` in `chapter.json` until a native speaker has reviewed it, then `"reviewed"`. Drafts show a notice to readers.

## Paintings

Put the image at `public/volumes/v01/c01.jpg` (3:2, at least 1400 px wide), then add to `chapter.json`:

```json
"painting": { "src": "/volumes/v01/c01.jpg", "alt": "What it shows", "credit": "Illustration, AI-assisted · the scene (Adi Parva 97)" }
```

Every painting is checked against the text before it goes in: who is there, what they wear and carry, and where they are.
