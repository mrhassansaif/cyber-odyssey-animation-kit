# Asset generation & inspection scripts

These scripts regenerate layered artwork from the original logo. **They are not needed to run the React animation** — the kit already ships generated assets under `assets/generated/` and geometry under `component/cyberOdysseyArt.ts`.

## Dependency

Regeneration requires [sharp](https://www.npmjs.com/package/sharp) (Node native image library). It is listed only in this folder’s `package.json` so the kit does not force an install on the destination app.

```bash
cd scripts
npm install
```

## Commands (from kit root or `scripts/`)

| Command | Purpose |
| --- | --- |
| `node scripts/extract-cyber-odyssey-layers.mjs` | Rebuild PNGs, SVGs, `cyberOdysseyArt.ts`, and measurements JSON |
| `node scripts/analyze-cyber-odyssey-logo.mjs [rings\|junctions\|crop\|edges]` | Read-only analysis of the original PNG |
| `node scripts/inspect-cyber-odyssey-residue.mjs` | Check non-red residue in the extracted cyborg layer |
| `node scripts/inspect-cyber-odyssey-diff.mjs x y w h scale name` | Magnified source / reconstruction / diff crops (needs a prior extract’s temp validation outputs) |

## Paths (kit-local)

| Role | Path |
| --- | --- |
| Original (never written) | `assets/original/CapriWebServices-Logo.png` |
| Generated outputs | `assets/generated/*` |
| React geometry module | `component/cyberOdysseyArt.ts` |
| Measurement report | `scripts/cyber-odyssey-measurements.json` |

Asset URL strings written into `cyberOdysseyArt.ts` stay as `/branding/cyber-odyssey/...` for public-folder mapping in the host app.
