import { setRequestLocale } from "next-intl/server";
import { ToastProvider } from "@ela-coffee/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { FlavorWheel } from "@/components/FlavorWheel";
import { BrandMarquee } from "@/components/BrandMarquee";
import { Story } from "@/components/Story";
import { MenuSection } from "@/components/MenuSection";
import { Process } from "@/components/Process";
import { Origins } from "@/components/Origins";
import { JoinList } from "@/components/JoinList";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * The real single-page site (Phase 4), replacing the Phase 2
 * placeholder. One page, two brands (audit §1): the hero wheel,
 * marquee, story, menu, process, origins, join and footer all read
 * the same brand dataset, so a brand switch repaints everything.
 *
 * Server Components stay server-side where they can (this page), and
 * the interactive pieces (wheel, header, sections, footer) are client
 * components that read the Zustand brand/bag/flavour stores. The
 * ToastProvider wraps the page once so any add-to-bag action can show
 * the reference's toast.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToastProvider>
      <SiteHeader />
      <main>
        <FlavorWheel />
        <BrandMarquee />
        <Story />
        <MenuSection />
        <Process />
        <Origins />
        <JoinList />
      </main>
      <SiteFooter />
    </ToastProvider>
  );
}
