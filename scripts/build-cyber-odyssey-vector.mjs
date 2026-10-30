/**
 * Builds the fully vector Cyber Odyssey mark from a single geometry source.
 *
 *   node scripts/build-cyber-odyssey-vector.mjs          write every output
 *   node scripts/build-cyber-odyssey-vector.mjs --check  exit 1 if an output is out of date
 *
 * Outputs
 *   assets/generated/capri-web-services-logo.svg   static production logo (no animation, no filters)
 *   assets/generated/cyber-odyssey-orbital.svg     self-contained animated logo (SVG-embedded CSS)
 *   component/cyberOdysseyArt.ts                   the same geometry for CyberOdysseyLoader
 *
 * No dependencies. Coordinates live in the original logo's 921 × 725 space. The cyborg is a
 * clean redraw of the line icon in assets/original/CapriWebServices-Logo.png: centrelines were
 * measured from the PNG, then snapped to its symmetry axis (x = 448) and 45° construction.
 *
 * Layering (identical in both SVGs and the React component):
 *   back    every ring except the near half of the wrapping inner ring, with planets and highlight —
 *           hidden behind the helmet, and broken (with a clearance gap) where it passes under torso lines
 *   cyborg  line art — knocked out along the inner ring's near half
 *   front   near half of the inner ring and its moon
 * Moving parts ride the orbit's own circle (CSS rotation inside `scale(rx ry)`), so planets stay
 * exactly on their ellipse; a counter-rotation keeps them round.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ geometry */

const W = 921;
const H = 725;
const STROKE = 16;
const AXIS = 448;
const GAP = 7;

const f = (v, d = 2) => {
    const s = Number(v.toFixed(d)).toString();
    return s === "-0" ? "0" : s;
};
const rad = (deg) => (deg * Math.PI) / 180;
const mx = (x) => 2 * AXIS - x;

/** Arc corner joining a straight segment to another, returned as [arcStart, arcEnd, sweep]. */
function fillet(from, vertex, to, r) {
    const n = ([x, y]) => {
        const l = Math.hypot(x, y);
        return [x / l, y / l];
    };
    const d1 = n([vertex[0] - from[0], vertex[1] - from[1]]);
    const d2 = n([to[0] - vertex[0], to[1] - vertex[1]]);
    const half = Math.acos(-(d1[0] * d2[0] + d1[1] * d2[1])) / 2;
    const t = r / Math.tan(half);
    const a = [vertex[0] - d1[0] * t, vertex[1] - d1[1] * t];
    const b = [vertex[0] + d2[0] * t, vertex[1] + d2[1] * t];
    const sweep = d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : 0;
    return [a, b, sweep];
}

const pt = ([x, y]) => `${f(x)} ${f(y)}`;

// Neck lines leave the jaw chamfers and round into the collar.
const NECK_TOP = [368, 408];
const COLLAR_Y = 484.5;
const NECK_CORNER = [324, COLLAR_Y];
const [neckA, neckB, neckSweep] = fillet(NECK_TOP, NECK_CORNER, [AXIS, COLLAR_Y], 20);
const neckCentre = [neckB[0], neckB[1] - 20];
// The shoulder line leaves the neck on the stroke centreline, so its butt end is hidden.
const SHOULDER_Y = 462;
const J = [neckCentre[0] - Math.sqrt(20 ** 2 - (SHOULDER_Y - neckCentre[1]) ** 2), SHOULDER_Y];
const A = [226.75, 494.6];
const B = [199, 540.6];
const BASE_Y = 611;
const SEAM_X = 312;
const slope = (A[1] - J[1]) / (J[0] - A[0]);
const Q = [SEAM_X, J[1] + (J[0] - SEAM_X) * slope + 32];
// where the inner shoulder line meets the shoulder diagonal
const u = (Q[1] + (Q[0] - A[0]) * slope - A[1]) / (B[1] - A[1] - (A[0] - B[0]) * slope);
const Pd = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u];
const PLACKET = [430.75, 465.25];

const side = (pts) => [pts, pts.map(([x, y]) => [mx(x), y])];
const poly = (pts) => "M" + pts.map(pt).join("L");

