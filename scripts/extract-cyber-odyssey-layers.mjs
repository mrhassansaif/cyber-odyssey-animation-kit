/**
 * Separates the flattened Cyber Odyssey logo into independently animatable layers.
 *
 * Portable kit usage (from kit root):
 *   node scripts/extract-cyber-odyssey-layers.mjs
 *
 * Requires: sharp (see scripts/README.md). Install once in this folder:
 *   cd scripts && npm install
 *
 * Source of truth (never modified): assets/original/CapriWebServices-Logo.png
 *
 * Outputs
 *   assets/generated/cyborg.png
 *   assets/generated/cyborg-sm.png
 *   assets/generated/cyborg-glow.png
 *   assets/generated/orbits.svg
 *   assets/generated/cyber-odyssey-orbital.svg
 *   component/cyberOdysseyArt.ts
 *   scripts/cyber-odyssey-measurements.json
 *
 * Validation renders are written to the OS temp directory (cyber-odyssey-validation/).
 *
 * NOTE: Asset URL paths written into cyberOdysseyArt.ts remain
 * `/branding/cyber-odyssey/...` so integrators can drop generated files into a
 * project's `public/branding/cyber-odyssey/` (or equivalent) without editing the component.
 */
import sharp from "sharp";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { RINGS, PLANETS as PLANET_SEEDS, SOURCE_SIZE } from "./cyber-odyssey-geometry.mjs";
import { buildOrbitalSvg } from "./cyber-odyssey-svg.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "assets", "original", "CapriWebServices-Logo.png");
const OUT_DIR = path.join(root, "assets", "generated");
const DATA_TS = path.join(root, "component", "cyberOdysseyArt.ts");
const REPORT = path.join(root, "scripts", "cyber-odyssey-measurements.json");
const VAL_DIR = path.join(os.tmpdir(), "cyber-odyssey-validation");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(VAL_DIR, { recursive: true });

const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const srcHashBefore = sha(SRC);

const { data: src, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const N = W * H;
if (W !== SOURCE_SIZE.width || H !== SOURCE_SIZE.height) throw new Error(`Unexpected source size ${W}x${H}`);

/* ------------------------------------------------------------------ helpers */

const A = (i) => src[i * 4 + 3];
const Rc = (i) => src[i * 4];
function sampleBilinear(buf, x, y, ch) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const g = (xx, yy) => {
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) return 0;
        return buf[(yy * W + xx) * 4 + ch];
    };
    return (
        g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) +
        g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy
    );
}
const pxAt = (x, y) => {
    const i = (Math.round(y) * W + Math.round(x)) * 4;
    return [src[i], src[i + 1], src[i + 2], src[i + 3]];
};

function local(R, x, y) {
    const c = Math.cos(R.theta), s = Math.sin(R.theta);
    const dx = x - R.cx, dy = y - R.cy;
    return [c * dx + s * dy, -s * dx + c * dy];
}
function sampson(R, x, y) {
    const [u, v] = local(R, x, y);
    const F = (u * u) / (R.a * R.a) + (v * v) / (R.b * R.b) - 1;
    return F / Math.hypot((2 * u) / (R.a * R.a), (2 * v) / (R.b * R.b));
}
function ellipsePoint(R, t, rho = 1) {
    const c = Math.cos(R.theta), s = Math.sin(R.theta);
    const u = rho * R.a * Math.cos(t), v = rho * R.b * Math.sin(t);
    return [R.cx + c * u - s * v, R.cy + s * u + c * v];
}
function ellipseNormal(R, t) {
    const [x1, y1] = ellipsePoint(R, t - 1e-4);
    const [x2, y2] = ellipsePoint(R, t + 1e-4);
    const l = Math.hypot(x2 - x1, y2 - y1);
    return [-(y2 - y1) / l, (x2 - x1) / l];
}
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

function distanceTransform(mask) {
    // chamfer distance from every set pixel to the nearest unset pixel
    const INF = 1e9, d = new Float32Array(N), D = Math.SQRT2;
    for (let i = 0; i < N; i++) d[i] = mask[i] ? INF : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (!d[i]) continue; let v = d[i];
        if (x > 0) v = Math.min(v, d[i - 1] + 1);
        if (y > 0) v = Math.min(v, d[i - W] + 1);
        if (x > 0 && y > 0) v = Math.min(v, d[i - W - 1] + D);
        if (x < W - 1 && y > 0) v = Math.min(v, d[i - W + 1] + D);
        d[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
        const i = y * W + x; if (!d[i]) continue; let v = d[i];
        if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
        if (y < H - 1) v = Math.min(v, d[i + W] + 1);
        if (x < W - 1 && y < H - 1) v = Math.min(v, d[i + W + 1] + D);
        if (x > 0 && y < H - 1) v = Math.min(v, d[i + W - 1] + D);
        d[i] = v;
    }
    return d;
}
const invert = (m) => m.map((v) => (v ? 0 : 1));
function dilate(mask, r) { const d = distanceTransform(invert(mask)); return d.map((v) => (v <= r ? 1 : 0)); }
function erode(mask, r) { const d = distanceTransform(mask); return d.map((v) => (v > r ? 1 : 0)); }

