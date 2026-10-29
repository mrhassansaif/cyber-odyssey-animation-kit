/**
 * Next.js App Router reference page (originating route: /preview/logo-animation).
 * Requires `next` for Metadata. The interactive UI is in LogoAnimationPreview.tsx.
 */
import type { Metadata } from "next";
import LogoAnimationPreview from "./LogoAnimationPreview";

export const metadata: Metadata = {
    title: "Cyber Odyssey logo animation preview",
    robots: { index: false, follow: false },
};

export default function LogoAnimationPreviewPage() {
    return <LogoAnimationPreview />;
}
