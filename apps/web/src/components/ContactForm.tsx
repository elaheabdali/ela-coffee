/**
 * Compact contact form — rendered in the footer area (SiteFooter).
 * Posts to POST /api/contact with the SHARED contactSchema (same
 * rules as the server) and locale messages. There is no email
 * sending in v1; messages are stored via the data layer.
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@ela-coffee/ui";
import { zodResolver } from "@/lib/form-resolver";
import { contactSchema, type ContactInput } from "@/lib/schemas";

export function ContactForm() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema, {
      name: t("nameRequired"),
      contact: t("contactInvalid"),
      message: t("messageRequired"),
    }),
    mode: "onSubmit",
    defaultValues: { name: "", contact: "", message: "" },
  });

  const onSubmit = async (values: ContactInput): Promise<void> => {
    setServerError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          contact: values.contact,
          message: values.message,
        }),
      });
      if (!response.ok) {
        setServerError(t("serverError"));
        return;
      }
      setSent(true);
    } catch {
      setServerError(t("serverError"));
    }
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-2">
        <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
        <p className="text-sm leading-relaxed text-cream/70">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-2xl font-bold">{t("title")}</h3>
        <p className="text-sm leading-relaxed text-cream/70">{t("intro")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="text-sm font-medium">
          {t("nameLabel")}
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          {...register("name")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        {errors.name ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-contact" className="text-sm font-medium">
          {t("contactLabel")}
        </label>
        <input
          id="contact-contact"
          type="text"
          autoComplete="email"
          aria-invalid={errors.contact ? true : undefined}
          {...register("contact")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        {errors.contact ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.contact.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-medium">
          {t("messageLabel")}
        </label>
        <textarea
          id="contact-message"
          rows={4}
          aria-invalid={errors.message ? true : undefined}
          {...register("message")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        {errors.message ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.message.message}
          </p>
        ) : null}
      </div>
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