const domeY = 257.5;
const domeDx = Math.sqrt(107 ** 2 - (domeY - 211) ** 2);
const bandDx = Math.sqrt(107 ** 2 - (216.5 - 211) ** 2);

const square = (x, y, s) => `M${f(x)} ${f(y)}h${f(s)}v${f(s)}h${f(-s)}z`;

export const CYBORG = {
    stroke: STROKE,
    gradient: {
        y1: 96,
        y2: BASE_Y,
        stops: [
            { offset: 0, color: "#2d1466" },
            { offset: 0.2, color: "#560c4c" },
            { offset: 0.32, color: "#9a0636" },
            { offset: 0.42, color: "#d1052f" },
            { offset: 0.7, color: "#e30329" },
            { offset: 1, color: "#ff1a2e" },
        ],
    },
    /** Rounded joins: the dome bowl. */
    dome: `M${f(AXIS - domeDx)} ${domeY}A107 107 0 1 1 ${f(AXIS + domeDx)} ${domeY}Z`,
    /** Mitred joins: visor frame, face + jaw, mouth guard. */
    head: [
        "M335.3 216.5H560.7L572 227.8V276.5A22 22 0 0 1 550 298.5H346A22 22 0 0 1 324 276.5V227.8Z",
        "M349.5 298.5V389.5L397.5 437.5H498.5L546.5 389.5V298.5",
        "M349.5 332L390.25 372.75L407 356H489L505.75 372.75L546.5 332",
    ].join(""),
    /** Mitred joins: neck + collar, shoulders, side seams, placket. */
    torso: [
        // neck + collar
        `M${pt(NECK_TOP)}L${pt(neckA)}A20 20 0 0 ${neckSweep} ${pt(neckB)}H${f(mx(neckB[0]))}` +
            `A20 20 0 0 ${neckSweep} ${f(mx(neckA[0]))} ${f(neckA[1])}L${f(mx(NECK_TOP[0]))} ${f(NECK_TOP[1])}`,
        // shoulders (outer contour, then inner line + side seam)
        ...side([J, A, B, [B[0], BASE_Y]]).map(poly),
        ...side([Pd, Q, [Q[0], BASE_Y]]).map(poly),
        // placket
        `M${f(PLACKET[0])} ${COLLAR_Y}V${BASE_Y}M${f(PLACKET[1])} ${COLLAR_Y}V${BASE_Y}`,
    ].join(""),
    /** Filled details: the mouth grille. */
    fill: [408.5, 440.5, 472.5].flatMap((x) => [373.5, 395].map((y) => square(x, y, 15))).join(""),
    /**
     * Outer contour of the helmet and face (stroke centreline). Filled and stroked, it hides
     * whatever passes behind the head; behind the torso, orbits only break around its lines.
     */
    headSilhouette:
        `M${f(AXIS - bandDx)} 216.5A107 107 0 1 1 ${f(AXIS + bandDx)} 216.5` +
        "H560.7L572 227.8V276.5A22 22 0 0 1 550 298.5H546.5V389.5L498.5 437.5H397.5L349.5 389.5V298.5H346" +
        "A22 22 0 0 1 324 276.5V227.8L335.3 216.5Z",
    /**
     * Torso areas too narrow to see through once the lines' clearance is added (neck, shoulder
     * pads, placket): treated as solid, so nothing behind them shows as slivers.
     */
    solids: [
        [NECK_TOP, J, neckB, [mx(neckB[0]), neckB[1]], [mx(J[0]), J[1]], [mx(NECK_TOP[0]), NECK_TOP[1]]],
        ...side([J, A, Pd, Q, neckB]),
        [[PLACKET[0], COLLAR_Y], [PLACKET[1], COLLAR_Y], [PLACKET[1], BASE_Y], [PLACKET[0], BASE_Y]],
    ]
        .map((p) => poly(p) + "Z")
        .join(""),
    /** Clearance kept between the cyborg and any orbit passing behind or in front of it. */
    gap: GAP,
};

/**
 * Nested orbits, each tilted a little further than the one inside it. `rotation` tilts the
 * major axis (negative = rising to the right, like the original rings); `direction` 1 = clockwise.
 * `wraps`: the near half passes in front of the cyborg (only the inner ring, whose near arc is
 * placed to cross the torso's lines steeply and mid-length); other rings run behind the figure.
 */
