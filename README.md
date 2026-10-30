# Cyber Odyssey Animation Kit

Self-contained, portable package of the **Cyber Odyssey** orbital logo for Capri Web Services: a fully vector static logo, a fully vector animated logo, and a React component that renders the same artwork.

Copy this folder into another project and hand it to a Cursor agent (see `INTEGRATION_PROMPT.md`) to integrate the **existing** artwork and animation — do not rebuild it.

This kit does **not** replace or modify the live Capri site.

---

## What this kit provides

| Deliverable | Description |
| --- | --- |
| Static logo SVG | `assets/generated/capri-web-services-logo.svg` — clean production mark, no animation, no filters |
| Animated logo SVG | `assets/generated/cyber-odyssey-orbital.svg` — self-contained looping mark (SVG-embedded CSS) |
| React component | `CyberOdysseyLoader` with variants `loader`, `hero`, `reveal`, rendering the same vector art inline |
| CSS Modules stylesheet | Orbital spin, depth, reveal, pause, speed, dark-surface rim, reduced motion |
| Generated geometry module | `component/cyberOdysseyArt.ts` — cyborg paths, orbits, planets, masks |
| Vector generator | `scripts/build-cyber-odyssey-vector.mjs` — single source for all three outputs (no dependencies) |
| Original logo | Untouched source PNG (reference) |
| Legacy material | Raster cyborg layers, `orbits.svg` and the raster extraction pipeline, kept for reference only |
| Previews | Standalone HTML (both SVGs on dark + light) + Next.js interactive reference |

### What is fully vectorised

Everything in the shipped artwork. The cyborg (helmet dome, visor frame, face, jaw, mouth guard, grille, neck, collar, shoulders, seams, placket), the three orbits, the planets and the travelling highlight are SVG paths and shapes. Neither final SVG nor the React component contains `<image>`, Base64 / data URIs, `<foreignObject>`, scripts or external references; `scripts/verify-kit-integrity.mjs` enforces this.

### The mark

