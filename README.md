# Dvapara Yuga

The living lineage of the Mahabharata — every bloodline from the Creator to the last king, as an interactive constellation.

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # structural checks on the lineage dataset
npm run build
```

## Where things live

| Path | What |
| --- | --- |
| `src/data/characters.ts` | The dataset: 333 characters and every relationship between them |
| `src/data/dynasties.ts` | House colours, layout anchors, thread vocabulary |
| `src/graph/model.ts` | Graph indexes and lineage walks (ancestors / descendants / kin) |
| `src/graph/layout.ts` | Time-banded layout with household blocks and the Kaurava constellation |
| `src/render/engine.ts` | WebGL2 renderer, camera, hover/select, labels, intro |
| `src/render/shaders.ts` | Milky sky, dust, flowing dotted threads, medallion frames |
| `src/ui/*` | Story card, search palette, legend, chrome, intro title |

Interaction: scroll / pinch to zoom, drag to pan, hover to awaken a bloodline, click to open a story,
`⌘K` or `/` to search, `Esc` to close, `0` to see everything.
