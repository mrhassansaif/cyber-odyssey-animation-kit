# Cyber Odyssey Animation Kit

Self-contained, portable package of the **Cyber Odyssey** orbital logo animation as implemented for Capri Web Services.

Copy this folder into another project and hand it to a Cursor agent (see `INTEGRATION_PROMPT.md`) to integrate the **existing** animation — do not rebuild it.

This kit does **not** replace or modify the live Capri site. The originating app continues to use its own copies under `src/components/branding/` and `public/branding/cyber-odyssey/`.

---

## What this kit provides

| Deliverable | Description |
| --- | --- |
| React component | `CyberOdysseyLoader` with variants `loader`, `hero`, `reveal` |
| CSS Modules stylesheet | Orbital spin, depth, glow, reveal, pause, reduced-motion |
| Generated geometry module | Measured orbit/planet data + public asset URL map |
| Runtime rasters | Cyborg, small cyborg, glow PNGs |
| Standalone animated SVG | Drop-in looping mark with embedded images + CSS |
| Static orbits SVG | Separated vector orbit layer |
| Original logo | Untouched source PNG (reference / regeneration) |
| Generation scripts | Extract / analyze / inspect pipeline (optional `sharp`) |
| Previews | Standalone HTML (SVG) + Next.js interactive reference |

---

## Directory inventory

```
cyber-odyssey-animation-kit/
├── README.md                          ← this file
├── INTEGRATION_PROMPT.md              ← paste-ready prompt for another Cursor agent
├── manifest.json                      ← file list, roles, SHA-256 hashes
├── docs/
│   └── ORIGINAL_LOGO.md               ← naming note (cyber-odyssey-logo.png absent)
├── component/                         ← reusable runtime source
│   ├── CyberOdysseyLoader.tsx         ← React component (public API)
│   ├── CyberOdysseyLoader.module.css  ← animation CSS
│   └── cyberOdysseyArt.ts             ← geometry + asset URLs (generated)
├── assets/
│   ├── original/
│   │   └── CapriWebServices-Logo.png  ← untouched source logo (921×725)
│   └── generated/
│       ├── cyborg.png                 ← runtime: full cyborg layer
│       ├── cyborg-sm.png              ← runtime: loader-sized cyborg
│       ├── cyborg-glow.png            ← runtime: energy glow
│       ├── orbits.svg                 ← static vector orbits + planets
│       └── cyber-odyssey-orbital.svg  ← standalone animated SVG
├── scripts/                           ← regeneration / inspection (optional)
│   ├── package.json                   ← sharp only (devDependency)
│   ├── README.md
│   ├── extract-cyber-odyssey-layers.mjs
│   ├── analyze-cyber-odyssey-logo.mjs
│   ├── inspect-cyber-odyssey-diff.mjs
│   ├── inspect-cyber-odyssey-residue.mjs
│   ├── cyber-odyssey-geometry.mjs
│   ├── cyber-odyssey-svg.mjs
│   ├── cyber-odyssey-measurements.json
│   └── verify-kit-integrity.mjs       ← kit-local integrity check
└── preview/
    ├── standalone/
    │   └── index.html                 ← zero-React SVG preview
    └── next-app-reference/
        ├── README.md
        ├── page.tsx                   ← Next metadata wrapper
        └── LogoAnimationPreview.tsx   ← full interactive controls
```

### Purpose by file

| File | Runtime? | Role |
| --- | --- | --- |
| `component/CyberOdysseyLoader.tsx` | Yes | Animation component |
| `component/CyberOdysseyLoader.module.css` | Yes | Motion / a11y CSS |
| `component/cyberOdysseyArt.ts` | Yes | Geometry + `/branding/cyber-odyssey/*` URLs |
| `assets/generated/cyborg.png` | Yes | Hero/reveal cyborg |
| `assets/generated/cyborg-sm.png` | Yes | Loader cyborg |
| `assets/generated/cyborg-glow.png` | Yes | Glow layer |
| `assets/generated/cyber-odyssey-orbital.svg` | Optional | Framework-free animated mark |
| `assets/generated/orbits.svg` | Optional | Static orbit layer / tooling |
| `assets/original/CapriWebServices-Logo.png` | No | Source of truth for regeneration |
| `scripts/*` | No | Regenerate / inspect artwork |
| `preview/*` | No | Demonstration only |

