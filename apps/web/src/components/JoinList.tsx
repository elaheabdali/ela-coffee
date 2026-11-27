"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, type Resolver, type ResolverResult } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";
import { ReservationForm } from "@/components/ReservationForm";

/**
 * Zod jitless (SECURITY.md §3): this component builds a schema at
 * render time and does not import the shared schemas module, so it
 * sets the flag itself — otherwise Zod v4's JIT probe (`Function("")`)
 * runs before the shared module loads and logs a CSP violation.
 * See src/lib/schemas.ts for the full explanation.
 */
z.config({ jitless: true });

interface JoinFormValues {
  email: string;
  /** Honeypot — must stay empty; bots fill it, humans never see it. */
  company: string;
}

/**
 * Join section (#join) — rebuilt class-for-class from the reference
 * markup (fix batch 9, ref-join.html): a crema rounded card with
 * floating ingredient-sprite tiles, WordReveal h2, the newsletter
 * form only (email + honeypot + hint), and — a deliberate deviation
 * from the reference, which has no reservation form — the existing
 * ReservationForm kept below the card as a separate block inside
 * #join, with its /api/reservations behaviour unchanged.
 *
 * Deliberate deviations from the reference's literal classes:
 * - `font-display` is our theme's Fraunces (the reference's
 *   `font-heading font-soft` has no equivalent token here).
 * - The sprite tiles use logical `end-`/`start-` positions instead
 *   of the reference's physical `right-`/`left-`, so in fa (RTL)
 *   they sit opposite the text column instead of overlapping it.
 * - `animate-ela-float` is our renamed `kuro-float` (same 7s
 *   keyframes; `kuro-float` does not exist in our CSS).
 * - The honeypot input's name is `join-company` (its id in the
 *   reference, whose name is the generic `company`); the value is
 *   posted as the API's `website` honeypot field, so the existing
 *   /api/newsletter wiring is unchanged.
 * - Contrast bumps on the crema card (measured against the WCAG AA
 *   4.5:1 minimum for small text): eyebrow `text-espresso/60`
 *   (3.73:1 ela / 3.70:1 midori) → `/75` (5.43:1 / 5.46:1), hint
 *   `text-espresso/65` (4.25:1 / 4.23:1) → `/75`, and error text
 *   uses `text-red-950` — `text-destructive` measures 2.13:1 /
 *   2.51:1 on crema. The placeholder keeps the reference's
 *   `placeholder:text-espresso/45` (typed text is full-strength
 *   espresso on cream, 16.50:1 ela / 15.75:1 midori).
 * - The `--reveal-delay` values live on the `Reveal` wrappers
 *   (the reference puts them on the inner elements).
 */
