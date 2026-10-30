"use client";

import { useEffect, useId, useRef, type AnimationEvent, type CSSProperties, type ReactNode, type Ref } from "react";
import { CYBER_ODYSSEY_ART as ART, type OrbitArt, type PlanetArt } from "./cyberOdysseyArt";
import styles from "./CyberOdysseyLoader.module.css";

export type CyberOdysseyVariant = "loader" | "hero" | "reveal";
export type CyberOdysseySurface = "auto" | "light" | "dark";

export type CyberOdysseyLoaderProps = {
    /** loader: compact status indicator · hero: looping brand mark · reveal: intro sequence, then loops. */
    variant?: CyberOdysseyVariant;
    /** Rendered width (number = px). Height follows the logo's 921 × 725 aspect ratio. */
    size?: number | string;
    /** Freezes every animation in place. */
    paused?: boolean;
    /** Motion speed multiplier (1 = default pacing). */
    speed?: number;
    /** Accessible name. Defaults to "Loading" for the loader and "Capri Web Services" otherwise. */
    label?: string;
    /** Hide from assistive technology when the mark sits next to visible brand text. Ignored by the loader. */
    decorative?: boolean;
    /**
     * Legibility on dark backgrounds: "dark" adds a faint cyan rim to the indigo orbits and planets,
     * "light" keeps the plain artwork, "auto" follows the site's `.dark` theme class.
     */
    surface?: CyberOdysseySurface;
    /** Fires once the reveal sequence has finished and the mark has settled into its loop. */
    onRevealComplete?: () => void;
    className?: string;
    style?: CSSProperties;
};

const VB = ART.viewBox;
const C = ART.cyborg;
const HL = ART.highlight;
const LEAD = Math.max(...HL.layers.map((l) => l.length));

const orbit = (id: OrbitArt["id"]) => ART.orbits.find((o) => o.id === id)!;
const frame = (o: OrbitArt) => `translate(${o.cx} ${o.cy}) rotate(${o.rotation}) scale(${o.rx} ${o.ry})`;
/** Undo the orbit frame (and the start angle) so content riding the plane stays round on screen. */
const unframe = (o: OrbitArt, angle: number) =>
    `rotate(${-angle}) scale(${1 / o.rx} ${1 / o.ry}) rotate(${-o.rotation})`;