function fillHoles(ink, roi) {
    // holes = non-ink ROI pixels not 4-connected to the ROI boundary
    const reached = new Uint8Array(N);
    const stack = [];
    for (let i = 0; i < N; i++) {
        if (!roi[i] || ink[i]) continue;
        const x = i % W, y = (i / W) | 0;
        const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
            !roi[i - 1] || !roi[i + 1] || !roi[i - W] || !roi[i + W];
        if (edge) { reached[i] = 1; stack.push(i); }
    }
    while (stack.length) {
        const i = stack.pop(); const x = i % W, y = (i / W) | 0;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
            if (j < 0 || reached[j] || !roi[j] || ink[j]) continue;
            reached[j] = 1; stack.push(j);
        }
    }
    const out = new Uint8Array(N);
    for (let i = 0; i < N; i++) out[i] = roi[i] && (ink[i] || !reached[i]) ? 1 : 0;
    return out;
}

/* ------------------------------------------------------- 1. planet refinement */

const outer = RINGS.find((r) => r.id === "outer");
const planets = PLANET_SEEDS.map((seed) => {
    const [u, v] = local(outer, seed.x, seed.y);
    const t = Math.atan2(v / outer.b, u / outer.a);
    const [nx, ny] = ellipseNormal(outer, t);
    const tangentAngle = Math.atan2(nx, -ny); // tangent = rotate normal by -90°
    const pts = [];
    for (let ad = 0; ad < 360; ad += 2) {
        const ang = rad(ad);
        // skip rays that run along the orbit stroke attached to the planet
        const diff = Math.abs(((ang - tangentAngle + Math.PI * 3) % Math.PI) - Math.PI / 2);
        if (Math.PI / 2 - diff < rad(42)) continue;
        const dx = Math.cos(ang), dy = Math.sin(ang);
        let prev = sampleBilinear(src, seed.x + dx * 18, seed.y + dy * 18, 3);
        for (let r = 18.25; r < 48; r += 0.25) {
            const a = sampleBilinear(src, seed.x + dx * r, seed.y + dy * r, 3);
            if (prev >= 128 && a < 128) {
                const rr = r - 0.25 + (0.25 * (prev - 128)) / (prev - a);
                pts.push([seed.x + dx * rr, seed.y + dy * rr]);
                break;
            }
            prev = a;
        }
    }
    // Kåsa algebraic circle fit
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
    for (const [x, y] of pts) { const z = x * x + y * y; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z; }
    const n = pts.length;
    const M = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]];
    const bvec = [-sxz, -syz, -sz];
    const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const d0 = det3(M);
    const solve = (k) => det3(M.map((row, i) => row.map((v, j) => (j === k ? bvec[i] : v)))) / d0;
    const D = solve(0), E = solve(1), F = solve(2);
    const cx = -D / 2, cy = -E / 2, r = Math.sqrt(cx * cx + cy * cy - F);
    const resid = Math.sqrt(pts.reduce((s, [x, y]) => s + (Math.hypot(x - cx, y - cy) - r) ** 2, 0) / n);
    const [pu, pv] = local(outer, cx, cy);
    const pt = Math.atan2(pv / outer.b, pu / outer.a);
    const rho = Math.hypot(pu / outer.a, pv / outer.b);
    // planet fill colour (interior, away from edge)
    const cols = [];
    for (let yy = -r * 0.6; yy <= r * 0.6; yy += 2) for (let xx = -r * 0.6; xx <= r * 0.6; xx += 2) {
        if (Math.hypot(xx, yy) > r * 0.6) continue;
        const p = pxAt(cx + xx, cy + yy); if (p[3] > 240) cols.push(p);
    }
    const color = [0, 1, 2].map((k) => cols.reduce((s, p) => s + p[k], 0) / cols.length);
    return { cx, cy, r, edgeResidual: resid, edgeSamples: n, t: pt, rho, color };
});

/* --------------------------------------------- 2. stroke width + colour samples */

function ringSamples(R) {
    const samples = [];
    for (let d = -180; d < 180; d += 1) {
        const t = rad(d);
        const [x, y] = ellipsePoint(R, t);
        if (planets.some((p) => Math.hypot(x - p.cx, y - p.cy) < p.r + 12)) continue;
        const c = pxAt(x, y);
        if (!(c[3] > 230 && c[0] <= 14 && c[2] > c[0] + 12)) continue; // hidden or not ring ink
        const [nx, ny] = ellipseNormal(R, t);
        let area = 0, moment = 0;
        for (let o = -14; o <= 14; o += 0.25) {
            const a = sampleBilinear(src, x + nx * o, y + ny * o, 3) / 255;
            const r = sampleBilinear(src, x + nx * o, y + ny * o, 0);
            if (r > 40) { area = NaN; break; } // touches a red cyborg stroke — skip for width
            area += a * 0.25; moment += a * o * 0.25;
        }
        const col = [0, 0, 0]; let k = 0;
        for (let o = -4; o <= 4; o += 1) {
            const p = pxAt(x + nx * o, y + ny * o);
            if (p[3] > 240) { col[0] += p[0]; col[1] += p[1]; col[2] += p[2]; k++; }
        }
        samples.push({ t, deg: d, width: area, offset: moment / area, color: col.map((v) => v / k) });
    }
    return samples;
}