export const ORBITS = [
    { id: "inner", cx: AXIS, cy: 435.5, rx: 338, ry: 116.6, rotation: -25, strokeWidth: 6, period: 14, direction: 1, wraps: true },
    { id: "middle", cx: AXIS, cy: 405, rx: 400, ry: 176, rotation: -27, strokeWidth: 7, period: 23, direction: -1, wraps: false },
    { id: "outer", cx: AXIS, cy: 392, rx: 462, ry: 228, rotation: -32, strokeWidth: 8, period: 38, direction: 1, wraps: false },
];

export const RING_PAINT = {
    inner: { ends: "#06b6d4", body: "#2a2896" },
    middle: { ends: "#0e88a8", body: "#211f82" },
    outer: { ends: "#0891b2", body: "#1b1a74" },
};

/** `angle`: start position on the orbit's own circle (deg, 90 = nearest the viewer). */
export const PLANETS = [
    { id: "moon", orbit: "inner", angle: 15, r: 11, paint: "cyan" },
    { id: "planet", orbit: "middle", angle: 240, r: 16, paint: "indigo" },
    { id: "giant", orbit: "outer", angle: 185, r: 21, paint: "navy" },
];

export const PLANET_PAINT = {
    cyan: [
        { offset: 0, color: "#a5f3fc" },
        { offset: 0.45, color: "#22d3ee" },
        { offset: 1, color: "#0e7490" },
    ],
    indigo: [
        { offset: 0, color: "#818cf8" },
        { offset: 0.5, color: "#4338ca" },
        { offset: 1, color: "#1e1b6e" },
    ],
    navy: [
        { offset: 0, color: "#5468e0" },
        { offset: 0.5, color: "#22238a" },
        { offset: 1, color: "#10104c" },
    ],
};

/** A short light pulse travelling along one ring (animated mark only). */
export const HIGHLIGHT = {
    orbit: "outer",
    period: 9,
    direction: 1,
    layers: [
        { length: 0.12, color: "#22d3ee", opacity: 0.14 },
        { length: 0.05, color: "#22d3ee", opacity: 0.32 },
        { length: 0.014, color: "#cffafe", opacity: 0.9 },
    ],
};

/** Planets scale by 1 ± DEPTH·sin(angle): slightly larger on the near side. */
export const DEPTH = 0.06;

/** Restrained energy pulse: the mouth grille brightens a little and settles (animated mark only). */
export const PULSE = { color: "#ffc2cb", peak: 0.55, period: 5.2 };

/* ------------------------------------------------------------- derived data */

export function ellipsePoint(o, deg) {
    const t = rad(deg), p = rad(o.rotation);
    const x = o.rx * Math.cos(t), y = o.ry * Math.sin(t);
    return [o.cx + x * Math.cos(p) - y * Math.sin(p), o.cy + x * Math.sin(p) + y * Math.cos(p)];
}

/** Clockwise elliptical arc from t0 to t1 (degrees, t1 > t0, ≤ 360). */
function arcPath(o, t0, t1) {
    const steps = Math.ceil((t1 - t0) / 120);
    let d = `M${pt(ellipsePoint(o, t0))}`;
    for (let i = 1; i <= steps; i++) {
        const t = t0 + ((t1 - t0) * i) / steps;
        d += `A${f(o.rx)} ${f(o.ry)} ${f(o.rotation)} 0 1 ${pt(ellipsePoint(o, t))}`;
    }
    return d;
}

/** Half-plane on the near (front) or far (back) side of the orbit's major axis. */
function halfPlane(o, sign) {
    const p = rad(o.rotation), L = 2000;
    const ux = Math.cos(p), uy = Math.sin(p);
    const nx = -uy * sign, ny = ux * sign;
    const c = [o.cx, o.cy];
    const q = [
        [c[0] - L * ux, c[1] - L * uy],
        [c[0] + L * ux, c[1] + L * uy],
        [c[0] + L * ux + L * nx, c[1] + L * uy + L * ny],
        [c[0] - L * ux + L * nx, c[1] - L * uy + L * ny],
    ];
    return poly(q.map(([x, y]) => [Math.round(x), Math.round(y)])) + "Z";
}

