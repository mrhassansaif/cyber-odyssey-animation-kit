/**
 * Verifies kit-internal integrity without touching the originating website.
 *
 *   node scripts/verify-kit-integrity.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { buildOutputs } from "./build-cyber-odyssey-vector.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const exists = (rel) => fs.existsSync(path.join(root, rel));

const expectedOriginal =
    "2a2064f933be5575647b146a899686bc6137e9f123bb35cbb96ac045e0f04c5a";

const required = [
    "component/CyberOdysseyLoader.tsx",
    "component/CyberOdysseyLoader.module.css",
    "component/cyberOdysseyArt.ts",
    "assets/original/CapriWebServices-Logo.png",
    "assets/generated/cyborg.png",
    "assets/generated/cyborg-sm.png",
    "assets/generated/cyborg-glow.png",
    "assets/generated/cyber-odyssey-orbital.svg",
    "assets/generated/capri-web-services-logo.svg",
    "assets/generated/orbits.svg",
    "scripts/build-cyber-odyssey-vector.mjs",
    "preview/standalone/index.html",
    "README.md",
    "INTEGRATION_PROMPT.md",
    "manifest.json",
];

const issues = [];
for (const rel of required) {
    if (!exists(rel)) issues.push(`missing: ${rel}`);
}

const orig = path.join(root, "assets/original/CapriWebServices-Logo.png");
if (fs.existsSync(orig)) {
    const h = sha(orig);
    if (h !== expectedOriginal) issues.push(`original logo hash mismatch: ${h}`);
}

const comp = fs.readFileSync(path.join(root, "component/CyberOdysseyLoader.tsx"), "utf8");
for (const m of comp.matchAll(/from\s+["']([^"']+)["']/g)) {
    const spec = m[1];
    if (spec === "react") continue;
    if (!spec.startsWith("./")) {
        issues.push(`component import is not kit-local: ${spec}`);
        continue;
    }
    const base = path.join(root, "component", spec.slice(2));
    const ok = [base, base + ".ts", base + ".tsx", base + ".css"].some((p) => fs.existsSync(p));
    if (!ok) issues.push(`unresolved relative import: ${spec}`);
}

const art = fs.readFileSync(path.join(root, "component/cyberOdysseyArt.ts"), "utf8");
for (const name of ["capri-web-services-logo.svg", "cyber-odyssey-orbital.svg"]) {
    if (!art.includes(`/branding/cyber-odyssey/${name}`)) {
        issues.push(`asset URL missing in cyberOdysseyArt.ts: ${name}`);
    }
}
// the component renders vector art inline: no raster or external image dependencies
for (const [file, text] of [["component/CyberOdysseyLoader.tsx", comp], ["component/cyberOdysseyArt.ts", art]]) {
    if (/<image\b|\.png\b|\.jpe?g\b|\.webp\b|data:image/i.test(text)) issues.push(`raster reference in ${file}`);
}

// final SVG deliverables: genuine vector, self-contained
const RASTER = /<image\b|data:|base64|<foreignObject\b|<script\b|\.(png|jpe?g|webp|gif)\b|(xlink:)?href\s*=\s*["'](?!#)/i;
for (const rel of ["assets/generated/cyber-odyssey-orbital.svg", "assets/generated/capri-web-services-logo.svg"]) {
    if (!exists(rel)) continue;
    const svg = fs.readFileSync(path.join(root, rel), "utf8");
    if (RASTER.test(svg)) issues.push(`raster/external dependency in ${rel}`);
    if (!/<title\b/.test(svg) || !/role="img"/.test(svg)) issues.push(`missing title/role in ${rel}`);
    if (!/^<svg[^>]*viewBox=/.test(svg)) issues.push(`missing viewBox in ${rel}`);
}
const staticSvg = exists("assets/generated/capri-web-services-logo.svg")
    ? fs.readFileSync(path.join(root, "assets/generated/capri-web-services-logo.svg"), "utf8")
    : "";
if (/<style\b|@keyframes|animation|<animate|<set\b|<filter\b|filter=/i.test(staticSvg)) {
    issues.push("static logo contains animation, styles or filters");
}
const animatedSvg = exists("assets/generated/cyber-odyssey-orbital.svg")
    ? fs.readFileSync(path.join(root, "assets/generated/cyber-odyssey-orbital.svg"), "utf8")
    : "";
if (!/@keyframes/.test(animatedSvg) || !/prefers-reduced-motion:\s*reduce/.test(animatedSvg)) {
    issues.push("animated SVG is missing keyframes or reduced-motion handling");
}

// generated files must match their single geometry source
for (const [rel, content] of Object.entries(buildOutputs())) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) {
        issues.push(`out of date (run node scripts/build-cyber-odyssey-vector.mjs): ${rel}`);
    }
}

const measurements = JSON.parse(fs.readFileSync(path.join(root, "scripts/cyber-odyssey-measurements.json"), "utf8"));
if (measurements.source?.sha256 !== expectedOriginal) {
    issues.push("measurements.json source.sha256 does not match packaged original");
}

if (issues.length) {
    console.error("FAIL");
    for (const i of issues) console.error(" -", i);
    process.exit(1);
}
console.log("OK — kit integrity checks passed");
console.log("original logo sha256:", expectedOriginal);
