"use client";

import { useEffect, useId, useRef, type AnimationEvent, type CSSProperties, type Ref } from "react";
import { CYBER_ODYSSEY_ART as ART, CYBER_ODYSSEY_ASSETS as ASSETS, type OrbitArt } from "./cyberOdysseyArt";
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
     * Legibility on dark backgrounds: "dark" adds a faint cyan rim to the navy orbits and dome,
     * "light" keeps the original artwork, "auto" follows the site's `.dark` theme class.
     */
    surface?: CyberOdysseySurface;
    /** Fires once the reveal sequence has finished and the mark has settled into its loop. */
    onRevealComplete?: () => void;
    className?: string;
    style?: CSSProperties;
};

const { width: VW, height: VH } = ART.viewBox;

const PLANET_DEPTH = 0.045;

const COMET = { orbit: "middle", start: 118, glow: 13 } as const;
const INNER_SPARK = { orbit: "inner", start: 52, glow: 11 } as const;

/** Trailing cyan highlight lobes for the comet (relative to its head, which leads counter-clockwise). */
const COMET_LOBES = [
    { angle: 46, p0: 0.86, color: "#22d3ee", opacity: 0.16 },
    { angle: 26, p0: 0.9, color: "#22d3ee", opacity: 0.3 },
    { angle: 9, p0: 0.955, color: "#67e8f9", opacity: 0.55 },
    { angle: 0, p0: 0.985, color: "#cffafe", opacity: 0.85 },
] as const;

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
const unit = (deg: number) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)] as const;
const vars = (v: Record<string, string | number>) => v as CSSProperties;

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
    const name = label ?? (isLoader ? "Loading" : "Capri Web Services");
    const width = size ?? (isLoader ? 64 : "100%");
    const effectiveSpeed = speed ?? (isLoader ? 1.5 : 1);
    const sparkBoost = isLoader ? 2.4 : 1;

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
        if (variant === "reveal" && e.target === finalParticleRef.current) completeReveal();
    };

    const outer = orbit("outer");
    const semantics = isLoader
        ? { role: "status", "aria-live": "polite" as const }
        : decorative
          ? { "aria-hidden": true }
          : { role: "img", "aria-label": name };

    return (
        <span
            {...semantics}
            className={[styles.root, className].filter(Boolean).join(" ")}
            data-variant={variant}
            data-surface={surface}
            data-paused={paused ? "true" : undefined}
            style={{ width: typeof width === "number" ? `${width}px` : width, ...vars({ "--co-speed": effectiveSpeed }), ...style }}
            onAnimationEnd={onAnimationEnd}
        >
            {isLoader && <span className={styles.srOnly}>{name}</span>}
            <svg className={styles.svg} viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true" focusable="false">
                <defs>
                    <mask id={id("occ")} maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
                        <rect width={VW} height={VH} fill="#fff" />
                        <path d={ART.occluderPath} fill="#000" />
                    </mask>
                    {ART.orbits.map((o) => (
                        <mask key={o.id} id={id(`stroke-${o.id}`)} maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
                            <path d={o.path} fill="none" stroke="#fff" strokeWidth={o.strokeWidth} />
                        </mask>
                    ))}
                    {ART.orbits.flatMap((o) =>
                        o.lobes.map((l, j) => {
                            const [x, y] = unit(l.angle);
                            return (
                                <linearGradient key={`${o.id}-${j}`} id={id(`${o.id}-lobe-${j}`)} gradientUnits="userSpaceOnUse" x1={-x} y1={-y} x2={x} y2={y}>
                                    <stop offset={Math.max(0, l.stops[0].offset - 0.0005)} stopColor={l.stops[0].color} stopOpacity={0} />
                                    {l.stops.map((s, k) => (
                                        <stop key={k} offset={s.offset} stopColor={s.color} />
                                    ))}
                                </linearGradient>
                            );
                        })
                    )}
                    {COMET_LOBES.map((l, j) => {
                        const [x, y] = unit(l.angle);
                        return (
                            <linearGradient key={j} id={id(`comet-${j}`)} gradientUnits="userSpaceOnUse" x1={-x} y1={-y} x2={x} y2={y}>
                                <stop offset={(l.p0 + 1) / 2} stopColor={l.color} stopOpacity={0} />
                                <stop offset={1} stopColor={l.color} stopOpacity={l.opacity} />
                            </linearGradient>
                        );
                    })}
                    <radialGradient id={id("spark")}>
                        <stop offset="0" stopColor="#ecfeff" />
                        <stop offset=".22" stopColor="#a5f3fc" />
                        <stop offset=".45" stopColor="#22d3ee" stopOpacity=".55" />
                        <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                    </radialGradient>
                </defs>

                <g className={styles.intro}>
                    <image className={styles.glow} href={ASSETS.glow} x="0" y="0" width={VW} height={VH} preserveAspectRatio="none" />
                    <image
                        className={styles.cyborg}
                        href={isLoader ? ASSETS.cyborgSmall : ASSETS.cyborg}
                        x="0"
                        y="0"
                        width={VW}
                        height={VH}
                    />

                    <g mask={`url(#${id("occ")})`}>
                        {ART.orbits.map((o) => (
                            <path key={o.id} className={styles.rim} d={o.path} fill="none" strokeWidth={o.strokeWidth + 4.5} />
                        ))}

                        {ART.orbits.map((o) => (
                            <g key={o.id} mask={`url(#${id(`stroke-${o.id}`)})`}>
                                <g transform={frame(o)}>
                                    <g className={o.id === "outer" ? styles.spinOuter : o.id === "middle" ? styles.spinMiddle : undefined}>
                                        <circle r="1.3" fill={o.base} />
                                        {o.lobes.map((_, j) => (
                                            <circle key={j} r="1.3" fill={`url(#${id(`${o.id}-lobe-${j}`)})`} />
                                        ))}
                                    </g>
                                    {o.id === COMET.orbit && (
                                        <g className={styles.particle}>
                                            <g className={styles.spinComet}>
                                                <g transform={`rotate(${COMET.start})`}>
                                                    {COMET_LOBES.map((_, j) => (
                                                        <circle key={j} r="1.3" fill={`url(#${id(`comet-${j}`)})`} />
                                                    ))}
                                                </g>
                                            </g>
                                        </g>
                                    )}
                                </g>
                            </g>
                        ))}

                        {variant === "reveal" &&
                            ART.orbits.map((o, k) => (
                                <path
                                    key={o.id}
                                    className={styles.sweep}
                                    style={vars({ "--co-order": k })}
                                    d={o.path}
                                    pathLength={1}
                                    fill="none"
                                    strokeWidth={o.strokeWidth}
                                />
                            ))}

                        <g transform={frame(outer)}>
                            <g className={styles.spinOuter}>
                                {ART.planets.map((p, k) => {
                                    const norm = 1 / (1 + PLANET_DEPTH * Math.sin((p.angle * Math.PI) / 180));
                                    return (
                                        <g key={k} transform={`rotate(${p.angle})`}>
                                            <g transform={`translate(${p.rho} 0)`}>
                                                <g className={styles.spinOuterCounter}>
                                                    <g transform={`${unframe(outer, p.angle)} scale(${norm})`}>
                                                        <g className={styles.planetDepth} style={vars({ "--co-phase": phase(p.angle, 1) })}>
                                                            <g className={styles.planetPop} style={vars({ "--co-order": k })}>
                                                                <circle className={styles.rimFill} r={p.r + 2.25} />
                                                                <circle r={p.r} fill={p.color} />
                                                            </g>
                                                        </g>
                                                    </g>
                                                </g>
                                            </g>
                                        </g>
                                    );
                                })}
                            </g>
                        </g>

                        <Spark
                            o={orbit(COMET.orbit)}
                            start={COMET.start}
                            r={COMET.glow * sparkBoost}
                            fill={`url(#${id("spark")})`}
                            spin={styles.spinComet}
                            counter={styles.spinCometCounter}
                            depth={styles.cometDepth}
                            phaseValue={phase(COMET.start, -1)}
                        />
                        <Spark
                            o={orbit(INNER_SPARK.orbit)}
                            start={INNER_SPARK.start}
                            r={INNER_SPARK.glow * sparkBoost}
                            fill={`url(#${id("spark")})`}
                            spin={styles.spinInner}
                            counter={styles.spinInnerCounter}
                            depth={styles.innerDepth}
                            phaseValue={phase(INNER_SPARK.start, 1)}
                            completionRef={finalParticleRef}
                        />
                    </g>
                </g>
            </svg>
        </span>
    );
}

function Spark({
    o,
    start,
    r,
    fill,
    spin,
    counter,
    depth,
    phaseValue,
    completionRef,
}: {
    o: OrbitArt;
    start: number;
    r: number;
    fill: string;
    spin: string;
    counter: string;
    depth: string;
    phaseValue: number;
    completionRef?: Ref<SVGGElement>;
}) {
    return (
        <g ref={completionRef} className={styles.particle} transform={frame(o)}>
            <g className={spin}>
                <g transform={`rotate(${start})`}>
                    <g transform="translate(1 0)">
                        <g className={counter}>
                            <g transform={unframe(o, start)}>
                                <g className={depth} style={vars({ "--co-phase": phaseValue })}>
                                    <circle r={r} fill={fill} />
                                </g>
                            </g>
                        </g>
                    </g>
                </g>
            </g>
        </g>
    );
}