/** Fraction of a period that places a 0→360° keyframe at `angle` (for negative animation delays). */
const phase = (angle: number, direction: 1 | -1) => {
    const a = ((angle % 360) + 360) % 360;
    return direction > 0 ? a / 360 : ((360 - a) % 360) / 360;
};
const vars = (v: Record<string, string | number>) => v as CSSProperties;
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export default function CyberOdysseyLoader({
    variant = "hero",
    size,
    paused = false,
    speed,
    label,
    decorative = false,
    surface = "auto",
    onRevealComplete,
    className,
    style,
}: CyberOdysseyLoaderProps) {
    const uid = "co" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const id = (name: string) => `${uid}-${name}`;
    const finalParticleRef = useRef<SVGGElement>(null);
    const revealDone = useRef(false);

    const isLoader = variant === "loader";
    const isReveal = variant === "reveal";
    const name = label ?? (isLoader ? "Loading" : "Capri Web Services");
    const width = size ?? (isLoader ? 64 : "100%");
    const effectiveSpeed = speed ?? (isLoader ? 1.5 : 1);

    const completeReveal = () => {
        if (revealDone.current) return;
        revealDone.current = true;
        onRevealComplete?.();
    };

    useEffect(() => {
        if (variant !== "reveal") return;
        // with reduced motion the reveal is skipped, so no animationend will arrive
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) completeReveal();
        return () => {
            // Allow a later reveal when this mounted instance changes variants and comes back.
            revealDone.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variant]);

    const onAnimationEnd = (e: AnimationEvent) => {
        if (isReveal && e.target === finalParticleRef.current) completeReveal();
    };

    const semantics = isLoader
        ? { role: "status", "aria-live": "polite" as const }
        : decorative
          ? { "aria-hidden": true }
          : { role: "img", "aria-label": name };

    const timing = (o: OrbitArt) => vars({ "--co-period": `${o.period}s` });

    /** A planet riding its orbit's rotating plane, counter-rotated so it stays round. */
    const planet = (p: PlanetArt, k: number) => {
        const o = orbit(p.orbit);
        return (
            <g key={p.id} transform={frame(o)}>
                <g className={cx(styles.spin, o.direction < 0 && styles.reverse)} style={timing(o)}>
                    <g transform={`rotate(${p.angle}) translate(1 0)`}>
                        <g className={cx(styles.spin, o.direction > 0 && styles.reverse)} style={timing(o)}>
                            <g transform={unframe(o, p.angle)}>
                                <g
                                    className={cx(styles.planetDepth, o.direction < 0 && styles.reverse)}
                                    style={vars({ "--co-period": `${o.period}s`, "--co-phase": phase(p.angle, o.direction) })}
                                >
                                    <g className={styles.planetPop} style={vars({ "--co-order": k })}>
                                        <circle className={styles.rimFill} r={p.r + 2.5} />
                                        <circle r={p.r} fill={`url(#${id(`planet-${p.paint}`)})`} />
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </g>
            </g>
        );
    };

    const highlight = (ref?: Ref<SVGGElement>) => {
        const o = orbit(HL.orbit);
        return (
            <g ref={ref} className={styles.particle}>
                {HL.layers.map((l, i) => {
                    const from = (l.length - LEAD) * 1000;
                    return (
                        <path
                            key={i}
                            className={styles.highlight}
                            d={o.full}
                            pathLength={1000}
                            fill="none"
                            stroke={l.color}
                            strokeOpacity={l.opacity}
                            strokeWidth={o.strokeWidth}
                            strokeDasharray={`${l.length * 1000} ${1000 - l.length * 1000}`}
                            style={vars({
                                "--co-period": `${HL.period}s`,
                                "--co-hl-from": from,
                                "--co-hl-to": from + (HL.direction > 0 ? -1000 : 1000),
                            })}
                        />
                    );
                })}
            </g>
        );
    };

    /** Rings, sweeps, planets and highlight for one depth layer. */
    const layer = (which: "back" | "front") => {
        const order = which === "back" ? [...ART.orbits].reverse() : ART.orbits;
        return order
            .filter((o) => o.wraps || which === "back")
            .map((o) => {
                const d = o.wraps ? o[which] : o.full;
                const planets = ART.planets.map((p, i) => [p, i] as const).filter(([p]) => p.orbit === o.id);
                let movers: ReactNode = (
                    <>
                        {isReveal && (
                            <path
                                className={styles.sweep}
                                style={vars({ "--co-order": ART.orbits.indexOf(o) })}
                                d={o.full}
                                pathLength={1}
                                fill="none"
                                strokeWidth={o.strokeWidth}
                            />
                        )}
                        {planets.map(([p, i]) => planet(p, i))}
                        {HL.orbit === o.id && highlight(which === "back" ? finalParticleRef : undefined)}
                    </>
                );
                if (o.wraps) movers = <g clipPath={`url(#${id(`clip-${which}-${o.id}`)})`}>{movers}</g>;
                return (
                    <g key={o.id}>
                        <path className={styles.rim} d={d} fill="none" strokeWidth={o.strokeWidth + 4} />
                        <path className={styles.ring} d={d} fill="none" stroke={`url(#${id(`ring-${o.id}`)})`} style={vars({ "--co-sw": o.strokeWidth })} strokeWidth={o.strokeWidth} />
                        {movers}
                    </g>
                );
            });
    };

    return (
        <span
            {...semantics}
            className={cx(styles.root, className)}
            data-variant={variant}
            data-surface={surface}
            data-paused={paused ? "true" : undefined}
            style={{ width: typeof width === "number" ? `${width}px` : width, ...vars({ "--co-speed": effectiveSpeed }), ...style }}
            onAnimationEnd={onAnimationEnd}
        >
            {isLoader && <span className={styles.srOnly}>{name}</span>}
            <svg className={styles.svg} viewBox={`${VB.x} ${VB.y} ${VB.width} ${VB.height}`} aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient id={id("cyborg")} gradientUnits="userSpaceOnUse" x1="0" y1={C.gradient.y1} x2="0" y2={C.gradient.y2}>
                        {C.gradient.stops.map((s) => (
                            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                        ))}
                    </linearGradient>
                    {ART.orbits.map((o) => (
                        <linearGradient key={o.id} id={id(`ring-${o.id}`)} gradientUnits="userSpaceOnUse" x1={o.paint.x1} y1={o.paint.y1} x2={o.paint.x2} y2={o.paint.y2}>
                            <stop offset="0" stopColor={o.paint.ends} />
                            <stop offset=".3" stopColor={o.paint.body} />
                            <stop offset=".7" stopColor={o.paint.body} />
                            <stop offset="1" stopColor={o.paint.ends} />
                        </linearGradient>
                    ))}
                    {Object.entries(ART.planetPaint).map(([k, stops]) => (
                        <radialGradient key={k} id={id(`planet-${k}`)} cx=".36" cy=".32" r=".75">
                            {stops.map((s) => (
                                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                            ))}
                        </radialGradient>
                    ))}
                    <mask id={id("behind")} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.width} height={VB.height}>
                        <rect x={VB.x} y={VB.y} width={VB.width} height={VB.height} fill="#fff" />
                        <g fill="none" stroke="#000" strokeWidth={C.stroke + 2 * C.gap}>
                            <path d={C.headSilhouette + C.solids} fill="#000" strokeLinejoin="round" />
                            <path d={C.torso} strokeLinejoin="round" />
                            {ART.orbits
                                .filter((o) => o.crumbs)
                                .map((o) => (
                                    <path key={o.id} d={o.crumbs} strokeWidth={o.strokeWidth + 2} />
                                ))}
                        </g>
                    </mask>
                    <mask id={id("knockout")} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.width} height={VB.height}>
                        <rect x={VB.x} y={VB.y} width={VB.width} height={VB.height} fill="#fff" />
                        {ART.orbits
                            .filter((o) => o.wraps)
                            .map((o) => (
                                <path key={o.id} d={o.front} fill="none" stroke="#000" strokeWidth={o.strokeWidth + 2 * C.gap} />
                            ))}
                    </mask>
                    {ART.orbits
                        .filter((o) => o.wraps)
                        .flatMap((o) => [
                            <clipPath key={`f-${o.id}`} id={id(`clip-front-${o.id}`)}>
                                <path d={o.frontClip} />
                            </clipPath>,
                            <clipPath key={`b-${o.id}`} id={id(`clip-back-${o.id}`)}>
                                <path d={o.backClip} />
                            </clipPath>,
                        ])}
                </defs>

                <g className={styles.intro}>
                    <g mask={`url(#${id("behind")})`}>{layer("back")}</g>

                    <g mask={`url(#${id("knockout")})`} fill="none" stroke={`url(#${id("cyborg")})`} strokeWidth={C.stroke}>
                        <path d={C.dome} strokeLinejoin="round" />
                        <path d={C.head + C.torso} strokeMiterlimit={4} />
                        <path d={C.fill} fill={`url(#${id("cyborg")})`} stroke="none" />
                        <path className={styles.pulse} d={C.fill} fill={ART.pulse.color} stroke="none" style={vars({ "--co-pulse": ART.pulse.peak })} />
                    </g>

                    <g>{layer("front")}</g>
                </g>
            </svg>
        </span>
    );
}