const median = (arr) => { const s = arr.filter(Number.isFinite).sort((a, b) => a - b); return s[s.length >> 1]; };

function fitTone(R, samples) {
    const cols = samples.map((s) => s.color);
    const lum = (c) => c[1] + c[2];
    const sorted = [...cols].sort((a, b) => lum(a) - lum(b));
    const darkest = sorted.slice(0, Math.max(5, Math.floor(sorted.length * 0.3)));
    const base = [0, 1, 2].map((k) => darkest.reduce((s, c) => s + c[k], 0) / darkest.length);
    const strength = samples.map((s) => Math.hypot(s.color[0] - base[0], s.color[1] - base[1], s.color[2] - base[2]));
    const maxS = Math.max(...strength);
    // A uniform stroke only shows antialiasing noise; treat it as a solid colour.
    const p90 = [...strength].sort((a, b) => a - b)[Math.floor(strength.length * 0.9)];
    if (p90 < 12) {
        const all = [0, 1, 2].map((k) => median(cols.map((c) => c[k])));
        return { base: all, lobes: [] };
    }
    // two lobes: split the circle at the orientation that best separates mass
    let bestSplit = 0, bestScore = -1;
    for (let sd = 0; sd < 180; sd += 1) {
        const ax = rad(sd);
        let m1x = 0, m1y = 0, m2x = 0, m2y = 0;
        samples.forEach((s, i) => {
            const w = strength[i];
            const side = Math.cos(s.t - ax) >= 0;
            if (side) { m1x += w * Math.cos(s.t); m1y += w * Math.sin(s.t); }
            else { m2x += w * Math.cos(s.t); m2y += w * Math.sin(s.t); }
        });
        const score = Math.hypot(m1x, m1y) + Math.hypot(m2x, m2y);
        if (score > bestScore) { bestScore = score; bestSplit = ax; }
    }
    const lobes = [];
    for (const sign of [1, -1]) {
        let mx = 0, my = 0;
        samples.forEach((s, i) => {
            if (sign * Math.cos(s.t - bestSplit) < 0) return;
            const w = Math.max(0, strength[i] - 0.15 * maxS);
            mx += w * Math.cos(s.t); my += w * Math.sin(s.t);
        });
        const phi = Math.atan2(my, mx);
        // profile along p = cos(t - phi) in bins, both flanks averaged
        const bins = [];
        for (let p0 = -0.1; p0 < 1.0001; p0 += 0.05) {
            const inBin = samples.filter((s) => {
                const p = Math.cos(s.t - phi);
                const onThisLobeSide = sign * Math.cos(s.t - bestSplit) >= -0.05;
                return onThisLobeSide && p >= p0 - 0.025 && p < p0 + 0.025;
            });
            if (inBin.length < 2) continue;
            const c = [0, 1, 2].map((k) => inBin.reduce((s, q) => s + q.color[k], 0) / inBin.length);
            bins.push({ p: Math.min(1, p0), color: c, strength: Math.hypot(c[0] - base[0], c[1] - base[1], c[2] - base[2]) });
        }
        // start the lobe where it departs from the base colour
        const startIdx = bins.findIndex((b) => b.strength > 0.06 * maxS);
        const used = bins.slice(Math.max(0, startIdx - 1));
        const stops = used.map((b, i) => ({
            offset: (b.p + 1) / 2,
            color: i === 0 ? base : b.color,
        }));
        lobes.push({ phi, stops });
    }
    return { base, lobes, separationDeg: Math.abs(deg(((lobes[0].phi - lobes[1].phi + 3 * Math.PI) % (2 * Math.PI)) - Math.PI)) };
}

function toneAt(tone, t) {
    let c = tone.base.slice();
    for (const lobe of tone.lobes) {
        const p = Math.cos(t - lobe.phi);
        const off = (p + 1) / 2;
        const s = lobe.stops;
        if (off < s[0].offset) continue;
        let k = s.length - 1;
        for (let i = 0; i < s.length - 1; i++) if (off <= s[i + 1].offset) { k = i; break; }
        if (k === s.length - 1) { c = s[k].color.slice(); continue; }
        const f = (off - s[k].offset) / (s[k + 1].offset - s[k].offset);
        c = [0, 1, 2].map((j) => s[k].color[j] * (1 - f) + s[k + 1].color[j] * f);
    }
    return c;
}

const ringData = RINGS.map((R) => {
    const samples = ringSamples(R);
    const width = median(samples.map((s) => s.width));
    const centreBias = median(samples.map((s) => s.offset));
    const tone = fitTone(R, samples);
    const toneErr = samples.map((s) => { const m = toneAt(tone, s.t); return Math.hypot(m[0] - s.color[0], m[1] - s.color[1], m[2] - s.color[2]); });
    return { R, samples, width, centreBias, tone, toneRms: Math.sqrt(toneErr.reduce((a, b) => a + b * b, 0) / toneErr.length), toneMax: Math.max(...toneErr) };
});
const STROKE = median(ringData.map((r) => r.width));
const HW = STROKE / 2;