const OVERLAP = 0.4;

/** Flattens the absolute M/L/H/V/A/Z subset used by the cyborg paths into polylines. */
function flatten(d) {
    const out = [];
    let cur = null, start = null, line = null;
    const tokens = d.match(/[MLHVAZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
    let i = 0, cmd = null;
    const num = () => Number(tokens[i++]);
    while (i < tokens.length) {
        if (/[A-Z]/i.test(tokens[i])) cmd = tokens[i++];
        if (cmd === "M") {
            cur = start = [num(), num()];
            line = [cur];
            out.push(line);
            cmd = "L";
        } else if (cmd === "L") {
            cur = [num(), num()];
            line.push(cur);
        } else if (cmd === "H") {
            cur = [num(), cur[1]];
            line.push(cur);
        } else if (cmd === "V") {
            cur = [cur[0], num()];
            line.push(cur);
        } else if (cmd === "A") {
            const r = num();
            num(); num();
            const large = num(), sweep = num();
            const end = [num(), num()];
            // centre of a circular arc from its endpoints (SVG F.6.5 with rx = ry, no rotation)
            const mxp = (cur[0] - end[0]) / 2, myp = (cur[1] - end[1]) / 2;
            const k = Math.sqrt(Math.max(0, (r * r - mxp * mxp - myp * myp) / (mxp * mxp + myp * myp))) * (large === sweep ? -1 : 1);
            const c = [k * myp + (cur[0] + end[0]) / 2, -k * mxp + (cur[1] + end[1]) / 2];
            const a0 = Math.atan2(cur[1] - c[1], cur[0] - c[0]);
            let da = Math.atan2(end[1] - c[1], end[0] - c[0]) - a0;
            if (sweep && da < 0) da += 2 * Math.PI;
            if (!sweep && da > 0) da -= 2 * Math.PI;
            const n = Math.max(2, Math.ceil(Math.abs(da) * r / 2));
            for (let s = 1; s <= n; s++) line.push([c[0] + r * Math.cos(a0 + (da * s) / n), c[1] + r * Math.sin(a0 + (da * s) / n)]);
            cur = end;
        } else if (cmd === "Z" || cmd === "z") {
            line.push(start);
            cur = start;
            cmd = null;
        } else {
            i++;
        }
    }
    return out;
}

function distToPolylines(p, lines) {
    let best = Infinity;
    for (const pl of lines) {
        for (let k = 1; k < pl.length; k++) {
            const [ax, ay] = pl[k - 1], [bx, by] = pl[k];
            const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len));
            best = Math.min(best, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy));
        }
    }
    return best;
}

function insidePolygon(p, poly) {
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        const [xa, ya] = poly[a], [xb, yb] = poly[b];
        if (ya > p[1] !== yb > p[1] && p[0] < ((xb - xa) * (p[1] - ya)) / (yb - ya) + xa) inside = !inside;
    }
    return inside;
}

/**
 * Rings behind the cyborg are masked by the head (solid) and by the torso lines (with a gap).
 * Where a ring threads a narrow window between two masked lines, only a crumb would show:
 * returns ring arcs covering every visible run shorter than `minRun`, to be erased too.
 */
