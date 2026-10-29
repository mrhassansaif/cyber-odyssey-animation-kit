/**
 * Magnified side-by-side crops (source | reconstruction | diff) for reviewing the layer extraction.
 *   node scripts/inspect-cyber-odyssey-diff.mjs x y w h scale name
 */
import sharp from "sharp";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const VAL = path.join(os.tmpdir(), "cyber-odyssey-validation");
const SRC = path.join(root, "assets", "original", "CapriWebServices-Logo.png");
const [x, y, w, h, scale] = process.argv.slice(2, 7).map(Number);
const name = process.argv[7] || "crop";
const bg = process.argv[8] || "#ffffff";

const tile = async (file) =>
    sharp(await sharp(file).flatten({ background: bg }).png().toBuffer())
        .extract({ left: x, top: y, width: w, height: h })
        .resize(w * scale, h * scale, { kernel: "nearest" })
        .png()
        .toBuffer();

const a = await tile(SRC);
const second = process.argv[9] === "cyborg" ? path.join(root, "assets", "generated", "cyborg.png") : path.join(VAL, "reconstructed-static.png");
const b = await tile(second);
const d = await sharp(path.join(VAL, "diff-white.png")).extract({ left: x, top: y, width: w, height: h })
    .resize(w * scale, h * scale, { kernel: "nearest" }).png().toBuffer();
const out = path.join(VAL, `inspect-${name}.png`);
await sharp({ create: { width: w * scale * 3 + 20, height: h * scale, channels: 3, background: "#888" } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: w * scale + 10, top: 0 }, { input: d, left: 2 * (w * scale + 10), top: 0 }])
    .png().toFile(out);
console.log(out);
