/**
 * Builds standalone SVG markup for the Cyber Odyssey orbital logo from the generated art data.
 * Mirrors the structure of component/CyberOdysseyLoader.tsx:
 *
 *   glow (animated only) → cyborg raster → orbital group (masked by the head occluder on the far side)
 *     each orbit: static stroke mask ← rotating tonal paint in the orbit's own (circular) plane
 *     planets / particles: ride the rotating plane, counter-rotated so they stay round on screen
 *
 * Modes: "orbits-only" (separated vector orbit layer), "static" (t = 0, used for diffing against
 * the source), "animated" (self-contained looping SVG with embedded CSS).
 */

export const MOTION = {
    // seconds per revolution at speed 1
    outerPeriod: 48,
    middlePeriod: 36,
    cometPeriod: 11,
    innerParticlePeriod: 8,
    glowPeriod: 5.2,
    planetDepth: 0.045,
};

export const PARTICLES = {
    comet: { orbit: "middle", start: 118, direction: -1, glow: 13 },
    inner: { orbit: "inner", start: 52, direction: 1, glow: 11 },
};

const f = (v, d = 3) => Number(v.toFixed(d)).toString();

/** Negative animation delay (fraction of a period) that puts a 0→360° keyframe at `angle`. */
export function phaseFraction(angle, direction) {
    const a = ((angle % 360) + 360) % 360;
    return direction > 0 ? a / 360 : ((360 - a) % 360) / 360;
}

function lobeGradient(id, angle, stops) {
    const r = (angle * Math.PI) / 180;
    const x = Math.cos(r), y = Math.sin(r);
    const first = stops[0];
    return (
        `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(-x, 5)}" y1="${f(-y, 5)}" x2="${f(x, 5)}" y2="${f(y, 5)}">` +
        `<stop offset="${f(Math.max(0, first.offset - 0.0005), 4)}" stop-color="${first.color}" stop-opacity="0"/>` +
        stops.map((s) => `<stop offset="${f(s.offset, 4)}" stop-color="${s.color}"/>`).join("") +
        `</linearGradient>`
    );
}

/** Comet highlight lobes (relative to the comet head at 0°, trailing behind the motion). */
export function cometLobes(direction) {
    const behind = -direction; // trailing side
    return [
        { angle: behind * 46, p0: 0.86, color: "#22d3ee", opacity: 0.16 },
        { angle: behind * 26, p0: 0.9, color: "#22d3ee", opacity: 0.3 },
        { angle: behind * 9, p0: 0.955, color: "#67e8f9", opacity: 0.55 },
        { angle: 0, p0: 0.985, color: "#cffafe", opacity: 0.85 },
    ];
}

function glowLobeGradient(id, lobe) {
    const r = (lobe.angle * Math.PI) / 180;
    const x = Math.cos(r), y = Math.sin(r);
    const o0 = (lobe.p0 + 1) / 2;
    return (
        `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(-x, 5)}" y1="${f(-y, 5)}" x2="${f(x, 5)}" y2="${f(y, 5)}">` +
        `<stop offset="${f(o0, 4)}" stop-color="${lobe.color}" stop-opacity="0"/>` +
        `<stop offset="1" stop-color="${lobe.color}" stop-opacity="${lobe.opacity}"/>` +
        `</linearGradient>`
    );
}

const CSS = () => {
    const M = MOTION;
    const depth = (k, lo, hi) => {
        const frames = [];
        for (let a = 0; a <= 360; a += 30) {
            const s = Math.sin((a * Math.PI) / 180);
            frames.push(`${f((a / 360) * 100, 3)}%{transform:scale(${f(1 + k * s, 4)})${lo !== undefined ? `;opacity:${f(lo + ((hi - lo) * (s + 1)) / 2, 3)}` : ""}}`);
        }
        return frames.join("");
    };
    return `
.co-a{transform-box:view-box;transform-origin:0 0}
@keyframes co-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes co-depth{${depth(M.planetDepth)}}
@keyframes co-pdepth{${depth(0.09, 0.55, 1)}}
@keyframes co-glow{0%,100%{opacity:.1}50%{opacity:.38}}
.co-outer{animation:co-spin ${M.outerPeriod}s linear infinite}
.co-outer-c{animation:co-spin ${M.outerPeriod}s linear infinite reverse}
.co-middle{animation:co-spin ${M.middlePeriod}s linear infinite reverse}
.co-comet{animation:co-spin ${M.cometPeriod}s linear infinite reverse}
.co-comet-c{animation:co-spin ${M.cometPeriod}s linear infinite}
.co-inner{animation:co-spin ${M.innerParticlePeriod}s linear infinite}
.co-inner-c{animation:co-spin ${M.innerParticlePeriod}s linear infinite reverse}
.co-glow{opacity:.1;animation:co-glow ${M.glowPeriod}s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
.co-a,.co-glow{animation:none!important}
.co-particle{display:none}
.co-glow{opacity:0}
}`;
};