function backRingCrumbs(o, minRun = 22) {
    const reach = STROKE / 2 + GAP;
    const head = flatten(CYBORG.headSilhouette);
    const solids = flatten(CYBORG.solids);
    const torso = flatten(CYBORG.torso);
    const hidden = (p) =>
        [head[0], ...solids].some((s) => insidePolygon(p, s)) ||
        distToPolylines(p, head) <= reach ||
        distToPolylines(p, solids) <= reach ||
        distToPolylines(p, torso) <= reach;
    const step = 0.1;
    const visible = [];
    for (let t = 0; t < 360; t += step) {
        // a wrapping ring's near half is drawn in front, unmasked
        if (o.wraps && t <= 180) {
            visible.push(false);
            continue;
        }
        const [x, y] = ellipsePoint(o, t);
        const [x2, y2] = ellipsePoint(o, t + 0.01);
        const len = Math.hypot(x2 - x, y2 - y);
        const nx = -(y2 - y) / len, ny = (x2 - x) / len;
        visible.push(
            [-0.5, 0, 0.5].some((s) => {
                return !hidden([x + nx * s * o.strokeWidth, y + ny * s * o.strokeWidth]);
            })
        );
    }
    const runs = [];
    let from = null;
    for (let k = 0; k <= visible.length; k++) {
        const v = k < visible.length && visible[k];
        if (v && from === null) from = k;
        if (!v && from !== null) {
            runs.push([from * step, k * step]);
            from = null;
        }
    }
    // a run touching both ends of the sweep is one run across 0°
    if (runs.length > 1 && runs[0][0] === 0 && runs[runs.length - 1][1] >= 360 - step) {
        const last = runs.pop();
        runs[0] = [last[0] - 360, runs[0][1]];
    }
    const arcLength = (a, b) => {
        let s = 0, prev = ellipsePoint(o, a);
        for (let t = a + 0.5; t <= b; t += 0.5) {
            const p = ellipsePoint(o, t);
            s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
            prev = p;
        }
        return s;
    };
    return runs
        .filter(([a, b]) => arcLength(a, b) < minRun)
        .map(([a, b]) => arcPath(o, a - 1, b + 1))
        .join("");
}

export function orbitGeometry(o) {
    const left = ellipsePoint(o, 180), right = ellipsePoint(o, 0);
    return {
        ...o,
        full: arcPath(o, 0, 360) + "Z",
        front: arcPath(o, -OVERLAP, 180 + OVERLAP),
        back: arcPath(o, 180 - OVERLAP, 360 + OVERLAP),
        frontClip: halfPlane(o, 1),
        backClip: halfPlane(o, -1),
        crumbs: backRingCrumbs(o),
        paint: { x1: f(left[0]), y1: f(left[1]), x2: f(right[0]), y2: f(right[1]), ...RING_PAINT[o.id] },
    };
}

/**
 * Everything the animation can ever cover: each ring's bounding box grown by its widest planet
 * (at near-side scale) or half its stroke. The 921 × 725 frame is centred on that box.
 */
function centredViewBox() {
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const o of ORBITS) {
        const p = rad(o.rotation);
        const w = Math.hypot(o.rx * Math.cos(p), o.ry * Math.sin(p));
        const h = Math.hypot(o.rx * Math.sin(p), o.ry * Math.cos(p));
        const grow = Math.max(o.strokeWidth / 2, ...PLANETS.filter((pl) => pl.orbit === o.id).map((pl) => pl.r * (1 + DEPTH)));
        box[0] = Math.min(box[0], o.cx - w - grow);
        box[1] = Math.min(box[1], o.cy - h - grow);
        box[2] = Math.max(box[2], o.cx + w + grow);
        box[3] = Math.max(box[3], o.cy + h + grow);
    }
    const half = (v) => Math.round(v * 2) / 2;
    return { x: half((box[0] + box[2]) / 2 - W / 2), y: half((box[1] + box[3]) / 2 - H / 2), width: W, height: H };
}

export function buildArt() {
    return {
        viewBox: centredViewBox(),
        cyborg: CYBORG,
        orbits: ORBITS.map(orbitGeometry),
        planets: PLANETS,
        planetPaint: PLANET_PAINT,
        highlight: HIGHLIGHT,
        pulse: PULSE,
        depth: DEPTH,
    };
}

/* ----------------------------------------------------------------- SVG output */

const TITLE = "Capri Web Services";
const DESC = "Cyber Odyssey mark: a red cyborg in a visored helmet, circled by three tilted orbits, each carrying a planet.";

const ringGradient = (id, o) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${o.paint.x1}" y1="${o.paint.y1}" x2="${o.paint.x2}" y2="${o.paint.y2}">` +
    `<stop offset="0" stop-color="${o.paint.ends}"/><stop offset=".3" stop-color="${o.paint.body}"/>` +
    `<stop offset=".7" stop-color="${o.paint.body}"/><stop offset="1" stop-color="${o.paint.ends}"/></linearGradient>`;

const planetGradient = (id, stops) =>
    `<radialGradient id="${id}" cx=".36" cy=".32" r=".75">` +
    stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("") +
    `</radialGradient>`;

