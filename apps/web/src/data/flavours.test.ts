import { describe, expect, it } from "vitest";
import { ALL_DRINKS, BRANDS, getBrandData, getDrink } from "./flavours";

describe("flavours dataset", () => {
  it("has 12 drinks, 6 per brand", () => {
    expect(ALL_DRINKS).toHaveLength(12);
    expect(BRANDS.kuro.drinks).toHaveLength(6);
    expect(BRANDS.midori.drinks).toHaveLength(6);
  });

  it("has unique ids and slugs per brand", () => {
    const ids = ALL_DRINKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const brand of ["kuro", "midori"] as const) {
      const slugs = BRANDS[brand].drinks.map((d) => d.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("gives every drink exactly 3 tasting notes in both languages", () => {
    for (const drink of ALL_DRINKS) {
      expect(drink.notesEn).toHaveLength(3);
      expect(drink.notesFa).toHaveLength(3);
    }
  });

  it("has positive placeholder prices and the reference caffeine values", () => {
    for (const drink of ALL_DRINKS) {
      expect(drink.priceToman).toBeGreaterThan(0);
      expect(drink.caffeineMg).toBe(drink.brand === "kuro" ? 150 : 70);
      expect(drink.size).toBe("16 oz iced");
    }
  });

  it("keeps the architecture §14 placeholder prices", () => {
    expect(getDrink("kuro", "original")?.priceToman).toBe(180_000);
    expect(getDrink("kuro", "mocha")?.priceToman).toBe(205_000);
    expect(getDrink("midori", "blueberry")?.priceToman).toBe(210_000);
    expect(getDrink("midori", "coconut")?.priceToman).toBe(200_000);
  });

  it("looks drinks up by id or slug, and returns undefined when unknown", () => {
    expect(getDrink("kuro", "kuro-caramel")?.slug).toBe("caramel");
    expect(getDrink("midori", "cherry")?.nameEn).toBe("Dark Cherry");
    expect(getDrink("kuro", "nope")).toBeUndefined();
  });

  it("has 4 featured flavours per brand, in the reference's hero group", () => {
    expect(BRANDS.kuro.drinks.filter((d) => d.featured).map((d) => d.slug)).toEqual([
      "caramel",
      "vanilla",
      "mocha",
      "cinnamon",
    ]);
    expect(BRANDS.midori.drinks.filter((d) => d.featured).map((d) => d.slug)).toEqual([
      "blueberry",
      "cherry",
      "blackberry",
      "strawberry",
    ]);
  });

  it("has 4 process steps, 2 origins and a marquee per brand", () => {
    for (const brand of ["kuro", "midori"] as const) {
      const data = getBrandData(brand);
      expect(data.process.steps).toHaveLength(4);
      expect(data.origins.cards).toHaveLength(2);
      expect(data.marqueeEn).toHaveLength(6);
      expect(data.cutouts).toHaveLength(4);
      expect(data.story.stats).toHaveLength(4);
    }
  });

  it("points every drink and step image at a supplied public path", () => {
    for (const drink of ALL_DRINKS) {
      expect(drink.image).toMatch(/^\/images\//);
    }
  });
});
