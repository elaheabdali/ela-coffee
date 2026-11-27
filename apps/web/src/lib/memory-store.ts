/**
 * In-memory fallback store (dev/demo ONLY).
 *
 * Used when DATABASE_URL is unset — i.e. on this machine and on any
 * fresh checkout without a Neon project. It serves the exact same
 * 12-drink dataset (from src/data/flavours.ts) and keeps orders,
 * reservations, newsletter signups and contact messages in module-level
 * Maps that RESET ON RESTART. This is not production behaviour and
 * must never be mistaken for it: data does not survive a restart, is
 * not shared between server instances, and has no durability at all.
 *
 * Every caller goes through src/lib/store.ts, which picks this store
 * or Prisma based on hasDatabase(). resetMemoryStore() exists for
 * tests only.
 */
import { ALL_DRINKS } from "@/data/flavours";
import type {
  ContactDTO,
  DrinkDTO,
  NewsletterDTO,
  OrderDTO,
  OrderStatus,
  ReservationDTO,
} from "./types";

export function createId(): string {
  return crypto.randomUUID();
}

function drinkToDTO(drink: (typeof ALL_DRINKS)[number], sort: number): DrinkDTO {
  return {
    id: drink.id,
    brand: drink.brand,
    slug: drink.slug,
    nameFa: drink.nameFa,
    nameEn: drink.nameEn,
    priceToman: drink.priceToman,
    caffeineMg: drink.caffeineMg,
    notesFa: [...drink.notesFa],
    notesEn: [...drink.notesEn],
    image: drink.image,
    sort,
  };
}

/** The seed drinks, in the same order as the DB seed. */
export function memoryDrinks(): DrinkDTO[] {
  return ALL_DRINKS.map((drink, index) => drinkToDTO(drink, index));
}

const orders = new Map<string, OrderDTO>();
const idempotencyKeys = new Map<string, string>();
const reservations = new Map<string, ReservationDTO>();
const subscribers = new Map<string, NewsletterDTO>();
const contacts: ContactDTO[] = [];

/** Test-only: wipe all in-memory state. */
export function resetMemoryStore(): void {
  orders.clear();
  idempotencyKeys.clear();
  reservations.clear();
  subscribers.clear();
  contacts.length = 0;
}

export const memoryStore = {
  getDrinks: (): DrinkDTO[] => memoryDrinks(),

  getDrink: (id: string): DrinkDTO | null => memoryDrinks().find((d) => d.id === id) ?? null,

  createOrder: (order: OrderDTO, idempotencyKey?: string): OrderDTO => {
    orders.set(order.id, order);
    if (idempotencyKey) idempotencyKeys.set(idempotencyKey, order.id);
    return order;
  },

  getOrderByIdempotencyKey: (key: string): OrderDTO | null => {
    const id = idempotencyKeys.get(key);
    return id ? (orders.get(id) ?? null) : null;
  },

  getOrder: (id: string): OrderDTO | null => orders.get(id) ?? null,

  /** The payment callback resolves the order from its authority. */
  getOrderByAuthority: (authority: string): OrderDTO | null => {
    for (const order of orders.values()) {
      if (order.paymentAuthority === authority) return order;
    }
    return null;
  },

  updateOrderStatus: (id: string, status: OrderStatus): OrderDTO | null => {
    const order = orders.get(id);
    if (!order) return null;
    const updated: OrderDTO = { ...order, status, updatedAt: new Date().toISOString() };
    orders.set(id, updated);
    return updated;
  },

  updateOrderPayment: (
    id: string,
    payment: OrderDTO["payment"],
    authority: string | null,
  ): OrderDTO | null => {
    const order = orders.get(id);
    if (!order) return null;
    const updated: OrderDTO = {
      ...order,
      payment,
      paymentAuthority: authority,
      updatedAt: new Date().toISOString(),
    };
    orders.set(id, updated);
    return updated;
  },

  createReservation: (reservation: ReservationDTO): ReservationDTO => {
    reservations.set(reservation.id, reservation);
    return reservation;
  },

  getReservation: (id: string): ReservationDTO | null => reservations.get(id) ?? null,

  subscribeNewsletter: (email: string, locale: string): { created: boolean } => {
    if (subscribers.has(email)) return { created: false };
    subscribers.set(email, { email, locale, createdAt: new Date().toISOString() });
    return { created: true };
  },

  subscriberCount: (): number => subscribers.size,

  /** Test-only: how many contact messages were stored. */
  contactCount: (): number => contacts.length,

  createContact: (contact: ContactDTO): ContactDTO => {
    contacts.push(contact);
    return contact;
  },
};