export function JoinList() {
  const { brand } = useBrand();
  const t = useTranslations("join");
  const [subscribed, setSubscribed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // @hookform/resolvers is not installed, so the Zod schema is run
  // through a small inline resolver with the same contract.
  const schema = z.object({
    email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
  });
  const resolver: Resolver<JoinFormValues> = async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      const success: ResolverResult<JoinFormValues> = {
        // The email schema strips the unvalidated honeypot field, so
        // carry it through explicitly.
        values: { ...result.data, company: values.company },
        errors: {},
      };
      return success;
    }
    const failure: ResolverResult<JoinFormValues> = {
      values: {},
      errors: {
        email: {
          type: "validation",
          message: result.error.issues[0]?.message ?? t("emailInvalid"),
        },
      },
    };
    return failure;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinFormValues>({ resolver, mode: "onSubmit", defaultValues: { company: "" } });

  const onSubmit = async (values: JoinFormValues): Promise<void> => {
    setServerError(null);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The honeypot posts under the API's `website` field name
        // (newsletterSchema) — the form field is `join-company`.
        body: JSON.stringify({ email: values.email, website: values.company }),
      });
      if (!response.ok) {
        setServerError(t("serverError"));
        return;
      }
      setSubscribed(true);
    } catch {
      setServerError(t("serverError"));
    }
  };

  const emailError = errors.email?.message;
  const emailId = "join-email";
  const emailErrorId = "join-email-error";
  const emailHelperId = "join-hint";
  const spriteSheet = BRANDS[brand].spriteSheet;

  /**
   * Floating sprite tiles (reference ref-join.html): three cells of
   * the brand's 3×2 ingredient sheet (390% × 260% inner span), each
   * floating with a staggered delay. Offsets are (x, y) percents of
   * the inner span, as in the menu-card thumbnails.
   */
  const tiles = [
    { className: "absolute start-6 top-0 size-32 -rotate-12", floatDelay: "0s", revealDelay: 300, x: -145, y: -15 },
    { className: "absolute end-0 top-14 size-36 rotate-[9deg]", floatDelay: "-2.4s", revealDelay: 450, x: -275, y: -15 },
    { className: "absolute bottom-0 start-24 size-28 rotate-6", floatDelay: "-4.8s", revealDelay: 600, x: -145, y: -145 },
  ];

  return (
    <section id="join" aria-labelledby="join-title" className="bg-background px-3 pb-24 sm:px-6 lg:pb-32">
      <Reveal
        variant="fade-up"
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-crema px-6 py-16 text-espresso sm:px-12 sm:py-20 lg:px-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute end-12 top-1/2 hidden h-80 w-96 -translate-y-1/2 lg:block xl:end-24"
        >
          {tiles.map((tile) => (
            <Reveal
              key={`${tile.x},${tile.y}`}
              variant="fade-up"
              delayMs={tile.revealDelay}
              className={tile.className}
            >
              <span className="animate-ela-float block size-full" style={{ animationDelay: tile.floatDelay }}>
                <span className="relative block size-full overflow-hidden rounded-[24%] bg-cream shadow-[0_30px_50px_-24px_rgb(0_0_0/0.45)] ring-1 ring-black/10">
                  <span className="absolute inset-0 block">
                    <span
                      className="absolute block"
                      style={{
                        width: "390%",
                        height: "260%",
                        left: `${tile.x}%`,
                        top: `${tile.y}%`,
                      }}
                    >
                      <Image
                        src={spriteSheet}
                        alt=""
                        draggable={false}
                        fill
                        sizes="(max-width: 639px) 320px, 800px"
                        className="object-cover"
                      />
                    </span>
                  </span>
                </span>
              </span>
            </Reveal>
          ))}
        </div>
        <div className="relative max-w-xl">
          <Reveal variant="fade-up" delayMs={100}>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-espresso/75">
              {t("eyebrow")}
            </p>
          </Reveal>
          <WordReveal
            as="h2"
            id="join-title"
            text={t("title")}
            delayMs={180}
            className="mt-4 text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.03em]"
          />
          <Reveal variant="fade-up" delayMs={360}>
            <p className="mt-5 text-base leading-relaxed text-espresso/75 sm:text-lg">
              {t("intro")}
            </p>
          </Reveal>
          <Reveal variant="fade-up" delayMs={480}>
            {subscribed ? (
              <div role="status" className="mt-8 flex max-w-lg flex-col gap-2">
                <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
                <p className="leading-relaxed text-espresso/75">{t("successBody")}</p>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit(onSubmit)} className="relative mt-8 max-w-lg">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label htmlFor={emailId} className="sr-only">
                    {t("emailLabel")}
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="you@example.com"
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? `${emailErrorId} ${emailHelperId}` : emailHelperId}
                    {...register("email")}
                    className="h-13 min-w-0 flex-1 rounded-full border border-espresso/15 bg-cream px-5 text-base text-espresso outline-none transition-[border-color,box-shadow] placeholder:text-espresso/45 focus-visible:border-espresso focus-visible:ring-2 focus-visible:ring-espresso/25"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-13 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-espresso px-6 text-sm font-semibold text-cream transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso disabled:cursor-wait disabled:opacity-80"
                  >
                    {t("submit")}
                  </button>
                </div>
                <div aria-hidden="true" className="absolute -left-[9999px] top-0 size-px overflow-hidden">
                  <label htmlFor="join-company">Company</label>
                  <input
                    id="join-company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    {...register("company")}
                    name="join-company"
                  />
                </div>
                <p id={emailHelperId} className="mt-3 px-1 text-sm text-espresso/75">
                  {t("emailHelper")}
                </p>
                {emailError ? (
                  <p id={emailErrorId} role="alert" className="mt-2 px-1 text-sm font-medium text-red-950">
                    {emailError}
                  </p>
                ) : null}
                {serverError ? (
                  <p role="alert" className="mt-2 px-1 text-sm font-medium text-red-950">
                    {serverError}
                  </p>
                ) : null}
              </form>
            )}
          </Reveal>
        </div>
      </Reveal>

      {/* Reservation form — not in the reference Join; kept below the
          crema card as a separate block inside #join (batch 9
          decision), with its /api/reservations behaviour unchanged. */}
      <div className="mx-auto mt-16 max-w-7xl lg:mt-20">
        <ReservationForm />
      </div>
    </section>
  );
}