/* ------------------------------ 2b. hand-drawn deviation from the fitted ellipse */

// The rings are not perfect ellipses; model the measured centreline offset (along the inward
// normal) as a low-order Fourier series so both removal and the vector strokes follow the art.
const FOURIER_K = 4;
function solveLinear(M, b) {
    const n = b.length, A2 = M.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
        let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A2[r][c]) > Math.abs(A2[p][c])) p = r;
        [A2[c], A2[p]] = [A2[p], A2[c]];
        for (let r = 0; r < n; r++) {
            if (r === c) continue;
            const k = A2[r][c] / A2[c][c];
            for (let j = c; j <= n; j++) A2[r][j] -= k * A2[c][j];
        }
    }
    return A2.map((r, i) => r[n] / r[i]);
}
const basis = (t) => { const v = [1]; for (let k = 1; k <= FOURIER_K; k++) v.push(Math.cos(k * t), Math.sin(k * t)); return v; };
for (const rd of ringData) {
    const pts = rd.samples.filter((s) => Number.isFinite(s.offset));
    const n = 2 * FOURIER_K + 1;
    const M = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
    for (const s of pts) {
        const v = basis(s.t);
        for (let i = 0; i < n; i++) { b[i] += v[i] * s.offset; for (let j = 0; j < n; j++) M[i][j] += v[i] * v[j]; }
    }
    for (let i = 1; i < n; i++) M[i][i] += pts.length * 0.002; // light ridge keeps hidden spans tame
    const coef = solveLinear(M, b);
    rd.offsetAt = (t) => basis(t).reduce((s, v, i) => s + v * coef[i], 0);
    const res = pts.map((s) => s.offset - rd.offsetAt(s.t));
    rd.offsetResidualRms = Math.sqrt(res.reduce((a, r) => a + r * r, 0) / res.length);
    let mx = 0; for (let d = 0; d < 360; d++) mx = Math.max(mx, Math.abs(rd.offsetAt(rad(d))));
    rd.offsetMax = mx;
    rd.rawOffsetMax = Math.max(...pts.map((s) => Math.abs(s.offset)));
}
const paramAngle = (R, x, y) => { const [u, v] = local(R, x, y); return Math.atan2(v / R.b, u / R.a); };
// signed distance to the measured centreline (positive = outside)
const ringDist = (rd, x, y) => sampson(rd.R, x, y) + rd.offsetAt(paramAngle(rd.R, x, y));
function centrelinePoint(rd, t) {
    const [x, y] = ellipsePoint(rd.R, t);
    const [nx, ny] = ellipseNormal(rd.R, t);
    const o = rd.offsetAt(t);
    return [x + nx * o, y + ny * o];
}
function centrelinePath(rd, segments = 96) {
    // closed Catmull-Rom spline through the centreline, emitted as cubic Béziers (SVG coordinates)
    const P = Array.from({ length: segments }, (_, k) => centrelinePoint(rd, (2 * Math.PI * k) / segments).map((v) => v + 0.5));
    const q = (v) => v.toFixed(2);
    let d = `M${q(P[0][0])} ${q(P[0][1])}`;
    for (let k = 0; k < segments; k++) {
        const p0 = P[(k - 1 + segments) % segments], p1 = P[k], p2 = P[(k + 1) % segments], p3 = P[(k + 2) % segments];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += `C${q(c1[0])} ${q(c1[1])} ${q(c2[0])} ${q(c2[1])} ${q(p2[0])} ${q(p2[1])}`;
    }
    let length = 0;
    for (let k = 0; k < 720; k++) {
        const [x1, y1] = centrelinePoint(rd, (2 * Math.PI * k) / 720), [x2, y2] = centrelinePoint(rd, (2 * Math.PI * (k + 1)) / 720);
        length += Math.hypot(x2 - x1, y2 - y1);
    }
    return { d: d + "Z", length };
}

/* -------------------------------------------- 3. zones, silhouette and removal */

const bandDist = new Float32Array(N);
const planetDist = new Float32Array(N);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    let bd = 1e9; for (const rd of ringData) bd = Math.min(bd, Math.abs(ringDist(rd, x, y)));
    bandDist[i] = bd;
    let pd = 1e9; for (const p of planets) pd = Math.min(pd, Math.hypot(x - p.cx, y - p.cy) - p.r);
    planetDist[i] = pd;
}
const inZone = (i, extra) => bandDist[i] <= HW + extra || planetDist[i] <= extra;

// common orbital axis (back half = far side of the orbital plane)
const AX = { cx: RINGS.reduce((s, r) => s + r.cx, 0) / 3, cy: RINGS.reduce((s, r) => s + r.cy, 0) / 3, theta: RINGS.reduce((s, r) => s + r.theta, 0) / 3 };
const isBackHalf = (x, y) => -Math.sin(AX.theta) * (x - AX.cx) + Math.cos(AX.theta) * (y - AX.cy) < 0;

