# Integration prompt (paste into Cursor in the destination repo)

Copy the entire `cyber-odyssey-animation-kit/` folder into the destination project (or point Cursor at its absolute path), then paste the prompt below.

---

You are integrating the **Cyber Odyssey logo animation** from a self-contained portable kit into this repository.

## Kit location

The kit folder path is:

`{{PATH_TO_cyber-odyssey-animation-kit}}`

(Replace with the actual path after copying. Example: `./cyber-odyssey-animation-kit` or an absolute path.)

## Mandatory process

1. **Read the kit first.** Open and read `README.md`, `manifest.json`, `docs/ORIGINAL_LOGO.md`, `scripts/README.md`, and `preview/next-app-reference/README.md`. Inspect `component/CyberOdysseyLoader.tsx`, `component/CyberOdysseyLoader.module.css`, `component/cyberOdysseyArt.ts`, and the files under `assets/`. Do not invent a new animation.

2. **Survey the destination project.** Identify framework (Next.js, Vite/React, etc.), router, TypeScript setup, CSS strategy (CSS Modules, Tailwind, styled-components, etc.), existing loading / brand / logo components, and how static assets are served (`public/`, CDN, import URLs, etc.).

3. **Use the kit as the reference implementation.** Port the existing component behavior. Do **not** rebuild the orbital animation from scratch, redesign motion, or “simplify” the mark unless the user explicitly asks.

4. **Adapt — do not blindly copy Next.js assumptions.**
   - The component ships with `"use client"` (Next.js App Router client boundary). Keep it in Next App Router; for other React setups, apply the equivalent client/browser boundary if required.
   - CSS Modules are required for `CyberOdysseyLoader.module.css` (or carefully rewrite to the project’s CSS approach while preserving selectors/animations).
   - `surface="auto"` depends on an ancestor with class `.dark` (`:global(.dark)` in the module). Map this to the destination theme convention.
   - Runtime image URLs in `cyberOdysseyArt.ts` are `/branding/cyber-odyssey/cyborg.png`, `cyborg-sm.png`, and `cyborg-glow.png`. Copy `assets/generated/*` into the destination’s public asset root so those URLs resolve, **or** update `CYBER_ODYSSEY_ASSETS` to match the destination asset system. Prefer matching the existing public path if the project can host that folder.

5. **Preserve the public API and behavior**, including:
   - Variants: `loader` | `hero` | `reveal`
   - Stationary cyborg artwork; independently animated orbital rings
   - Planet positioning / layering; seamless loops
   - Glow + particle effects
   - `paused`, `speed`, `size`, `label`, `decorative`, `surface`
   - Reveal replay (remount / key) and `onRevealComplete`
   - `prefers-reduced-motion` handling
   - Responsive sizing and accessibility semantics (`role="status"` / `role="img"` / `aria-hidden`)

6. **Copy assets correctly.**
   - Runtime: `cyborg.png`, `cyborg-sm.png`, `cyborg-glow.png` (required by the React component)
   - Optional reusable standalone: `cyber-odyssey-orbital.svg` (self-contained animated SVG)
   - Optional static layer: `orbits.svg`
   - Original reference (not required at runtime): `assets/original/CapriWebServices-Logo.png`
   - Update paths if the destination does not use `/branding/cyber-odyssey/`.

7. **Dependencies.** Runtime peer needs: **React** (hooks: `useEffect`, `useId`, `useRef`), **TypeScript** (or strip types), **CSS Modules**. Do **not** add animation libraries. Reuse existing React / tooling. `sharp` is only for optional asset regeneration inside the kit’s `scripts/` and must not be added to the app unless the user wants regeneration in-repo.

8. **Scope control.** Do not modify unrelated UI, layout, navigation, branding, marketing copy, or website behavior. Touch only what integration requires.

9. **Verify.** Run the destination project’s type-check, lint, and production build (or the closest equivalents). Visually verify loader / hero / reveal, pause/speed if wired, dark/light surfaces, and reduced-motion. If a full interactive preview is needed, adapt `preview/next-app-reference/` or open `preview/standalone/index.html` for SVG-only checks.

10. **Report honestly.** Call out anything unsupported (e.g. no CSS Modules, no React, SSR constraints, theme class differences) and what adaptation you made. Do **not** claim framework-independence for the React component. Do **not** change the originating Capri website. Do **not** commit, push, or deploy unless the user explicitly asks.

## Out of scope

- Redesigning the logo or animation timing
- Regenerating artwork unless requested
- Installing unrelated dependencies
- Automatic deployment

## Definition of done

The destination app can render `CyberOdysseyLoader` (or a faithfully adapted equivalent) with all supported variants and accessibility behavior, assets resolve, and checks pass — without needing files from the original Capri repository outside this kit.
