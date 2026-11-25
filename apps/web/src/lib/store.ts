/**
 * Repository — the only place the app touches data.
 *
 * Two backends, one interface (architecture §7, ADR-05):
 * - With DATABASE_URL set: real Postgres via Prisma.
 * - Without it: the seed-JSON/in-memory fallback (memory-store.ts),
 *   dev/demo only — data resets on restart.
 *
 * Prices are ALWAYS re-read from the data layer here. The client
 * never sends a total; createOrder() computes it from the drink
 * prices, so a forged total in a request body is ignored.
 */
import type { Drink as PrismaDrink, Order as PrismaOrder } from "@prisma/client";
import { getPrisma, hasDatabase } from "./db";
import { createId, memoryStore } from "./memory-store";
import type {
  Brand,
  ContactDTO,
  DrinkDTO,
  NewsletterDTO,
  OrderDTO,
  OrderStatus,
  PaymentStatus,
  ReservationDTO,
  ReservationStatus,
} from "./types";

export { hasDatabase };

function toDrinkDTO(drink: PrismaDrink): DrinkDTO {
  return {
    id: drink.id,
    // "KURO" is the Postgres Brand-enum label (storage only, never
    // user-visible): the Phase 12 rebrand renamed the app brand to
    // "ela" but deliberately left the enum value alone — see
    // docs/architecture.md §7. The API only ever emits "ela".
    brand: drink.brand === "KURO" ? "ela" : "midori",
    slug: drink.slug,
    nameFa: drink.nameFa,
    nameEn: drink.nameEn,
    priceToman: drink.priceToman,
    caffeineMg: drink.caffeineMg,
    notesFa: [...drink.notesFa],
    notesEn: [...drink.notesEn],
    image: drink.image,
    sort: drink.sort,
  };
}

type PrismaOrderWithItems = PrismaOrder & {
  items: { id: string; drinkId: string; qty: number; priceToman: number }[];
};

function toOrderDTO(order: PrismaOrderWithItems): OrderDTO {
  return {
    id: order.id,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      drinkId: item.drinkId,
      qty: item.qty,
      priceToman: item.priceToman,
    })),
    customerName: order.customerName,
    phone: order.phone,
    totalToman: order.totalToman,
    payment: order.payment,
    paymentAuthority: order.paymentAuthority,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function getDrinks(): Promise<DrinkDTO[]> {
  if (!hasDatabase()) return memoryStore.getDrinks();
  const drinks = await getPrisma().drink.findMany({ orderBy: { sort: "asc" } });
  return drinks.map(toDrinkDTO);
}

export async function getDrink(id: string): Promise<DrinkDTO | null> {
  if (!hasDatabase()) return memoryStore.getDrink(id);
  const drink = await getPrisma().drink.findUnique({ where: { id } });
  return drink ? toDrinkDTO(drink) : null;
}

export interface CreateOrderInput {
  items: { drinkId: string; qty: number }[];
  customerName: string;
  phone: string;
}

export async function getOrderByIdempotencyKey(key: string): Promise<OrderDTO | null> {
  if (!hasDatabase()) return memoryStore.getOrderByIdempotencyKey(key);
  const order = await getPrisma().order.findUnique({
    where: { idempotencyKey: key },
    include: { items: true },
  });
  return order ? toOrderDTO(order) : null;
}

/**
 * Creates an order. The total is computed here from the data-layer
 * prices — any total sent by the client is ignored. Throws when an
 * item references an unknown drink.
 */
