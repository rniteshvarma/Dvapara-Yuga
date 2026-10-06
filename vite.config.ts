import react from '@vitejs/plugin-react'
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/**
 * Readers' corrections: POST /api/report appends one line to reports/queue.jsonl, a review queue
 * read with `npm run reports`. This serves the local site; a hosted one swaps it for a function
 * that writes to a database (see reports/README.md).
 */
function reports(): Plugin {
  return {
    name: 'dvapara-reports',
    configureServer(server) {
      server.middlewares.use('/api/report', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        let body = ''
        req.on('data', (c) => { body += c; if (body.length > 20_000) req.destroy() })
        req.on('end', () => {
          try {
            const r = JSON.parse(body)
            const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '')
            const line = {
              at: new Date().toISOString(), status: 'open',
              id: clean(r.id, 80), name: clean(r.name, 120), kind: clean(r.kind, 40),
              text: clean(r.text, 4000), source: clean(r.source, 600), page: clean(r.page, 600),
            }
            if (!line.text.trim()) throw new Error('empty')
            mkdirSync('reports', { recursive: true })
            appendFileSync('reports/queue.jsonl', JSON.stringify(line) + '\n')
            res.statusCode = 201
            res.end('{"ok":true}')
          } catch {
            res.statusCode = 400
            res.end('{"ok":false}')
          }
        })
      })
    },
  }
}

/** The census (src/data/census.json, built by research/build_census.py) is served as /census.json. */
function census(): Plugin {
  const file = 'src/data/census.json'
  return {
    name: 'dvapara-census',
    configureServer(server) {
      server.middlewares.use('/census.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(readFileSync(file))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'census.json', source: readFileSync(file) })
    },
  }
}

export default defineConfig({
  plugins: [react(), reports(), census()],
})
