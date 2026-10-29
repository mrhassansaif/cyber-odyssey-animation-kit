"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
/**
 * Reference preview from the Capri Next.js app (route: /preview/logo-animation).
 * Kit-relative import below. In the originating site this imported
 * `@/components/branding/CyberOdysseyLoader`.
 *
 * Assumptions (see preview/next-app-reference/README.md):
 * - React client component ("use client")
 * - Tailwind CSS utility classes for the preview chrome only
 * - Runtime assets served at /branding/cyber-odyssey/*
 */
import CyberOdysseyLoader, { type CyberOdysseySurface } from "../../component/CyberOdysseyLoader";

type Backdrop = { id: string; title: string; surface: CyberOdysseySurface; style: CSSProperties; text: string };

const CHECKER: CSSProperties = {
    backgroundColor: "#ffffff",
    backgroundImage: "conic-gradient(#d9dde3 25%, transparent 0 50%, #d9dde3 0 75%, transparent 0)",
    backgroundSize: "20px 20px",
};

const BACKDROPS: Backdrop[] = [
    { id: "dark", title: "Dark surface (surface=\"dark\")", surface: "dark", style: { background: "#0b1220" }, text: "#e2e8f0" },
    { id: "dark-original", title: "Dark surface, original artwork (surface=\"light\")", surface: "light", style: { background: "#0b1220" }, text: "#e2e8f0" },
    { id: "light", title: "Light surface", surface: "light", style: { background: "#ffffff" }, text: "#0f172a" },
    { id: "checker", title: "Transparency check", surface: "light", style: CHECKER, text: "#0f172a" },
];

const LOADER_SIZES = [48, 64, 96, 128];
const HERO_SIZES = [220, 420];
const SPEEDS = [0.5, 1, 2];

export default function LogoAnimationPreview() {
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [revealRun, setRevealRun] = useState(0);
    const [revealsDone, setRevealsDone] = useState(0);

    return (
        <main data-visitor-ignore className="min-h-screen bg-slate-100 px-4 py-8 font-dm-sans text-slate-900 sm:px-6">
            <header className="mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Cyber Odyssey logo animation</h1>
                    <p className="text-sm text-slate-600">
                        Internal preview of <code>CyberOdysseyLoader</code> (not indexed). Test reduced motion with DevTools →
                        Rendering → “prefers-reduced-motion: reduce”.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        aria-pressed={paused}
                        className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white"
                    >
                        {paused ? "Resume" : "Pause"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setRevealsDone(0);
                            setRevealRun((n) => n + 1);
                        }}
                        className="rounded-md border border-slate-300 bg-[#fff] px-3 py-1.5 font-medium"
                    >
                        Replay reveal
                    </button>
                    <label className="flex items-center gap-1.5">
                        Speed
                        <select
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="rounded-md border border-slate-300 bg-[#fff] px-2 py-1"
                        >
                            {SPEEDS.map((s) => (
                                <option key={s} value={s}>
                                    {s}×
                                </option>
                            ))}
                        </select>
                    </label>
                    <span className="text-slate-500" aria-live="polite">
                        Reveals finished: {revealsDone}
                    </span>
                </div>
            </header>

            <div className="mx-auto grid max-w-6xl gap-6">
                {BACKDROPS.map((b) => (
                    <section key={b.id} className="min-w-0 rounded-xl p-4 shadow-sm ring-1 ring-black/5 sm:p-6" style={{ ...b.style, color: b.text }}>
                        <h2 className="mb-5 text-sm font-semibold tracking-wide uppercase opacity-80">{b.title}</h2>
                        <div className="flex flex-wrap items-end gap-10">
                            <Group label="Loader · 48 / 64 / 96 / 128 px">
                                {LOADER_SIZES.map((s) => (
                                    <Cell key={s} caption={`${s}px`}>
                                        <CyberOdysseyLoader variant="loader" size={s} paused={paused} speed={speed * 1.5} surface={b.surface} />
                                    </Cell>
                                ))}
                            </Group>
                            <Group label="Hero · loop">
                                {HERO_SIZES.map((s) => (
                                    <Cell key={s} caption={`${s}px`}>
                                        <CyberOdysseyLoader variant="hero" size={s} paused={paused} speed={speed} surface={b.surface} />
                                    </Cell>
                                ))}
                            </Group>
                            <Group label="Reveal → loop">
                                <Cell caption="320px">
                                    <CyberOdysseyLoader
                                        key={revealRun}
                                        variant="reveal"
                                        size={320}
                                        paused={paused}
                                        speed={speed}
                                        surface={b.surface}
                                        onRevealComplete={() => setRevealsDone((n) => n + 1)}
                                    />
                                </Cell>
                            </Group>
                        </div>
                    </section>
                ))}

                <section className="min-w-0 rounded-xl bg-[#fff] p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
                    <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-slate-600">Responsive hero (fills its container)</h2>
                    <div className="mx-auto w-full max-w-[640px]">
                        <CyberOdysseyLoader variant="hero" paused={paused} speed={speed} surface="light" />
                    </div>
                </section>
            </div>
        </main>
    );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="min-w-0 max-w-full">
            <p className="mb-3 text-xs opacity-70">{label}</p>
            <div className="flex min-w-0 flex-wrap items-end gap-6">{children}</div>
        </div>
    );
}

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
    return (
        <figure className="flex min-w-0 max-w-full flex-col items-center gap-2">
            {children}
            <figcaption className="text-[11px] opacity-60">{caption}</figcaption>
        </figure>
    );
}
