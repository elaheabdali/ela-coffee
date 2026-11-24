"use client";

import { useState } from "react";
import { useForm, type Resolver, type ResolverResult } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button, Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
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
}

/**
 * Join-the-list section (#join) — dark section (audit §1.1/§1.2).
 * Phase 6: posts to POST /api/newsletter (Zod email, honeypot,
 * rate-limited). The success state is only shown on a real 200;
 * server errors are shown in the page locale.
 */
export function JoinList() {
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
      const success: ResolverResult<JoinFormValues> = { values: result.data, errors: {} };
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
  } = useForm<JoinFormValues>({ resolver, mode: "onSubmit" });

  const onSubmit = async (values: JoinFormValues): Promise<void> => {
    setServerError(null);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
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
  const emailHelperId = "join-email-helper";

  return (
    <section id="join" className="bg-roast text-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-24 sm:px-12 lg:px-16">
        <div className="flex max-w-2xl flex-col gap-4">
          <Reveal variant="fade-up">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </Reveal>
          <WordReveal
            as="h2"
            text={t("title")}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] font-black tracking-[-0.02em]"
          />
        </div>

        {subscribed ? (
          <div role="status" className="flex max-w-2xl flex-col gap-2">
            <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
            <p className="leading-relaxed text-cream/75">{t("successBody")}</p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex max-w-2xl flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor={emailId} className="text-sm font-medium">
                {t("emailLabel")}
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? `${emailErrorId} ${emailHelperId}` : emailHelperId}
                {...register("email")}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
              {emailError ? (
                <p id={emailErrorId} role="alert" className="text-sm text-destructive">
                  {emailError}
                </p>
              ) : null}
              <p id={emailHelperId} className="text-sm text-cream/60">
                {t("emailHelper")}
              </p>
            </div>
            <div>
              <Button type="submit" disabled={isSubmitting}>
                {t("submit")}
              </Button>
            </div>
            {serverError ? (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            ) : null}
          </form>
        )}

        {/* Reservation form — lives in the Join section area (Phase 6). */}
        <div className="border-t border-cream/10 pt-10">
          <ReservationForm />
        </div>
      </div>
    </section>
  );
}
