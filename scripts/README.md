# Build, verification & legacy inspection scripts

None of these scripts are needed to run the React component or to use the SVG files — the kit ships every generated output.

## Vector artwork (current)

`build-cyber-odyssey-vector.mjs` is the single source of the shipped artwork. Plain Node, no dependencies.

| Command (from kit root) | Purpose |
| --- | --- |
| `node scripts/build-cyber-odyssey-vector.mjs` | Write `assets/generated/capri-web-services-logo.svg`, `assets/generated/cyber-odyssey-orbital.svg` and `component/cyberOdysseyArt.ts` |
| `node scripts/build-cyber-odyssey-vector.mjs --check` | Exit 1 if any of those outputs is out of date |
| `node scripts/verify-kit-integrity.mjs` | Original-logo hash, required files, vector-only SVGs, static logo free of animation/filters, outputs in sync, component imports |

Edit cyborg geometry, orbit layout, colours or timing in `build-cyber-odyssey-vector.mjs`, then rebuild. Never edit the generated files by hand.

## Legacy raster pipeline (reference only)

These scripts produced the previous raster-based artwork. They are kept for reference; `extract-cyber-odyssey-layers.mjs` now writes only the legacy layers (`cyborg*.png`, `orbits.svg`) and the measurement report, and sends its legacy animated SVG and geometry module to the OS temp folder so they can never replace the vector deliverables.

They require [sharp](https://www.npmjs.com/package/sharp), listed only in this folder's `package.json`:

```bash
cd scripts
npm install
```

| Command | Purpose |
| --- | --- |
| `node scripts/extract-cyber-odyssey-layers.mjs` | Rebuild the legacy raster layers and measurements JSON |
| `node scripts/analyze-cyber-odyssey-logo.mjs [rings\|junctions\|crop\|edges]` | Read-only analysis of the original PNG |
| `node scripts/inspect-cyber-odyssey-residue.mjs` | Check non-red residue in the legacy cyborg layer |
| `node scripts/inspect-cyber-odyssey-diff.mjs x y w h scale name` | Magnified source / reconstruction / diff crops (needs a prior extract's temp validation outputs) |

## Paths (kit-local)

| Role | Path |
| --- | --- |
| Original (never written) | `assets/original/CapriWebServices-Logo.png` |
| Vector deliverables | `assets/generated/capri-web-services-logo.svg`, `assets/generated/cyber-odyssey-orbital.svg` |
| React geometry module | `component/cyberOdysseyArt.ts` |
| Legacy layers | `assets/generated/cyborg*.png`, `assets/generated/orbits.svg` |
| Measurement report | `scripts/cyber-odyssey-measurements.json` |
