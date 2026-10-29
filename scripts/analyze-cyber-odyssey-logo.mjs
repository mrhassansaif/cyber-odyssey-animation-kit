/**
 * Read-only analysis of the flattened Cyber Odyssey logo.
 * Samples each fitted orbit for stroke width, colour, and occlusion by the cyborg,
 * and prints edge profiles to characterise the baked-in dark fringe.
 * Never writes to the source PNG.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { RINGS, PLANETS } from "./cyber-odyssey-geometry.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "assets", "original", "CapriWebServices-Logo.png");

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const px = (x, y) => {
    const i = (Math.round(y) * W + Math.round(x)) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};
const hex = (c) => "#" + c.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
const mode = process.argv[2] || "rings";

if (mode === "rings") {
    for (const R of RINGS) {
        const c = Math.cos(R.theta), s = Math.sin(R.theta);
        const pt = (t) => [
            R.cx + c * R.a * Math.cos(t) - s * R.b * Math.sin(t),
            R.cy + s * R.a * Math.cos(t) + c * R.b * Math.sin(t),
        ];
        const widths = [];
        const line = [];
        for (let deg = -180; deg < 180; deg += 6) {
            const t = (deg * Math.PI) / 180;
            const [x, y] = pt(t);
            const [x2, y2] = pt(t + 0.001);
            const tl = Math.hypot(x2 - x, y2 - y);
            const nx = -(y2 - y) / tl, ny = (x2 - x) / tl;
            const inPlanet = PLANETS.some((p) => Math.hypot(x - p.x, y - p.y) < p.r + 4);
            const prof = [];
            for (let d = -16; d <= 16; d++) prof.push(px(x + nx * d, y + ny * d));
            const center = prof[16];
            const isRing = center[3] > 110 && center[2] > center[0] + 6;
            const isRed = center[3] > 110 && center[0] > center[2];
            if (isRing && !inPlanet) {
                let lo = 16, hi = 16;
                const ok = (p) => p[3] > 127 && p[2] > p[0];
                while (lo > 0 && ok(prof[lo - 1])) lo--;
                while (hi < 32 && ok(prof[hi + 1])) hi++;
                widths.push(hi - lo + 1);
            }
            const tag = inPlanet ? "P" : isRing ? "R" + hex(center) : isRed ? "C" : center[3] < 30 ? "." : "?";
            line.push(`${deg}:${tag}`);
        }
        widths.sort((a, b) => a - b);
        console.log(`\n== ${R.id}`);
        console.log(line.join("  "));
        console.log("width median", widths[widths.length >> 1], "min", widths[0], "max", widths.at(-1));
    }
}

if (mode === "junctions") {
    // Fine scan along each orbit centreline across the occluded (behind-head) span.
    const spans = { inner: [-124, -26], middle: [-110, -50], outer: [-112, -60] };
    for (const R of RINGS) {
        const [t0, t1] = spans[R.id];
        const c = Math.cos(R.theta), s = Math.sin(R.theta);
        const row = [];
        for (let deg = t0; deg <= t1; deg += 1) {
            const t = (deg * Math.PI) / 180;
            const x = R.cx + c * R.a * Math.cos(t) - s * R.b * Math.sin(t);
            const y = R.cy + s * R.a * Math.cos(t) + c * R.b * Math.sin(t);
            const p = px(x, y);
            row.push(`${deg}(${Math.round(x)},${Math.round(y)})a${p[3]}${hex(p)}`);
        }
        console.log(`\n== ${R.id}\n` + row.join(" "));
    }
}

if (mode === "crop") {
    // node analyze-cyber-odyssey-logo.mjs crop x y w h scale out.png
    const [x, y, w, h, scale] = process.argv.slice(3, 8).map(Number);
    const out = process.argv[8];
    const flat = await sharp({ create: { width: info.width, height: info.height, channels: 4, background: "#ffffff" } })
        .composite([{ input: SRC }]).png().toBuffer();
    await sharp(flat).extract({ left: x, top: y, width: w, height: h })
        .resize(w * scale, h * scale, { kernel: "nearest" }).png().toFile(out);
    console.log("wrote", out);
}

if (mode === "edges") {
    // Horizontal / vertical scanlines across representative strokes.
    const scans = [
        ["body-left vertical (red)", 190, 590, 1, 0, 50],
        ["body-right vertical (red)", 690, 590, 1, 0, 50],
        ["outer ring bottom (teal)", 300, 640, 0, 1, 50],
        ["inner ring right (navy)", 600, 330, 1, 0, 60],
        ["helmet dome top (maroon)", 450, 80, 0, 1, 50],
    ];
    for (const [name, x0, y0, dx, dy, len] of scans) {
        const row = [];
        for (let k = 0; k < len; k++) {
            const p = px(x0 + dx * k, y0 + dy * k);
            row.push(`${p[3].toString().padStart(3)}${hex(p)}`);
        }
        console.log(`\n${name} @(${x0},${y0}) step(${dx},${dy})\n` + row.join(" "));
    }
}