export async function createOrder(
  input: CreateOrderInput,
  idempotencyKey?: string,
): Promise<OrderDTO> {
  const drinks = await getDrinks();
  const byId = new Map(drinks.map((d) => [d.id, d]));
  let totalToman = 0;
  const pricedItems = input.items.map((item) => {
    const drink = byId.get(item.drinkId);
    if (!drink) throw new Error(`Unknown drink: ${item.drinkId}`);
    totalToman += drink.priceToman * item.qty;
    return { drinkId: item.drinkId, qty: item.qty, priceToman: drink.priceToman };
  });

  if (!hasDatabase()) {
    const now = new Date().toISOString();
    const order: OrderDTO = {
      id: createId(),
      status: "RECEIVED",
      items: pricedItems.map((item) => ({ id: createId(), ...item })),
      customerName: input.customerName,
      phone: input.phone,
      totalToman,
      payment: "PENDING",
      paymentAuthority: null,
      createdAt: now,
      updatedAt: now,
    };
    return memoryStore.createOrder(order, idempotencyKey);
  }

  const created = await getPrisma().order.create({
    data: {
      customerName: input.customerName,
      phone: input.phone,
      totalToman,
      idempotencyKey: idempotencyKey ?? undefined,
      items: { create: pricedItems },
    },
    include: { items: true },
  });
  return toOrderDTO(created);
}

export async function getOrder(id: string): Promise<OrderDTO | null> {
  if (!hasDatabase()) return memoryStore.getOrder(id);
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: { items: true },
  });
  return order ? toOrderDTO(order) : null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderDTO | null> {
  if (!hasDatabase()) return memoryStore.updateOrderStatus(id, status);
  try {
    const updated = await getPrisma().order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return toOrderDTO(updated);
  } catch {
    return null;
  }
}

export async function updateOrderPayment(
  id: string,
  payment: PaymentStatus,
  authority: string | null,
): Promise<OrderDTO | null> {
  if (!hasDatabase()) return memoryStore.updateOrderPayment(id, payment, authority);
  try {
    const updated = await getPrisma().order.update({
      where: { id },
      data: { payment, paymentAuthority: authority },
      include: { items: true },
    });
    return toOrderDTO(updated);
  } catch {
    return null;
  }
}

export interface CreateReservationInput {
  name: string;
  phone: string;
  date: Date;
  guests: number;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<ReservationDTO> {
  if (!hasDatabase()) {
    const now = new Date().toISOString();
    return memoryStore.createReservation({
      id: createId(),
      name: input.name,
      phone: input.phone,
      date: input.date.toISOString(),
      guests: input.guests,
      status: "PENDING",
      createdAt: now,
    });
  }
  const created = await getPrisma().reservation.create({ data: input });
  return {
    id: created.id,
    name: created.name,
    phone: created.phone,
    date: created.date.toISOString(),
    guests: created.guests,
    status: created.status as ReservationStatus,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getReservation(id: string): Promise<ReservationDTO | null> {
  if (!hasDatabase()) return memoryStore.getReservation(id);
  const reservation = await getPrisma().reservation.findUnique({ where: { id } });
  if (!reservation) return null;
  return {
    id: reservation.id,
    name: reservation.name,
    phone: reservation.phone,
    date: reservation.date.toISOString(),
    guests: reservation.guests,
    status: reservation.status as ReservationStatus,
    createdAt: reservation.createdAt.toISOString(),
  };
}

/** Returns true when the email was newly subscribed (false = already on the list). */
export async function subscribeNewsletter(
  email: string,
  locale: string,
): Promise<{ created: boolean }> {
  if (!hasDatabase()) return memoryStore.subscribeNewsletter(email, locale);
  const existing = await getPrisma().newsletterSubscriber.findUnique({ where: { email } });
  if (existing) return { created: false };
  await getPrisma().newsletterSubscriber.create({ data: { email, locale } });
  return { created: true };
}

export async function createContactMessage(input: {
  name: string;
  contact: string;
  message: string;
}): Promise<ContactDTO> {
  if (!hasDatabase()) {
    return memoryStore.createContact({
      id: createId(),
      ...input,
      createdAt: new Date().toISOString(),
    });
  }
  const created = await getPrisma().contactMessage.create({ data: input });
  return {
    id: created.id,
    name: created.name,
    contact: created.contact,
    message: created.message,
    createdAt: created.createdAt.toISOString(),
  };
}

export type { Brand, DrinkDTO, NewsletterDTO, OrderDTO, ReservationDTO };
