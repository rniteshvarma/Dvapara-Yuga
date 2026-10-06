/* Dumps the hand-curated dataset as JSON for the census pipeline. */
import { CHARACTERS, RELATIONS } from '../src/data/characters'
import { STORIES } from '../src/data/stories'
console.log(JSON.stringify({ characters: CHARACTERS, relations: RELATIONS, stories: STORIES }))
