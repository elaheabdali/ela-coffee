"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  Eyebrow,
  Marquee,
  Pill,
  Price,
  Reveal,
  Stepper,
  ToastProvider,
  WordReveal,
  useToast,
} from "@ela-coffee/ui";
import { BrandToggle } from "@/components/BrandToggle";

/**
 * Development-only design-system catalogue.
 * Not linked from any navigation; the page itself is `noindex`.
 * Every section renders the real `@ela-coffee/ui` components, so a
 * visual check here covers exactly what Phase 4 will consume.
 */

const KURO_SWATCHES: Array<{ name: string; value: string }> = [
  { name: "--background / --kuro-espresso", value: "#120b08" },
  { name: "--foreground", value: "#f6eee3" },
  { name: "--card", value: "#1b120d" },
  { name: "--primary / --kuro-crema", value: "#d9a066" },
  { name: "--kuro-cream", value: "#f3ebe0" },
  { name: "--kuro-roast", value: "#1e130d" },
  { name: "--muted-foreground", value: "#b9a690" },
  { name: "--destructive", value: "#e40014" },
];

const MIDORI_SWATCHES: Array<{ name: string; value: string }> = [
  { name: "--background / --kuro-espresso", value: "#0e180c" },
  { name: "--foreground", value: "#eef0e1" },
  { name: "--card", value: "#162212" },
  { name: "--primary / --kuro-crema", value: "#a9c46c" },
  { name: "--kuro-cream", value: "#eef0e1" },
  { name: "--kuro-roast", value: "#172313" },
  { name: "--muted-foreground", value: "#a9b598" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-kuro-card">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  );
}

function ToastDemo() {
  const t = useTranslations("designSystem");
  const { showToast } = useToast();
  return (
    <Button variant="secondary" onClick={() => showToast(t("toastMessage"))}>
      {t("showToast")}
    </Button>
  );
}

export function DesignSystemCatalog() {
  const t = useTranslations("designSystem");
  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const tBag = useTranslations("bag");
  const tDialog = useTranslations("dialog");
  const locale = useLocale();
  const priceLocale = locale === "en" ? "en" : "fa";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [qty, setQty] = useState(2);

  const marqueeItems = tHero("marquee")
    .split("•")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return (
    <ToastProvider>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-12 lg:px-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <WordReveal
            as="h1"
            text={t("title")}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-black leading-[1.02] tracking-[-0.02em]"
          />
          <BrandToggle coffeeLabel={tNav("brandCoffee")} matchaLabel={tNav("brandMatcha")} />
        </header>
        <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>

        <Section title={t("tokens")}>
          <p className="text-sm text-muted-foreground">{t("tokensNote")}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KURO_SWATCHES.map((swatch) => (
              <figure key={swatch.name} className="flex flex-col gap-1">
                <span
                  aria-hidden="true"
                  className="h-12 rounded-lg ring-1 ring-border"
                  style={{ backgroundColor: swatch.value }}
                />
                <figcaption className="font-mono text-xs text-muted-foreground">
                  {swatch.name} · {swatch.value}
                </figcaption>
              </figure>
            ))}
          </div>
          <Eyebrow size="sm">midori (matcha)</Eyebrow>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MIDORI_SWATCHES.map((swatch) => (
              <figure key={swatch.name} className="flex flex-col gap-1">
                <span
                  aria-hidden="true"
                  className="h-12 rounded-lg ring-1 ring-border"
                  style={{ backgroundColor: swatch.value }}
                />
                <figcaption className="font-mono text-xs text-muted-foreground">
                  {swatch.name} · {swatch.value}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section title={t("buttons")}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">{t("variantPrimary")}</Button>
            <Button variant="secondary">{t("variantSecondary")}</Button>
            <Button variant="ghost">{t("variantGhost")}</Button>
            <Button variant="outline">{t("variantOutline")}</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">{t("sizeSmall")}</Button>
            <Button size="md">{t("sizeMedium")}</Button>
            <Button size="lg">{t("sizeLarge")}</Button>
            <Button loading>{t("loading")}</Button>
            <Button disabled>{t("disabled")}</Button>
          </div>
        </Section>

        <Section title={t("pills")}>
          <div className="flex flex-wrap items-center gap-3">
            <Pill>{t("pillGlass")}</Pill>
            <Pill variant="label">{t("pillLabel")}</Pill>
          </div>
        </Section>

        <Section title={t("eyebrow")}>
          <div className="flex flex-col gap-2">
            <Eyebrow>{tNav("story")}</Eyebrow>
            <Eyebrow size="sm">{tNav("menu")}</Eyebrow>
          </div>
        </Section>

        <Section title={t("price")}>
          <div className="flex flex-wrap items-end gap-6">
            <Price amountToman={180000} locale={priceLocale} size="sm" />
            <Price amountToman={180000} locale={priceLocale} size="md" />
            <Price amountToman={180000} locale={priceLocale} size="lg" />
            <Price
              amountToman={180000}
              originalPriceToman={210000}
              locale={priceLocale}
              size="lg"
            />
          </div>
        </Section>

        <Section title={t("stepper")}>
          <Stepper
            value={qty}
            onChange={setQty}
            min={1}
            max={6}
            decreaseLabel={tBag("decrease")}
            increaseLabel={tBag("increase")}
            valueLabel={tBag("quantity")}
            locale={priceLocale}
          />
        </Section>

        <Section title={t("dialog")}>
          <div>
            <Button onClick={() => setDialogOpen(true)}>{t("openDialog")}</Button>
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              title={tHero("tastingNotes")}
              description={t("dialogBody")}
              closeLabel={tDialog("close")}
            >
              <div className="flex flex-col gap-4">
                <Image
                  src="/images/scenes/original.webp"
                  alt=""
                  width={600}
                  height={335}
                  className="w-full rounded-xl"
                />
                <Price amountToman={180000} locale={priceLocale} size="lg" />
                <Button onClick={() => setDialogOpen(false)}>{t("dialogAction")}</Button>
              </div>
            </Dialog>
          </div>
        </Section>

        <Section title={t("toast")}>
          <ToastDemo />
        </Section>

        <Section title={t("marquee")}>
          <div className="overflow-hidden rounded-xl border border-border bg-secondary py-3">
            <Marquee items={marqueeItems} ariaLabel={t("marquee")} />
          </div>
        </Section>

        <Section title={t("reveal")}>
          <Reveal variant="fade-up" delayMs={300}>
            <p className="rounded-xl bg-secondary p-4">{t("revealText")}</p>
          </Reveal>
          <Reveal variant="fade" delayMs={450}>
            <p className="rounded-xl bg-secondary p-4">{t("revealText")}</p>
          </Reveal>
          <Reveal variant="image">
            <Image
              src="/images/story/bean.webp"
              alt=""
              width={270}
              height={358}
              className="kuro-reveal-media w-40 rounded-2xl"
            />
          </Reveal>
        </Section>

        <Section title={t("wordReveal")}>
          <WordReveal as="h2" text={tHero("title")} className="font-display text-4xl font-black" />
          <WordReveal
            as="h2"
            text={tHero("title")}
            variant="soft"
            className="font-display text-4xl font-black"
          />
        </Section>
      </main>
    </ToastProvider>
  );
}