- **Cyborg** — a clean redraw of the original line icon: centrelines measured from `assets/original/CapriWebServices-Logo.png`, then snapped to its symmetry axis and 45° construction. One 16-unit stroke weight, mitred chamfers, round joins only on the dome. Navy-violet → crimson → red gradient, as in the original.
- **Orbits** — three nested ellipses tilted −25°, −27° and −32° (the original's rising diagonal, fanned for depth), thin indigo strokes with cyan-teal ends. The inner ring wraps the figure: in front across the chest, behind the helmet. The middle and outer rings run behind the figure.
- **Occlusion** — the helmet, neck, shoulder pads and placket hide whatever passes behind them; elsewhere rings and planets pass behind the torso lines with a clearance gap. Where the inner ring crosses in front, the torso lines are knocked out around it (its path was solved so every cut is steep and leaves no slivers).
- **Planets** — a cyan moon (inner, clockwise, 14 s), an indigo planet (middle, counter-clockwise, 23 s) and a navy giant (outer, clockwise, 38 s). They ride their ellipse exactly and swell ±6 % on the near side.
- **Animated extras** — a short cyan light travelling along the outer ring (9 s) and a faint pulse in the mouth grille (5.2 s). The cyborg never moves.

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
│   └── cyberOdysseyArt.ts             ← vector geometry (generated)
├── assets/
│   ├── original/
│   │   └── CapriWebServices-Logo.png  ← untouched source logo (921×725)
│   └── generated/
│       ├── capri-web-services-logo.svg ← static vector logo
│       ├── cyber-odyssey-orbital.svg   ← animated vector logo
│       ├── cyborg.png                  ← legacy raster layer (reference only)
│       ├── cyborg-sm.png               ← legacy raster layer (reference only)
│       ├── cyborg-glow.png             ← legacy raster layer (reference only)
│       └── orbits.svg                  ← legacy orbit layer (reference only)
├── scripts/
│   ├── build-cyber-odyssey-vector.mjs ← builds both SVGs + cyberOdysseyArt.ts (no deps)
│   ├── verify-kit-integrity.mjs       ← kit-local integrity check
│   ├── package.json                   ← sharp only (legacy pipeline)
│   ├── README.md
│   ├── extract-cyber-odyssey-layers.mjs  ← legacy raster pipeline
│   ├── analyze-cyber-odyssey-logo.mjs
│   ├── inspect-cyber-odyssey-diff.mjs
│   ├── inspect-cyber-odyssey-residue.mjs
│   ├── cyber-odyssey-geometry.mjs
│   ├── cyber-odyssey-svg.mjs
│   └── cyber-odyssey-measurements.json
└── preview/
    ├── standalone/
    │   └── index.html                 ← both SVGs, dark + light, several sizes
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
| `component/cyberOdysseyArt.ts` | Yes | Vector geometry + optional SVG asset URLs |
| `assets/generated/capri-web-services-logo.svg` | Optional | Static logo for `<img>`, CSS, brand use |
| `assets/generated/cyber-odyssey-orbital.svg` | Optional | Framework-free animated logo |
| `assets/generated/cyborg*.png`, `orbits.svg` | No | Legacy reference material; nothing depends on them |
| `assets/original/CapriWebServices-Logo.png` | No | Source of truth |
| `scripts/*` | No | Build / verify / legacy inspection |
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

The two SVG files need nothing: they work as plain `<img>` / CSS background / `<object>` assets.

### Package / peer dependencies

**Runtime (host app must already provide):** `react`, `react-dom`, CSS Modules support in the bundler.

**Not required at runtime:** `next` (only for `"use client"` / the App Router preview), `tailwindcss` (Next preview chrome only), `sharp` (legacy raster pipeline only). The component no longer loads any image files.

---

## Asset path mapping

The React component renders its artwork inline, so it needs **no public assets**. To serve the standalone SVGs as well, copy them to your public folder; `cyberOdysseyArt.ts` exposes the conventional URLs:

```ts
CYBER_ODYSSEY_ASSETS = {
  logo: "/branding/cyber-odyssey/capri-web-services-logo.svg",
  orbital: "/branding/cyber-odyssey/cyber-odyssey-orbital.svg",
}
```

```
kit/assets/generated/capri-web-services-logo.svg → public/branding/cyber-odyssey/capri-web-services-logo.svg
kit/assets/generated/cyber-odyssey-orbital.svg   → public/branding/cyber-odyssey/cyber-odyssey-orbital.svg
```

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
| `loader` | Compact status indicator (`role="status"`), 64 px default, faster default speed, rings drawn heavier so they survive small sizes |
| `hero` | Looping brand mark |
| `reveal` | Intro fade + a light sweep along each orbit + planet pop + highlight fade-in, then the seamless loop; fires `onRevealComplete` |

### Preserved behaviors

- Stationary cyborg; independently orbiting planets with distinct speeds and directions
- Correct front/back layering and occlusion (same structure as the SVG files)
- Seamless CSS loops; `--co-speed` multiplier
- `paused` → `animation-play-state: paused`
- `prefers-reduced-motion: reduce` stops all motion and shows the static composition (loader keeps a slow opacity breath)
- `surface="dark"` (or `auto` under `.dark`) adds a faint cyan rim to rings and planets
- Unique SVG definition IDs via React `useId` (safe with multiple instances)

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

### A) Standalone SVG preview (no React)

Open `preview/standalone/index.html`. It loads the real files from `assets/generated/` and shows the animated and static logos side by side on a dark and a light surface, plus small sizes. If your browser blocks `file://` images, serve the kit folder (e.g. `npx --yes serve .` from the kit root) and open `/preview/standalone/`.

Reduced motion: enable the OS / browser setting (Chrome DevTools → Rendering → "prefers-reduced-motion: reduce"); the animated SVG then holds the static composition.

### B) Full interactive preview (Next.js reference)

Source: `preview/next-app-reference/` — loader / hero / reveal, pause, speed, surfaces. See `preview/next-app-reference/README.md`.

### C) Using the SVG files directly

```html
<img src="/branding/cyber-odyssey/capri-web-services-logo.svg" alt="Capri Web Services" width="320" />
<img src="/branding/cyber-odyssey/cyber-odyssey-orbital.svg" alt="Capri Web Services" width="420" />
```

**SVG ID note:** both SVG files use fixed `co-*` IDs. Use them as images (`<img>`, CSS) rather than inlining both into one HTML document; if you must inline, rename the IDs. The React component avoids collisions via `useId`.

---

## Regenerating the artwork

All three vector outputs come from `scripts/build-cyber-odyssey-vector.mjs` (plain Node, no dependencies):

```bash
node scripts/build-cyber-odyssey-vector.mjs          # write the SVGs + component/cyberOdysseyArt.ts
node scripts/build-cyber-odyssey-vector.mjs --check  # fail if any output is out of date
node scripts/verify-kit-integrity.mjs                # full kit check
```

Edit geometry, colours or timing in that script, never in the generated files. The legacy raster pipeline (`extract-cyber-odyssey-layers.mjs`, needs `sharp`) only refreshes the legacy reference layers; see `scripts/README.md`.

---

## Copying this kit into another project

1. Copy the entire `cyber-odyssey-animation-kit/` directory.
2. Point Cursor at it and paste `INTEGRATION_PROMPT.md` (fill in the kit path).
3. Or manually: copy `component/` into your source tree, optionally copy the two SVGs into your public folder, wire imports, map theme `.dark` if needed.
4. Run the destination's type-check / lint / build / visual checks.

Do not commit secrets; this kit contains none.

---

## Known limitations & troubleshooting

| Issue | Guidance |
| --- | --- |
| CSS not applied | Ensure CSS Modules are enabled; class names must hash. |
| `surface="auto"` never adds rim | Host needs ancestor `.dark`, or pass `surface="dark"`. |
| SSR / hydration | Component is client-oriented (`"use client"`); mount on the client in Next App Router. |
| Reduced motion "frozen" | Expected: the static composition is shown; the loader still breathes. |
| Reveal callback never fires | Reduced motion completes immediately via `matchMedia`; otherwise wait for the highlight fade-in to end. |
| Tiny sizes | Below ~48 px the orbits become hairlines; use the `loader` variant (heavier rings) or the static logo at ≥ 64 px for icon use. |
| Tailwind missing in preview | Only the Next reference chrome needs Tailwind; the component does not. |
| `cyber-odyssey-logo.png` missing | Correct — see `docs/ORIGINAL_LOGO.md`. Use `CapriWebServices-Logo.png`. |
| Inlining both SVGs on one page | Rename the fixed `co-*` IDs first, or use them as images. |
| Want Vite/non-Next | Keep React + CSS Modules; drop or replace `"use client"`. |

---

## Integrity

See `manifest.json` for SHA-256 hashes of packaged files. The original logo hash must remain:

`2a2064f933be5575647b146a899686bc6137e9f123bb35cbb96ac045e0f04c5a`

The component, its stylesheet and the generated art module were redesigned in this kit (vector artwork); they no longer match the originating Capri site's raster-based files.