const frame = (o) => `translate(${f(o.cx)} ${f(o.cy)}) rotate(${f(o.rotation)}) scale(${f(o.rx)} ${f(o.ry)})`;
const unframe = (o, angle) => `rotate(${f(-angle)}) scale(${f(1 / o.rx, 7)} ${f(1 / o.ry, 7)}) rotate(${f(-o.rotation)})`;

/** Negative animation delay (fraction of a period) placing a 0→360° keyframe at `angle`. */
export function phase(angle, direction) {
    const a = ((angle % 360) + 360) % 360;
    return direction > 0 ? a / 360 : ((360 - a) % 360) / 360;
}

function depthKeyframes(name, k) {
    const frames = [];
    for (let i = 0; i <= 24; i++) {
        const s = Math.sin((i / 24) * 2 * Math.PI);
        frames.push(`${f((i / 24) * 100, 3)}%{transform:scale(${f(1 + k * s, 4)})}`);
    }
    return `@keyframes ${name}{${frames.join("")}}`;
}

function animatedCss(art) {
    const rules = [
        ".co-a{transform-box:view-box;transform-origin:0 0}",
        "@keyframes co-spin{to{transform:rotate(360deg)}}",
        depthKeyframes("co-depth", art.depth),
    ];
    for (const o of art.orbits) {
        const dir = o.direction > 0 ? "normal" : "reverse";
        const inv = o.direction > 0 ? "reverse" : "normal";
        rules.push(`.co-${o.id}{animation:co-spin ${o.period}s linear infinite ${dir}}`);
        rules.push(`.co-${o.id}-c{animation:co-spin ${o.period}s linear infinite ${inv}}`);
    }
    const h = art.highlight;
    const lead = Math.max(...h.layers.map((l) => l.length));
    h.layers.forEach((l, i) => {
        // every layer shares its leading edge; dashoffset falls so the light runs along the path
        const from = (l.length - lead) * 1000;
        const sign = h.direction > 0 ? -1 : 1;
        rules.push(`@keyframes co-hl-${i}{from{stroke-dashoffset:${f(from)}}to{stroke-dashoffset:${f(from + sign * 1000)}}}`);
        rules.push(`.co-hl-${i}{animation:co-hl-${i} ${h.period}s linear infinite}`);
    });
    const p = art.pulse;
    rules.push(`@keyframes co-pulse{0%,100%{opacity:0}50%{opacity:${p.peak}}}`);
    rules.push(`.co-pulse{opacity:0;animation:co-pulse ${p.period}s ease-in-out infinite}`);
    // paused rather than removed: every part holds its first frame, which is the static logo
    rules.push(
        "@media (prefers-reduced-motion:reduce){.co-a,.co-hl,.co-pulse{animation-play-state:paused!important}.co-hl{display:none}}"
    );
    return rules.join("\n");
}

function planetMarkup(art, p, animated) {
    const o = art.orbits.find((x) => x.id === p.orbit);
    const fill = `url(#co-planet-${p.paint})`;
    if (!animated) {
        const [x, y] = ellipsePoint(o, p.angle);
        const s = 1 + art.depth * Math.sin(rad(p.angle));
        return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(p.r * s)}" fill="${fill}"/>`;
    }
    const delay = -phase(p.angle, o.direction) * o.period;
    const dir = o.direction > 0 ? "normal" : "reverse";
    return (
        `<g transform="${frame(o)}"><g class="co-a co-${o.id}"><g transform="rotate(${f(p.angle)}) translate(1 0)">` +
        `<g class="co-a co-${o.id}-c"><g transform="${unframe(o, p.angle)}">` +
        `<g class="co-a" style="animation:co-depth ${o.period}s linear ${f(delay, 3)}s infinite ${dir}">` +
        `<circle r="${f(p.r)}" fill="${fill}"/></g></g></g></g></g></g>`
    );
}

function highlightMarkup(art) {
    const h = art.highlight;
    const o = art.orbits.find((x) => x.id === h.orbit);
    return h.layers
        .map(
            (l, i) =>
                `<path class="co-hl co-hl-${i}" d="${o.full}" pathLength="1000" fill="none" stroke="${l.color}" stroke-opacity="${l.opacity}" ` +
                `stroke-width="${o.strokeWidth}" stroke-dasharray="${f(l.length * 1000)} ${f(1000 - l.length * 1000)}"/>`
        )
        .join("");
}

