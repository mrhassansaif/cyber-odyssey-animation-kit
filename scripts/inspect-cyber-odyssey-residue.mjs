/**
 * Lists non-red pixels left in the extracted cyborg layer outside the head (orbit residue check).
 *   node scripts/inspect-cyber-odyssey-residue.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { data, info } = await sharp(path.join(root, "assets", "generated", "cyborg.png"))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const ROI = { x0: 296, y0: 60, x1: 612, y1: 446 };
const buckets = new Map();
let total = 0;
const examples = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (!a || r >= 90) continue;
    const inRoi = x >= ROI.x0 && x <= ROI.x1 && y >= ROI.y0 && y <= ROI.y1;
    if (inRoi && y < 240) continue; // dark dome
    total++;
    const key = `a${Math.min(255, Math.floor(a / 32) * 32)}-r${Math.floor(r / 15) * 15}-${b > r + 12 ? "blue" : "grey"}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
    if (examples.length < 25 && total % 40 === 0) examples.push({ x, y, rgba: [r, g, b, a], inRoi });
}
console.log({ total });
console.log([...buckets.entries()].sort((p, q) => q[1] - p[1]).slice(0, 25));
console.log(examples);
