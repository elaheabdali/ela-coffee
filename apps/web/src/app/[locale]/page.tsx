import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Marquee, Pill, Price, Reveal, WordReveal } from "@ela-coffee/ui";
import { BrandToggle } from "@/components/BrandToggle";
import { BagDemo } from "@/components/BagDemo";

/**
 * Phase 2 placeholder page — NOT the real site. It exists to prove the
 * scaffold works end to end: locale routing, tokens, brand switch,
 * motion foundation, images and the design-system packages.
 *
 * The full page (hero wheel, story, menu, process, origins, join,
 * footer) lands in Phase 4.
 */

// Architecture §14 placeholder price (Kuro Original) — the user confirmed
// random/placeholder Toman prices are fine for now.
const PLACEHOLDER_PRICE_TOMAN = 180_000;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHero = await getTranslations("hero");
  const tNav = await getTranslations("nav");
  const tMenu = await getTranslations("menu");
  const tPlaceholder = await getTranslations("placeholder");
  const priceLocale = locale === "en" ? "en" : "fa";
  const marqueeItems = tHero("marquee")
    .split("•")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-16 px-5 py-10 sm:px-12 lg:px-16">
      <header className="flex items-center justify-between">
        <span className="font-display text-3xl font-black tracking-[-0.02em]">kuro</span>
        <BrandToggle coffeeLabel={tNav("brandCoffee")} matchaLabel={tNav("brandMatcha")} />
      </header>

      <section id="hero" className="flex flex-col gap-8">
        <Pill>{tPlaceholder("motionDemo")}</Pill>
        <WordReveal
          as="h1"
          text={tHero("title")}
          className="font-display text-[clamp(2.5rem,8vw,4.5rem)] leading-[1.02] font-black tracking-[-0.02em]"
        />

        <div className="animate-kuro-wheel-in">
          <Image
            src="/images/scenes/original.webp"
            alt=""
            width={1920}
            height={1072}
            priority
            className="animate-kuro-pour kuro-pour-mask w-full rounded-2xl shadow-kuro-hero"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <BagDemo addLabel={tHero("addToBag")} />
          <span className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{tPlaceholder("priceDemo")}</span>
            <Price
              amountToman={PLACEHOLDER_PRICE_TOMAN}
              locale={priceLocale}
              className="font-display text-2xl font-bold"
            />
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            {tHero("scrollCue")}
            <ChevronDown size={16} className="animate-kuro-scroll-cue" />
          </span>
        </div>
      </section>

      <section aria-label={tPlaceholder("motionDemo")} className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-xl border border-border bg-secondary py-3">
          <Marquee items={marqueeItems} ariaLabel={tHero("marquee")} />
        </div>

        <div className="flex items-center gap-6">
          <Image
            src="/images/ingredients.webp"
            alt=""
            width={270}
            height={181}
            className="animate-kuro-float w-40 rounded-[30%]"
            style={{ animationDelay: "-2.4s" }}
          />
          <p className="max-w-md text-muted-foreground">
            {tMenu("title")} — {tMenu("spinWheel")}
          </p>
        </div>
      </section>

      <Reveal variant="fade-up" delayMs={300}>
        <p className="rounded-2xl bg-card p-6 text-lg leading-relaxed shadow-kuro-card">
          {tPlaceholder("note")}
        </p>
      </Reveal>
    </main>
  );
}