// head region of interest (excludes neck and shoulders)
const ROI_BOX = { x0: 296, y0: 60, x1: 612, y1: 446 };
const roi = new Uint8Array(N);
for (let y = ROI_BOX.y0; y <= ROI_BOX.y1; y++) for (let x = ROI_BOX.x0; x <= ROI_BOX.x1; x++) roi[y * W + x] = 1;

// Outside the head the cyborg is drawn entirely in red, so navy/teal ink there is orbit ink.
// Inside the head only the dark dome shares that colour, and the dome never lies on an orbit band
// except where an orbit disappears behind it (junction outlines measure R >= 23, orbits R <= 2).
const Bc = (i) => src[i * 4 + 2];
// navy/teal orbit ink, including its slightly purple antialiased edge rows; the purple head
// outline at the junctions has R close to or above B, so it fails the ratio test
const orbitInk = (i) => Rc(i) <= 40 && Bc(i) >= 1.5 * Rc(i) + 8;

const ink1 = new Uint8Array(N);
for (let i = 0; i < N; i++) ink1[i] = roi[i] && A(i) >= 110 && !(orbitInk(i) && inZone(i, 3)) ? 1 : 0;
const headCore = fillHoles(ink1, roi);
let head = erode(dilate(headCore, 4), 4); // close hairline notches between head strokes
head = fillHoles(head, roi);
// the closing also fills the wedges where an orbit meets the outline; those pixels stay orbit
for (let i = 0; i < N; i++) if (!roi[i] || (head[i] && !headCore[i] && A(i) > 0 && orbitInk(i))) head[i] = 0;

// Every orbit/planet pixel is removed. On the near side the orbits pass in front of cyborg lines;
// the line segments hidden under those strokes do not exist in the source and are NOT invented.
// Instead the adjoining red ink is extended a few pixels under the stroke edge so the stationary
// vector stroke (always drawn on top) meets it without an antialiasing seam.
const remove = new Uint8Array(N);
let removedOutsideBands = 0;
for (let i = 0; i < N; i++) {
    if (!A(i)) continue;
    const band = inZone(i, 4);
    const x = i % W, y = (i / W) | 0;
    // near-side orbits pass in front of the jaw; the navy-like dome only lies on the far side
    if (head[i] && !(band && !isBackHalf(x, y))) continue;
    const coverage = orbitInk(i) ? 1 : band ? Math.max(0, Math.min(1, (200 - Rc(i)) / 188)) : 0;
    if (coverage <= 0.02) continue;
    if (orbitInk(i) || (band && !isBackHalf(x, y)) || coverage >= 0.5) remove[i] = 1;
    if (!band && orbitInk(i)) removedOutsideBands++;
}
const cyborg = Buffer.from(src);
for (let i = 0; i < N; i++) if (remove[i]) cyborg[i * 4] = cyborg[i * 4 + 1] = cyborg[i * 4 + 2] = cyborg[i * 4 + 3] = 0;

// Where a far-side orbit touches the head outline, the outline's antialiased edge was blended
// with orbit navy instead of transparency. Un-mix those pixels: adopt the adjacent outline colour
// with alpha = estimated outline coverage, i.e. the edge the outline has everywhere else.
let demixed = 0;
{
    const headInterior = erode(head, 3);
    const nearHead = dilate(head, 3);
    const updates = [];
    for (let i = 0; i < N; i++) {
        if (!cyborg[i * 4 + 3] || !nearHead[i] || headInterior[i] || !inZone(i, 4)) continue;
        const x = i % W, y = (i / W) | 0;
        if (!isBackHalf(x, y)) continue;
        let best = null;
        for (let r = 1; r <= 4 && !best; r++) {
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                const xx = x + dx, yy = y + dy;
                if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
                const j = yy * W + xx;
                if (!head[j] || src[j * 4 + 3] < 240 || orbitInk(j)) continue;
                if (!best || src[j * 4] > src[best * 4]) best = j;
            }
        }
        if (best === null) continue;
        const Ro = src[best * 4], Rp = cyborg[i * 4];
        if (Ro < 20 || Rp >= 0.9 * Ro) continue;
        const c = Math.max(0, Math.min(1, (Rp - 1) / (Ro - 1)));
        updates.push([i, best, c]);
    }
    for (const [i, j, c] of updates) {
        for (let k = 0; k < 3; k++) cyborg[i * 4 + k] = src[j * 4 + k];
        cyborg[i * 4 + 3] = Math.round(cyborg[i * 4 + 3] * c);
        demixed++;
    }
    // remaining non-red specks on far-side bands outside the head are orbit residue
    for (let i = 0; i < N; i++) {
        if (!cyborg[i * 4 + 3] || head[i] || cyborg[i * 4] >= 60 || !inZone(i, 4)) continue;
        if (!isBackHalf(i % W, (i / W) | 0)) continue;
        cyborg[i * 4] = cyborg[i * 4 + 1] = cyborg[i * 4 + 2] = cyborg[i * 4 + 3] = 0;
        remove[i] = 1;
    }
}