---

## Framework requirements (honest)

The React component is **not** framework-independent.

| Requirement | Notes |
| --- | --- |
| **React** | Uses `useEffect`, `useId`, `useRef`. Peer: React 18+ (originated on React 19). |
| **TypeScript** | Source is `.tsx` / `.ts`. Can be transpiled; types are part of the API. |
| **CSS Modules** | Imports `./CyberOdysseyLoader.module.css`. Bundler must support CSS Modules. |
| **Next.js (origin)** | `"use client"` directive for App Router. Not required conceptually, but present in the source. |
| **DOM / CSS animations** | No Framer Motion, GSAP, or other animation libraries. |
| **Theme class** | `surface="auto"` looks for an ancestor `.dark` via `:global(.dark)`. |

### Package / peer dependencies

**Runtime (host app must already provide):**

- `react`
- `react-dom` (typical host)
- CSS Modules support in the bundler

**Not required at runtime:**

- `next` (only needed if you keep `"use client"` / App Router preview as-is)
- `tailwindcss` (only used by the Next preview chrome)
- `sharp` (only for `scripts/` regeneration)

**Optional regeneration:** see `scripts/package.json` (`sharp`).

---

## Asset path mapping

`cyberOdysseyArt.ts` exposes:

```ts
CYBER_ODYSSEY_ASSETS = {
  cyborg: "/branding/cyber-odyssey/cyborg.png",
  cyborgSmall: "/branding/cyber-odyssey/cyborg-sm.png",
  glow: "/branding/cyber-odyssey/cyborg-glow.png",
}
```

**Integration mapping (typical static host / Next `public/`):**

```
kit/assets/generated/cyborg.png       →  public/branding/cyber-odyssey/cyborg.png
kit/assets/generated/cyborg-sm.png    →  public/branding/cyber-odyssey/cyborg-sm.png
kit/assets/generated/cyborg-glow.png  →  public/branding/cyber-odyssey/cyborg-glow.png
```

Optional:

```
kit/assets/generated/cyber-odyssey-orbital.svg → public/branding/cyber-odyssey/cyber-odyssey-orbital.svg
kit/assets/generated/orbits.svg               → public/branding/cyber-odyssey/orbits.svg
```

If your app uses a different public base path, update `CYBER_ODYSSEY_ASSETS` (or your asset pipeline) accordingly. Do not leave broken absolute paths.

---

## Component API

```tsx
import CyberOdysseyLoader from "./CyberOdysseyLoader"; // adjust path

<CyberOdysseyLoader
  variant="loader" | "hero" | "reveal"  // default "hero"
  size={64} | "100%"                    // number = px; height from 921/725 aspect
  paused={false}
  speed={1}                             // loader default speed 1.5 if omitted
  label="Loading"                       // a11y name
  decorative={false}                    // aria-hidden when true (ignored for loader)
  surface="auto" | "light" | "dark"
  onRevealComplete={() => {}}           // once per reveal settle
  className="..."
  style={{}}
/>
```

### Variants

| Variant | Behavior |
| --- | --- |
| `loader` | Compact status indicator (`role="status"`), smaller default size, faster default speed, uses `cyborg-sm` |
| `hero` | Looping brand mark |
| `reveal` | Intro fade + orbit sweeps + planet pop + particle fade-in, then seamless loop; fires `onRevealComplete` |

### Preserved behaviors

- Stationary cyborg; independently spinning orbital rings / tonal lobes
- Planets on the outer orbit with depth scaling + counter-rotation
- Comet + inner spark particles with glow
- Seamless CSS loops; `--co-speed` multiplier
- `paused` → `animation-play-state: paused`
- `prefers-reduced-motion: reduce` disables motion (loader keeps a slow opacity breath)
- Unique SVG paint-server IDs via React `useId` (safe with multiple instances)

---

## Usage examples

