# Next.js interactive preview (reference)

This is a **packaged copy** of the Capri Web Services internal route `/preview/logo-animation`.

## What it exercises

- Variants: `loader`, `hero`, `reveal`
- Pause / resume, speed control, reveal replay + `onRevealComplete`
- Surfaces: `dark`, `light`, auto (via host `.dark` class)
- Multiple sizes and a fluid-width hero

## Host assumptions

| Assumption | Detail |
| --- | --- |
| Framework | Next.js App Router (or any React setup that understands `"use client"`) |
| Styling | Tailwind utility classes for **preview chrome only** (not required by `CyberOdysseyLoader` itself) |
| Assets | None — the component renders its vector artwork inline |
| Import | Kit uses `../../component/CyberOdysseyLoader`; the live Capri app used `@/components/branding/CyberOdysseyLoader` |

## How to use in another Next app

1. Copy `component/*` into your components tree.
2. Place these preview files under a route such as `app/preview/logo-animation/`.
3. Ensure Tailwind (or rewrite the preview chrome CSS) if you want this exact UI.
4. Do **not** treat this preview as framework-independent.

## Standalone alternative

For a zero-React preview of the animated and static SVG files side by side, open `preview/standalone/index.html` (see the root README).