const EDGE_EXTEND = 3;
let filled = 0;
{
    const ok = new Uint8Array(N);
    for (let i = 0; i < N; i++) ok[i] = !remove[i] && cyborg[i * 4 + 3] > 64 && Rc(i) > 40 ? 1 : 0;
    for (let pass = 0; pass < EDGE_EXTEND; pass++) {
        const next = [];
        for (let i = 0; i < N; i++) {
            if (!remove[i] || ok[i] || A(i) < 64 || !inZone(i, 4)) continue;
            const x = i % W, y = (i / W) | 0;
            if (isBackHalf(x, y)) continue;
            let r = 0, g = 0, b = 0, a = 0, k = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const xx = x + dx, yy = y + dy;
                if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
                const j = yy * W + xx;
                if (!ok[j]) continue;
                const aj = cyborg[j * 4 + 3];
                r += cyborg[j * 4] * aj; g += cyborg[j * 4 + 1] * aj; b += cyborg[j * 4 + 2] * aj; a += aj; k++;
            }
            if (k >= 2) next.push([i, r / a, g / a, b / a, a / k]);
        }
        for (const [i, r, g, b, a] of next) {
            cyborg[i * 4] = Math.round(r); cyborg[i * 4 + 1] = Math.round(g); cyborg[i * 4 + 2] = Math.round(b); cyborg[i * 4 + 3] = Math.round(a);
            ok[i] = 1; filled++;
        }
    }
}

// Clear the faint (alpha < 16) dark matte fringe that surrounded orbit strokes, unless it hugs cyborg ink.
const cyInk = new Uint8Array(N);
for (let i = 0; i < N; i++) cyInk[i] = cyborg[i * 4 + 3] >= 64 ? 1 : 0;
const nearCy = dilate(cyInk, 3);
let fringeCleared = 0;
for (let i = 0; i < N; i++) {
    if (cyborg[i * 4 + 3] > 0 && cyborg[i * 4 + 3] < 16 && inZone(i, 7) && !nearCy[i]) {
        cyborg[i * 4 + 3] = 0; fringeCleared++;
    }
}
let unchanged = 0, changed = 0;
for (let i = 0; i < N * 4; i += 4) {
    const same = cyborg[i] === src[i] && cyborg[i + 1] === src[i + 1] && cyborg[i + 2] === src[i + 2] && cyborg[i + 3] === src[i + 3];
    if (same) unchanged++; else changed++;
}

/* ---------------------------------------------------- 4. occluder vector path */

const occ = erode(head, 1);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!isBackHalf(x, y)) occ[y * W + x] = 0;

function contours(mask) {
    // marching squares on a 3×3-smoothed field (padded so contours close)
    const PW = W + 2, PH = H + 2;
    const F = new Float32Array(PW * PH);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, k = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < W && yy < H) s += mask[yy * W + xx];
            k++;
        }
        F[(y + 1) * PW + (x + 1)] = s / k;
    }
    const T = 0.5;
    const val = (i, j) => F[j * PW + i];
    const pos = (i, j) => [i - 0.5, j - 0.5];
    const edgePt = (id) => {
        const [kind, i, j] = id.split(",").map((v, k) => (k === 0 ? v : Number(v)));
        const [i2, j2] = kind === "h" ? [i + 1, j] : [i, j + 1];
        const a = val(i, j), b = val(i2, j2);
        const f = (T - a) / (b - a);
        const p1 = pos(i, j), p2 = pos(i2, j2);
        return [p1[0] + f * (p2[0] - p1[0]), p1[1] + f * (p2[1] - p1[1])];
    };
    const segs = [];
    for (let j = 0; j < PH - 1; j++) for (let i = 0; i < PW - 1; i++) {
        const tl = val(i, j) >= T, tr = val(i + 1, j) >= T, br = val(i + 1, j + 1) >= T, bl = val(i, j + 1) >= T;
        const c = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const top = `h,${i},${j}`, bottom = `h,${i},${j + 1}`, left = `v,${i},${j}`, right = `v,${i + 1},${j}`;
        const centre = (val(i, j) + val(i + 1, j) + val(i + 1, j + 1) + val(i, j + 1)) / 4 >= T;
        const table = {
            1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
            5: centre ? [[top, left], [bottom, right]] : [[top, right], [left, bottom]],
            6: [[top, bottom]], 7: [[top, left]], 8: [[top, left]], 9: [[top, bottom]],
            10: centre ? [[top, right], [left, bottom]] : [[top, left], [bottom, right]],
            11: [[top, right]], 12: [[left, right]], 13: [[bottom, right]], 14: [[left, bottom]],
        };
        for (const s of table[c]) segs.push(s);
    }
    const byEdge = new Map();
    segs.forEach((s, k) => s.forEach((e) => { if (!byEdge.has(e)) byEdge.set(e, []); byEdge.get(e).push(k); }));
    const used = new Uint8Array(segs.length);
    const loops = [];
    for (let k = 0; k < segs.length; k++) {
        if (used[k]) continue;
        used[k] = 1;
        const loop = [segs[k][0]];
        let cur = segs[k][1];
        while (cur !== loop[0]) {
            loop.push(cur);
            const next = (byEdge.get(cur) || []).find((m) => !used[m]);
            if (next === undefined) break;
            used[next] = 1;
            cur = segs[next][0] === cur ? segs[next][1] : segs[next][0];
        }
        loops.push(loop.map(edgePt));
    }
    return loops;
}
function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
    let md = -1, mi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
        const [px, py] = pts[i];
        const l = Math.hypot(bx - ax, by - ay) || 1e-9;
        const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / l;
        if (d > md) { md = d; mi = i; }
    }
    if (md <= eps) return [pts[0], pts[pts.length - 1]];
    return [...rdp(pts.slice(0, mi + 1), eps).slice(0, -1), ...rdp(pts.slice(mi), eps)];
}
const polyArea = (p) => p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0) / 2;
const loops = contours(occ).filter((l) => Math.abs(polyArea(l)) > 40);
const occluderPath = loops.map((l) => {
    // split the closed loop at its farthest point pair before simplifying
    const half = Math.floor(l.length / 2);
    const s = [...rdp(l.slice(0, half + 1), 0.35).slice(0, -1), ...rdp([...l.slice(half), l[0]], 0.35).slice(0, -1)];
    return "M" + s.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
}).join("");

