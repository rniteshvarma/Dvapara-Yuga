# Readers' corrections

Every profile has **Report an error**. A report is one line in `reports/queue.jsonl`:

```json
{"at":"2026-10-07T09:12:00Z","status":"open","id":"karna","name":"Karna","kind":"relationship","text":"…","source":"Karna Parva 31","page":"/c/karna"}
```

Review the queue:

```bash
npm run reports            # open reports, grouped by character
npm run reports -- all     # every report, including resolved ones
npm run reports -- resolve 3 "Fixed in characters.ts"
npm run reports -- reject 4 "The critical edition agrees with the map"
```

A fix goes into the data (`src/data/characters.ts`, `stories.ts`, `research/*.py`), runs through the verifiers, and the report is resolved with a note.

**Hosting.** Locally the dev server writes this file. On Vercel, replace the `/api/report` middleware in `vite.config.ts` with a serverless function that stores the same JSON in a database (Vercel Postgres, Supabase or a GitHub issue), and point `npm run reports` at it.
