/**
 * Verifies kit-internal integrity without touching the originating website.
 *
 *   node scripts/verify-kit-integrity.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

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
    "assets/generated/orbits.svg",
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
for (const name of ["cyborg.png", "cyborg-sm.png", "cyborg-glow.png"]) {
    if (!art.includes(`/branding/cyber-odyssey/${name}`)) {
        issues.push(`asset URL missing in cyberOdysseyArt.ts: ${name}`);
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