export function buildSvg(art, { animated }) {
    const { x: VX, y: VY, width: VW, height: VH } = art.viewBox;
    const region = `x="${VX}" y="${VY}" width="${VW}" height="${VH}"`;
    const c = art.cyborg;
    const defs = [];
    defs.push(
        `<linearGradient id="co-cyborg-paint" gradientUnits="userSpaceOnUse" x1="0" y1="${c.gradient.y1}" x2="0" y2="${c.gradient.y2}">` +
            c.gradient.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("") +
            `</linearGradient>`
    );
    for (const o of art.orbits) defs.push(ringGradient(`co-ring-${o.id}`, o));
    const paints = [...new Set(art.planets.map((p) => p.paint))];
    for (const k of paints) defs.push(planetGradient(`co-planet-${k}`, art.planetPaint[k]));
    defs.push(
        `<mask id="co-behind" maskUnits="userSpaceOnUse" ${region}>` +
            `<rect ${region} fill="#fff"/>` +
            `<g fill="none" stroke="#000" stroke-width="${c.stroke + 2 * c.gap}">` +
            `<path d="${c.headSilhouette}${c.solids}" fill="#000" stroke-linejoin="round"/>` +
            `<path d="${c.torso}" stroke-linejoin="round"/>` +
            art.orbits
                .filter((o) => o.crumbs)
                .map((o) => `<path d="${o.crumbs}" stroke-width="${o.strokeWidth + 2}"/>`)
                .join("") +
            `</g></mask>`
    );
    defs.push(
        `<mask id="co-knockout" maskUnits="userSpaceOnUse" ${region}>` +
            `<rect ${region} fill="#fff"/>` +
            art.orbits
                .filter((o) => o.wraps)
                .map((o) => `<path d="${o.front}" fill="none" stroke="#000" stroke-width="${o.strokeWidth + 2 * c.gap}"/>`)
                .join("") +
            `</mask>`
    );
    if (animated) {
        for (const o of art.orbits.filter((x) => x.wraps)) {
            defs.push(`<clipPath id="co-clip-front-${o.id}"><path d="${o.frontClip}"/></clipPath>`);
            defs.push(`<clipPath id="co-clip-back-${o.id}"><path d="${o.backClip}"/></clipPath>`);
        }
    }

    const hl = art.highlight;
    const layer = (which) => {
        const order = which === "back" ? [...art.orbits].reverse() : art.orbits;
        return order
            .filter((o) => o.wraps || which === "back")
            .map((o) => {
                const d = o.wraps ? o[which] : o.full;
                const ring = `<path d="${d}" fill="none" stroke="url(#co-ring-${o.id})" stroke-width="${o.strokeWidth}"/>`;
                const planets = art.planets.filter((p) => p.orbit === o.id);
                let movers = "";
                if (animated) {
                    movers = planets.map((p) => planetMarkup(art, p, true)).join("") + (hl.orbit === o.id ? highlightMarkup(art) : "");
                    if (movers && o.wraps) movers = `<g clip-path="url(#co-clip-${which}-${o.id})">${movers}</g>`;
                } else {
                    movers = planets
                        .filter((p) => !o.wraps || (Math.sin(rad(p.angle)) >= 0) === (which === "front"))
                        .map((p) => planetMarkup(art, p, false))
                        .join("");
                }
                return `<g id="co-${which}-${o.id}">${ring}${movers}</g>`;
            })
            .join("");
    };

    const cyborg =
        `<g id="co-cyborg" mask="url(#co-knockout)" fill="none" stroke="url(#co-cyborg-paint)" stroke-width="${c.stroke}">` +
        `<path d="${c.dome}" stroke-linejoin="round"/>` +
        `<path d="${c.head}${c.torso}" stroke-miterlimit="4"/>` +
        `<path d="${c.fill}" fill="url(#co-cyborg-paint)" stroke="none"/>` +
        (animated ? `<path class="co-pulse" d="${c.fill}" fill="${art.pulse.color}" stroke="none"/>` : "") +
        `</g>`;

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VX} ${VY} ${VW} ${VH}" width="${VW}" height="${VH}" role="img" aria-labelledby="co-title co-desc">\n` +
        `<title id="co-title">${TITLE}</title>\n<desc id="co-desc">${DESC}</desc>\n` +
        (animated ? `<style>\n${animatedCss(art)}\n</style>\n` : "") +
        `<defs>\n${defs.join("\n")}\n</defs>\n` +
        `<g id="co-back" mask="url(#co-behind)">${layer("back")}</g>\n` +
        `${cyborg}\n` +
        `<g id="co-front">${layer("front")}</g>\n` +
        `</svg>\n`
    );
}