```tsx
// Loading indicator
<CyberOdysseyLoader variant="loader" size={64} />

// Hero mark on a dark section
<CyberOdysseyLoader variant="hero" size={320} surface="dark" />

// Intro, then loop
<CyberOdysseyLoader
  variant="reveal"
  size={420}
  onRevealComplete={() => console.log("settled")}
/>

// Replay reveal: remount with a new key
<CyberOdysseyLoader key={runId} variant="reveal" size={320} />
```

---

## Previewing

### A) Standalone SVG preview (no React / no Capri site)

1. From the **parent** of this kit folder, serve statically, e.g.  
   `npx --yes serve cyber-odyssey-animation-kit`
2. Open `/preview/standalone/`
3. Or open `preview/standalone/index.html` directly (some browsers block `file://` SVG `<object>` loads).

This previews **only** `cyber-odyssey-orbital.svg` (looping standalone artwork). It does **not** expose pause, speed, reveal, or surface props.

### B) Full interactive preview (Next.js reference)

Source: `preview/next-app-reference/`.

In the originating Capri app this is the route `/preview/logo-animation` (Tailwind chrome + live `CyberOdysseyLoader`). To reuse it elsewhere, follow `preview/next-app-reference/README.md`.

### C) Standalone animated SVG as an asset

```html
<img src="/branding/cyber-odyssey/cyber-odyssey-orbital.svg" alt="Capri Web Services" width="420" />
<!-- or -->
<object type="image/svg+xml" data="/branding/cyber-odyssey/cyber-odyssey-orbital.svg"></object>
```

**SVG ID note:** `orbits.svg` and `cyber-odyssey-orbital.svg` share fixed `id` prefixes (`co-occ`, `co-stroke-*`, etc.). Do not inline both into the same HTML document without renaming IDs. The React component avoids collisions via `useId`.

---

## Regenerating artwork

Already-generated assets are included. Regeneration is optional.

```bash
cd scripts
npm install
cd ..
node scripts/extract-cyber-odyssey-layers.mjs
```

Details: `scripts/README.md`. The original PNG is never modified; the extract script verifies its SHA-256.

---

## Copying this kit into another project

1. Copy the entire `cyber-odyssey-animation-kit/` directory.
2. Point Cursor at it and paste `INTEGRATION_PROMPT.md` (fill in the kit path).
3. Or manually: copy `component/` into your source tree, copy `assets/generated/` into your public asset path, wire imports, map theme `.dark` if needed.
4. Run the destination’s type-check / lint / build / visual checks.

Do not commit secrets; this kit contains none.

---

## Known limitations & troubleshooting

| Issue | Guidance |
| --- | --- |
| Images 404 | Confirm public mapping to `/branding/cyber-odyssey/*` or update `CYBER_ODYSSEY_ASSETS`. |
| CSS not applied | Ensure CSS Modules are enabled; class names must hash. |
| `surface="auto"` never adds rim | Host needs ancestor `.dark`, or pass `surface="dark"`. |
| SSR / hydration | Component is client-oriented (`"use client"`); mount on the client in Next App Router. |
| Reduced motion “frozen” | Expected: spins/particles off; loader still breathes. |
| Reveal callback never fires | Reduced motion completes immediately via `matchMedia`; otherwise wait for final particle animation end. |
| Tailwind missing in preview | Only the Next reference chrome needs Tailwind; the component does not. |
| `cyber-odyssey-logo.png` missing | Correct — see `docs/ORIGINAL_LOGO.md`. Use `CapriWebServices-Logo.png`. |
| Dual SVG ID clashes | Don’t inline both packaged SVGs on one page without uniquifying IDs. |
| Want Vite/non-Next | Keep React + CSS Modules; drop or replace `"use client"`; remap assets. |

---

## Integrity

See `manifest.json` for SHA-256 hashes of packaged files. The original logo hash must remain:

`2a2064f933be5575647b146a899686bc6137e9f123bb35cbb96ac045e0f04c5a`

Component TSX/CSS in this kit are byte-identical to the originating Capri files at packaging time. `cyberOdysseyArt.ts` matches the originating **data payload**; only the kit header comment was adjusted for portable paths.
