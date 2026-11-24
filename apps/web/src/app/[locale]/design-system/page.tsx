import type { Metadata } from "next";
import { DesignSystemCatalog } from "@/components/DesignSystemCatalog";

/**
 * Development-only design-system catalogue (Phase 3).
 * Not linked from any navigation. `noindex` so it never shows up in
 * search results if a preview deployment is crawled.
 */
export const metadata: Metadata = {
  title: "Design system — Kuro Coffee",
  description: "Development-only catalogue of the ela-coffee design system.",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemCatalog />;
}
