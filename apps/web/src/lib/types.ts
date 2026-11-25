/**
 * Shared data-transfer types for the data layer (src/lib/store.ts).
 * Both backends — Prisma/Postgres and the seed-JSON/in-memory
 * fallback — return these shapes, so callers never know which one
 * is active. Dates are ISO strings so the shapes are JSON-safe.
 */

export type Brand = "ela" | "midori";
export type OrderStatus = "RECEIVED" | "PREPARING" | "READY" | "DONE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = ["RECEIVED", "PREPARING", "READY", "DONE"];

export interface DrinkDTO {
  id: string;
  brand: Brand;
  slug: string;
  nameFa: string;
  nameEn: string;
  priceToman: number;
  caffeineMg: number;
  notesFa: string[];
  notesEn: string[];
  image: string;
  sort: number;
}

export interface OrderItemDTO {
  id: string;
  drinkId: string;
  qty: number;
  /** Unit price snapshot at order time (Toman). */
  priceToman: number;
}

export interface OrderDTO {
  id: string;
  status: OrderStatus;
  items: OrderItemDTO[];
  customerName: string;
  phone: string;
  /** Server-computed total (Toman) — never trust the client total. */
  totalToman: number;
  payment: PaymentStatus;
  paymentAuthority: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationDTO {
  id: string;
  name: string;
  phone: string;
  /** ISO date string. */
  date: string;
  guests: number;
  status: ReservationStatus;
  createdAt: string;
}

export interface NewsletterDTO {
  email: string;
  locale: string;
  createdAt: string;
}

export interface ContactDTO {
  id: string;
  name: string;
  /** Email or phone, as the visitor typed it. */
  contact: string;
  message: string;
  createdAt: string;
}