export function buildOrbitalSvg(art, { mode, cyborgHref, glowHref } = {}) {
    const { width: W, height: H } = art.viewBox;
    const animated = mode === "animated";
    const withCyborg = mode !== "orbits-only";
    const defs = [];
    const body = [];

    defs.push(
        `<mask id="co-occ" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
        `<rect width="${W}" height="${H}" fill="#fff"/><path d="${art.occluderPath}" fill="#000"/></mask>`
    );

    const frame = (o) => `translate(${o.cx} ${o.cy}) rotate(${o.rotation}) scale(${o.rx} ${o.ry})`;
    const unframe = (o, angle) => `rotate(${f(-angle, 3)}) scale(${f(1 / o.rx, 8)} ${f(1 / o.ry, 8)}) rotate(${f(-o.rotation, 4)})`;

    const orbitGroups = [];
    for (const o of art.orbits) {
        defs.push(
            `<mask id="co-stroke-${o.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
            `<path d="${o.path}" fill="none" stroke="#fff" stroke-width="${o.strokeWidth}"/></mask>`
        );
        const paint = [`<circle r="1.3" fill="${o.base}"/>`];
        o.lobes.forEach((l, j) => {
            const id = `co-${o.id}-lobe-${j}`;
            defs.push(lobeGradient(id, l.angle, l.stops));
            paint.push(`<circle r="1.3" fill="url(#${id})"/>`);
        });
        const spinClass = o.id === "outer" ? "co-a co-outer" : o.id === "middle" ? "co-a co-middle" : "";
        let comet = "";
        if (animated && o.id === PARTICLES.comet.orbit) {
            const c = PARTICLES.comet;
            const lobes = cometLobes(c.direction).map((l, j) => {
                const id = `co-comet-lobe-${j}`;
                defs.push(glowLobeGradient(id, l));
                return `<circle r="1.3" fill="url(#${id})"/>`;
            });
            comet = `<g class="co-a co-comet co-particle"><g transform="rotate(${c.start})">${lobes.join("")}</g></g>`;
        }
        orbitGroups.push(
            `<g mask="url(#co-stroke-${o.id})"><g transform="${frame(o)}">` +
            `<g class="${spinClass}">${paint.join("")}</g>${comet}</g></g>`
        );
    }

    // planets ride the outer orbit's rotating plane
    const outer = art.orbits.find((o) => o.id === "outer");
    const k = MOTION.planetDepth;
    const planetEls = art.planets.map((p) => {
        const norm = 1 / (1 + k * Math.sin((p.angle * Math.PI) / 180));
        const delay = -phaseFraction(p.angle, 1) * MOTION.outerPeriod;
        const depthAttr = animated ? ` class="co-a" style="animation:co-depth ${MOTION.outerPeriod}s linear ${f(delay, 3)}s infinite"` : "";
        return (
            `<g transform="rotate(${p.angle})"><g transform="translate(${p.rho} 0)"><g class="${animated ? "co-a co-outer-c" : ""}">` +
            `<g transform="${unframe(outer, p.angle)} scale(${f(norm, 5)})"><g${depthAttr}>` +
            `<circle r="${p.r}" fill="${p.color}"/></g></g></g></g></g>`
        );
    });
    const planetsGroup = `<g transform="${frame(outer)}"><g class="${animated ? "co-a co-outer" : ""}">${planetEls.join("")}</g></g>`;

    let particles = "";
    if (animated) {
        defs.push(
            `<radialGradient id="co-spark"><stop offset="0" stop-color="#ecfeff"/><stop offset=".22" stop-color="#a5f3fc"/>` +
            `<stop offset=".45" stop-color="#22d3ee" stop-opacity=".55"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>`
        );
        const spark = (key, spinCls, counterCls, period) => {
            const pc = PARTICLES[key];
            const o = art.orbits.find((x) => x.id === pc.orbit);
            const delay = -phaseFraction(pc.start, pc.direction) * period;
            const dir = pc.direction > 0 ? "normal" : "reverse";
            return (
                `<g class="co-particle" transform="${frame(o)}"><g class="co-a ${spinCls}"><g transform="rotate(${pc.start})">` +
                `<g transform="translate(1 0)"><g class="co-a ${counterCls}"><g transform="${unframe(o, pc.start)}">` +
                `<g class="co-a" style="animation:co-pdepth ${period}s linear ${f(delay, 3)}s infinite ${dir}">` +
                `<circle r="${pc.glow}" fill="url(#co-spark)"/></g></g></g></g></g></g></g>`
            );
        };
        particles =
            spark("comet", "co-comet", "co-comet-c", MOTION.cometPeriod) +
            spark("inner", "co-inner", "co-inner-c", MOTION.innerParticlePeriod);
    }

    if (animated && glowHref) body.push(`<image class="co-glow" href="${glowHref}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`);
    if (withCyborg && cyborgHref) body.push(`<image href="${cyborgHref}" x="0" y="0" width="${W}" height="${H}"/>`);
    body.push(`<g mask="url(#co-occ)">${orbitGroups.join("")}${planetsGroup}${particles}</g>`);

    const title = mode === "orbits-only" ? "Cyber Odyssey orbits (separated layer)" : "Capri Web Services";
    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}">` +
        `<title>${title}</title>` +
        (animated ? `<style>${CSS()}</style>` : "") +
        `<defs>${defs.join("")}</defs>${body.join("")}</svg>\n`
    );
}