/* ------------------------------------------------------------------- TS output */

function buildTs(art) {
    return `/**
 * GENERATED by scripts/build-cyber-odyssey-vector.mjs — do not edit by hand.
 * Fully vector Cyber Odyssey artwork in the original logo's ${W} × ${H} space.
 * Orbit/planet angles are degrees on the orbit's own circle (before the ellipse projection),
 * so rotating that circle moves a point along the projected ellipse; 90° is nearest the viewer.
 */

export type OrbitId = "inner" | "middle" | "outer";
export type GradientStop = { offset: number; color: string };

export type OrbitArt = {
    id: OrbitId;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    rotation: number;
    strokeWidth: number;
    /** Seconds per revolution at speed 1. */
    period: number;
    /** 1 = clockwise, -1 = counter-clockwise. */
    direction: 1 | -1;
    /** true: the near half passes in front of the cyborg; false: the whole ring runs behind it. */
    wraps: boolean;
    /** Whole ellipse, starting at the right end of the major axis and running clockwise. */
    full: string;
    /** Near half (drawn over the cyborg) and far half (masked by its silhouette). */
    front: string;
    back: string;
    /** Half-planes either side of the major axis, for clipping moving parts. */
    frontClip: string;
    backClip: string;
    /** Arcs where the ring would only show a crumb between two masked lines; masked as well. */
    crumbs: string;
    paint: { x1: string; y1: string; x2: string; y2: string; ends: string; body: string };
};

export type PlanetArt = {
    id: string;
    orbit: OrbitId;
    angle: number;
    r: number;
    paint: "cyan" | "indigo" | "navy";
};

export const CYBER_ODYSSEY_ART = ${JSON.stringify(art, null, 4)} as const satisfies {
    viewBox: { x: number; y: number; width: number; height: number };
    cyborg: {
        stroke: number;
        gradient: { y1: number; y2: number; stops: readonly GradientStop[] };
        dome: string;
        head: string;
        torso: string;
        fill: string;
        headSilhouette: string;
        solids: string;
        gap: number;
    };
    orbits: readonly OrbitArt[];
    planets: readonly PlanetArt[];
    planetPaint: Record<PlanetArt["paint"], readonly GradientStop[]>;
    highlight: {
        orbit: OrbitId;
        period: number;
        direction: 1 | -1;
        layers: readonly { length: number; color: string; opacity: number }[];
    };
    pulse: { color: string; peak: number; period: number };
    depth: number;
};

/** Public URLs of the optional standalone SVG files (copy assets/generated/*.svg there). */
export const CYBER_ODYSSEY_ASSETS = {
    logo: "/branding/cyber-odyssey/capri-web-services-logo.svg",
    orbital: "/branding/cyber-odyssey/cyber-odyssey-orbital.svg",
} as const;
`;
}

/* ----------------------------------------------------------------------- main */

export function buildOutputs() {
    const art = buildArt();
    return {
        "assets/generated/capri-web-services-logo.svg": buildSvg(art, { animated: false }),
        "assets/generated/cyber-odyssey-orbital.svg": buildSvg(art, { animated: true }),
        "component/cyberOdysseyArt.ts": buildTs(art),
    };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const check = process.argv.includes("--check");
    let stale = 0;
    for (const [rel, content] of Object.entries(buildOutputs())) {
        const file = path.join(root, rel);
        const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
        if (current === content) continue;
        if (check) {
            console.error(`stale: ${rel}`);
            stale++;
        } else {
            fs.writeFileSync(file, content);
            console.log(`wrote ${rel} (${Buffer.byteLength(content)} bytes)`);
        }
    }
    if (check && stale) process.exit(1);
    if (check) console.log("vector outputs are up to date");
}