/* ------------------------------------------------------- 5. write raster assets */

const cyborgPng = await sharp(cyborg, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
fs.writeFileSync(path.join(OUT_DIR, "cyborg.png"), cyborgPng);
await sharp(cyborgPng).resize({ width: 384, kernel: "lanczos3" }).png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(OUT_DIR, "cyborg-sm.png"));

// energy glow: red, weighted by stroke redness so the dark dome does not glow
const glowSrc = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
    const a = cyborg[i * 4 + 3] / 255, red = cyborg[i * 4] / 255;
    glowSrc[i * 4] = 255; glowSrc[i * 4 + 1] = 34; glowSrc[i * 4 + 2] = 68;
    glowSrc[i * 4 + 3] = Math.round(255 * a * Math.min(1, red * 1.15));
}
const GLOW_W = 460;
await sharp(glowSrc, { raw: { width: W, height: H, channels: 4 } })
    .resize({ width: GLOW_W, kernel: "lanczos3" })
    .blur(3.2)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, "cyborg-glow.png"));

/* -------------------------------------------- 6. generated data + vector assets */

const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;
// Measurements use pixel-index coordinates; SVG/user space puts pixel centres at +0.5.
const PX = 0.5;
const art = {
    viewBox: { width: W, height: H },
    axis: { cx: r3(AX.cx + PX), cy: r3(AX.cy + PX), rotation: r3(deg(AX.theta)) },
    orbits: ringData.map((rd) => ({
        id: rd.R.id,
        cx: r3(rd.R.cx + PX), cy: r3(rd.R.cy + PX), rx: r3(rd.R.a), ry: r3(rd.R.b), rotation: r3(deg(rd.R.theta)),
        strokeWidth: r2(rd.width),
        path: centrelinePath(rd).d,
        length: r2(centrelinePath(rd).length),
        base: hex(rd.tone.base),
        lobes: rd.tone.lobes.map((l) => ({
            angle: r2(deg(l.phi)),
            stops: l.stops.map((s) => ({ offset: r3(s.offset), color: hex(s.color) })),
        })),
    })),
    planets: planets.map((p) => ({
        orbit: "outer",
        // angle/rho are measured relative to the outer orbit, so the +0.5 shift carries through.
        angle: r2(deg(p.t)),
        rho: r3(p.rho),
        r: r2(p.r),
        color: hex(p.color),
    })),
    occluderPath,
};

const ts = `/**
 * GENERATED by scripts/extract-cyber-odyssey-layers.mjs — do not edit by hand.
 * Geometry is measured from assets/original/CapriWebServices-Logo.png (${W} × ${H}).
 * Angles are in degrees. Orbit "angle" values are positions on the orbit's own circle
 * (parametric angle before the ellipse projection), so rotating that circle moves points
 * along the projected ellipse.
 */

export type OrbitId = "inner" | "middle" | "outer";

export type ToneStop = { offset: number; color: string };

export type OrbitArt = {
    id: OrbitId;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    rotation: number;
    strokeWidth: number;
    /** Measured stroke centreline (the hand-drawn ring deviates slightly from the fitted ellipse). */
    path: string;
    /** Centreline length in viewBox units. */
    length: number;
    /** Base stroke colour. */
    base: string;
    /** Tonal sweeps along the orbit, each a linear ramp centred on \`angle\`. */
    lobes: { angle: number; stops: ToneStop[] }[];
};

export type PlanetArt = {
    orbit: OrbitId;
    angle: number;
    /** Normalised distance from the orbit centre (1 = exactly on the orbit centreline). */
    rho: number;
    r: number;
    color: string;
};

export const CYBER_ODYSSEY_ART = ${JSON.stringify(art, null, 4)} as const satisfies {
    viewBox: { width: number; height: number };
    axis: { cx: number; cy: number; rotation: number };
    orbits: readonly OrbitArt[];
    planets: readonly PlanetArt[];
    occluderPath: string;
};

export const CYBER_ODYSSEY_ASSETS = {
    cyborg: "/branding/cyber-odyssey/cyborg.png",
    cyborgSmall: "/branding/cyber-odyssey/cyborg-sm.png",
    glow: "/branding/cyber-odyssey/cyborg-glow.png",
} as const;
`;
fs.mkdirSync(path.dirname(DATA_TS), { recursive: true });
fs.writeFileSync(DATA_TS, ts);

