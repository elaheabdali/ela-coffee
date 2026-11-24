/**
 * Prisma seed — the 12 drinks from the single source of truth,
 * src/data/flavours.ts (architecture §7). The seed never duplicates
 * the data: it imports the dataset and upserts it, so the DB and the
 * static page can never disagree.
 *
 * Run:  pnpm --filter web db:seed   (needs DATABASE_URL, see
 * docs/fa/phase-06-backend.md — no database exists yet in this
 * environment, so this script refuses to run without one).
 */
import { PrismaClient } from "@prisma/client";
import { ALL_DRINKS } from "../src/data/flavours";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a free Neon project and copy its " +
        "connection string into apps/web/.env.local (see docs/fa/phase-06-backend.md).",
    );
  }
  for (const [index, drink] of ALL_DRINKS.entries()) {
    await prisma.drink.upsert({
      where: { id: drink.id },
      update: {
        brand: drink.brand === "kuro" ? "KURO" : "MIDORI",
        slug: drink.slug,
        nameFa: drink.nameFa,
        nameEn: drink.nameEn,
        priceToman: drink.priceToman,
        caffeineMg: drink.caffeineMg,
        notesFa: drink.notesFa,
        notesEn: drink.notesEn,
        image: drink.image,
        sort: index,
      },
      create: {
        id: drink.id,
        brand: drink.brand === "kuro" ? "KURO" : "MIDORI",
        slug: drink.slug,
        nameFa: drink.nameFa,
        nameEn: drink.nameEn,
        priceToman: drink.priceToman,
        caffeineMg: drink.caffeineMg,
        notesFa: drink.notesFa,
        notesEn: drink.notesEn,
        image: drink.image,
        sort: index,
      },
    });
  }
  console.log(`Seeded ${ALL_DRINKS.length} drinks.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
