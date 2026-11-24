/**
 * Reservation form — small table-booking form (architecture §6, §14.5).
 * Lives in the Join section area (rendered by JoinList, below the
 * newsletter form). Posts to POST /api/reservations with the SHARED
 * reservationSchema (same rules as the server) and locale messages.
 * On success it shows the reservation date (Jalali) — the reservation
 * id is kept in the response for a future status lookup.
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { formatJalali } from "@ela-coffee/i18n";
import { Button, Stepper } from "@ela-coffee/ui";
import { zodResolver } from "@/lib/form-resolver";
import { reservationSchema, type ReservationInput } from "@/lib/schemas";
import type { ReservationDTO } from "@/lib/types";

export function ReservationForm() {
  const t = useTranslations("reservation");
  const tBag = useTranslations("bag");
  const locale = useLocale();
  const [reservation, setReservation] = useState<ReservationDTO | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema, {
      name: t("nameRequired"),
      phone: t("phoneInvalid"),
      date: t("dateInvalid"),
      guests: t("guestsLabel"),
    }),
    mode: "onSubmit",
    defaultValues: { name: "", phone: "", date: "", guests: 2 },
  });

  const guests = watch("guests");

  const onSubmit = async (values: ReservationInput): Promise<void> => {
    setServerError(null);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          date: values.date,
          guests: values.guests,
        }),
      });
      const data = (await response.json()) as { reservation?: ReservationDTO };
      if (!response.ok || !data.reservation) {
        setServerError(t("serverError"));
        return;
      }
      setReservation(data.reservation);
    } catch {
      setServerError(t("serverError"));
    }
  };

  if (reservation) {
    return (
      <div role="status" className="flex max-w-2xl flex-col gap-2">
        <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
        <p className="leading-relaxed text-cream/75">
          {t("successBody", {
            date: formatJalali(new Date(reservation.date), locale === "en" ? "en" : "fa"),
          })}
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-2xl font-bold">{t("title")}</h3>
        <p className="text-sm leading-relaxed text-cream/70">{t("intro")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="reservation-name" className="text-sm font-medium">
          {t("nameLabel")}
        </label>
        <input
          id="reservation-name"
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
        <label htmlFor="reservation-phone" className="text-sm font-medium">
          {t("phoneLabel")}
        </label>
        <input
          id="reservation-phone"
          type="tel"
          autoComplete="tel"
          dir="ltr"
          placeholder="09123456789"
          aria-invalid={errors.phone ? true : undefined}
          {...register("phone")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        {errors.phone ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="reservation-date" className="text-sm font-medium">
          {t("dateLabel")}
        </label>
        <input
          id="reservation-date"
          type="datetime-local"
          aria-invalid={errors.date ? true : undefined}
          {...register("date")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        {errors.date ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.date.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <span id="reservation-guests-label" className="text-sm font-medium">
          {t("guestsLabel")}
        </span>
        <Stepper
          value={guests}
          min={1}
          max={12}
          onChange={(next) => setValue("guests", next, { shouldValidate: true })}
          decreaseLabel={tBag("decrease")}
          increaseLabel={tBag("increase")}
          valueLabel={t("guestsLabel")}
          locale={locale === "en" ? "en" : "fa"}
        />
        {errors.guests ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.guests.message}
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