const toDataUri = (buf) => "data:image/png;base64," + buf.toString("base64");
const glowPng = fs.readFileSync(path.join(OUT_DIR, "cyborg-glow.png"));

fs.writeFileSync(path.join(OUT_DIR, "orbits.svg"), buildOrbitalSvg(art, { mode: "orbits-only" }));
fs.writeFileSync(
    path.join(OUT_DIR, "cyber-odyssey-orbital.svg"),
    buildOrbitalSvg(art, { mode: "animated", cyborgHref: toDataUri(cyborgPng), glowHref: toDataUri(glowPng) })
);

/* --------------------------------------------------------------- 7. validation */

const staticSvg = buildOrbitalSvg(art, { mode: "static", cyborgHref: toDataUri(cyborgPng) });
const rendered = await sharp(Buffer.from(staticSvg)).ensureAlpha().raw().toBuffer();

async function flatten(raw, bg) {
    return sharp(raw, { raw: { width: W, height: H, channels: 4 } }).flatten({ background: bg }).raw().toBuffer();
}
const diffStats = {};
for (const [name, bg] of [["white", "#ffffff"], ["black", "#000000"]]) {
    const a = await flatten(src, bg), b = await flatten(rendered, bg);
    let sum = 0, over16 = 0, over48 = 0;
    const heat = Buffer.alloc(N * 3);
    for (let i = 0; i < N; i++) {
        const d = Math.max(Math.abs(a[i * 3] - b[i * 3]), Math.abs(a[i * 3 + 1] - b[i * 3 + 1]), Math.abs(a[i * 3 + 2] - b[i * 3 + 2]));
        sum += d; if (d > 16) over16++; if (d > 48) over48++;
        const v = Math.min(255, d * 4);
        heat[i * 3] = 255 - Math.min(255, v * 0.2); heat[i * 3 + 1] = 255 - v; heat[i * 3 + 2] = 255 - v;
    }
    diffStats[name] = { meanAbs: r3(sum / N), pctOver16: r3((100 * over16) / N), pctOver48: r3((100 * over48) / N) };
    await sharp(heat, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(VAL_DIR, `diff-${name}.png`));
}
await sharp(rendered, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(VAL_DIR, "reconstructed-static.png"));
for (const [name, bg] of [["white", "#ffffff"], ["dark", "#0b1220"], ["grey", "#808080"]]) {
    await sharp(cyborgPng).flatten({ background: bg }).png().toFile(path.join(VAL_DIR, `cyborg-on-${name}.png`));
}
await sharp(Buffer.from(buildOrbitalSvg(art, { mode: "orbits-only" }))).flatten({ background: "#ffffff" }).png().toFile(path.join(VAL_DIR, "orbits-on-white.png"));
const srcHashAfter = sha(SRC);
const report = {
    source: { file: path.relative(root, SRC).replaceAll("\\", "/"), sha256: srcHashBefore, unchanged: srcHashBefore === srcHashAfter, size: `${W}x${H}` },
    strokeWidth: r3(STROKE),
    orbits: ringData.map((r) => ({
        id: r.R.id, measuredWidth: r3(r.width), centreBias: r3(r.centreBias), visibleSamples: r.samples.length,
        rawOffsetMax: r3(r.rawOffsetMax), modelledOffsetMax: r3(r.offsetMax), offsetResidualRms: r3(r.offsetResidualRms),
        toneRms: r3(r.toneRms), toneMax: r3(r.toneMax),
        lobeSeparationDeg: r.tone.separationDeg ? r2(r.tone.separationDeg) : null,
    })),
    planets: planets.map((p) => ({ cx: r3(p.cx), cy: r3(p.cy), r: r3(p.r), edgeResidual: r3(p.edgeResidual), edgeSamples: p.edgeSamples, angleDeg: r2(deg(p.t)), rho: r3(p.rho), color: hex(p.color) })),
    cyborgLayer: {
        pixelsRemoved: remove.reduce((a, b) => a + b, 0),
        orbitInkOutsideBands: removedOutsideBands, edgeExtendedPixels: filled, junctionPixelsDemixed: demixed, fringeCleared, pixelsIdenticalToSource: unchanged, pixelsChanged: changed },
    occluder: { loops: loops.length, pathLength: occluderPath.length },
    staticReconstructionDiff: diffStats,
    validationDir: VAL_DIR,
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
