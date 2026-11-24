/**
 * Shared Zod schemas — imported by both the client forms and the
 * Route Handlers, so validation cannot drift between client and
 * server (architecture §4). API error messages are English codes;
 * the forms show their own translated messages (Phase 5).
 */
import { z } from "zod";
import { isValidIranianPhone, normalizeDigits } from "@ela-coffee/i18n";

/** Honeypot field: bots fill it, humans never see it. Any non-empty value
 * = spam — but that is decided by the route (answer 200, subscribe
 * nothing), so the schema must ACCEPT a filled honeypot; validating
 * it away here would turn the silent-ignore into a 400. */
export const honeypotSchema = z.string().optional();

export const newsletterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Email is invalid"),
  /** Honeypot — must stay empty. */
  website: honeypotSchema,
  locale: z.enum(["fa", "en"]).optional(),
});

export const reservationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .refine((value) => isValidIranianPhone(value), "Phone is not a valid Iranian mobile"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date is invalid")
    .refine((value) => new Date(value).getTime() > Date.now(), "Date must be in the future"),
  guests: z.number().int().min(1, "At least 1 guest").max(12, "At most 12 guests"),
  website: honeypotSchema,
});

export const orderItemSchema = z.object({
  drinkId: z.string().min(1, "Drink id is required"),
  qty: z.number().int().min(1, "Quantity must be at least 1").max(10, "Quantity at most 10"),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required").max(20),
  customerName: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .refine((value) => isValidIranianPhone(value), "Phone is not a valid Iranian mobile"),
  // NOTE: no total field on purpose — the server computes the total
  // from data-layer prices (architecture §9). A total sent by the
  // client is stripped by Zod and ignored.
  website: honeypotSchema,
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  contact: z
    .string()
    .min(1, "Email or phone is required")
    .max(150)
    .refine(
      (value) =>
        z.string().email().safeParse(value).success || isValidIranianPhone(value),
      "Enter a valid email address or Iranian mobile number",
    ),
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
  website: honeypotSchema,
});

/** Normalise an Iranian phone to its canonical Latin-digit form. */
export function canonicalPhone(phone: string): string {
  return normalizeDigits(phone.trim());
}

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
