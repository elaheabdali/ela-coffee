import { describe, expect, it } from "vitest";
import { ALL_DRINKS, BRANDS, getBrandData, getDrink } from "./flavours";

describe("flavours dataset", () => {
  it("has 12 drinks, 6 per brand", () => {
    expect(ALL_DRINKS).toHaveLength(12);
    expect(BRANDS.ela.drinks).toHaveLength(6);
    expect(BRANDS.midori.drinks).toHaveLength(6);
  });

  it("has unique ids and slugs per brand", () => {
    const ids = ALL_DRINKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const brand of ["ela", "midori"] as const) {
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

  it("has a Persian size label for every drink", () => {
    for (const drink of ALL_DRINKS) {
      expect(drink.size).toBe("16 oz iced");
      expect(drink.sizeFa).toBe("۱۶ انس، سرد");
    }
  });

  it("keeps English copy free of Persian script and Persian copy free of Latin letters", () => {
    const persian = /[\u0600-\u06FF]/;
    const latin = /[A-Za-z]/;
    const stripFlag = (s: string) => s.replace(/ ?— ?TODO\(review\)/g, "");
    for (const drink of ALL_DRINKS) {
      for (const field of [drink.nameEn, drink.shortEn, drink.descriptionEn, ...drink.notesEn]) {
        expect(field).not.toMatch(persian);
      }
      for (const field of [
        drink.nameFa,
        drink.shortFa,
        drink.descriptionFa,
        ...drink.notesFa,
      ]) {
        expect(stripFlag(field)).not.toMatch(latin);
      }
    }
  });

  it("flags exactly the 37 uncertain Persian strings with TODO(review)", () => {
    const flagged: string[] = [];
    const walk = (value: unknown): void => {
      if (typeof value === "string") {
        if (value.includes("TODO(review)")) flagged.push(value);
        return;
      }
      if (value && typeof value === "object") {
        for (const child of Object.values(value)) walk(child);
      }
    };
    walk(BRANDS);
    // 12 drink descriptions + 4 story bodies + 2 menu intros +
    // 8 process bodies + 2 origins intros + 4 origin-card intros +
    // 1 midori story title + 1 midori badge caption + 3 midori stat
    // labels (fix batch 6 — the reference wording for the midori story
    // was restored, so its new Persian strings are unreviewed too).
    expect(flagged).toHaveLength(37);
    for (const s of flagged) {
      expect(s).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it("has positive placeholder prices and the reference caffeine values", () => {
    for (const drink of ALL_DRINKS) {
      expect(drink.priceToman).toBeGreaterThan(0);
      expect(drink.caffeineMg).toBe(drink.brand === "ela" ? 150 : 70);
      expect(drink.size).toBe("16 oz iced");
    }
  });

  it("keeps the architecture §14 placeholder prices", () => {
    expect(getDrink("ela", "original")?.priceToman).toBe(180_000);
    expect(getDrink("ela", "mocha")?.priceToman).toBe(205_000);
    expect(getDrink("midori", "blueberry")?.priceToman).toBe(210_000);
    expect(getDrink("midori", "coconut")?.priceToman).toBe(200_000);
  });

  it("looks drinks up by id or slug, and returns undefined when unknown", () => {
    expect(getDrink("ela", "ela-caramel")?.slug).toBe("caramel");
    expect(getDrink("midori", "cherry")?.nameEn).toBe("Dark Cherry");
    expect(getDrink("ela", "nope")).toBeUndefined();
  });

  it("has 4 featured flavours per brand, in the reference's hero group", () => {
    expect(BRANDS.ela.drinks.filter((d) => d.featured).map((d) => d.slug)).toEqual([
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
    for (const brand of ["ela", "midori"] as const) {
      const data = getBrandData(brand);
      expect(data.process.steps).toHaveLength(4);
      expect(data.origins.cards).toHaveLength(2);
      expect(data.marqueeEn).toHaveLength(6);
      expect(data.cutouts).toHaveLength(4);
      // Reference story markup: exactly three stats; the days value
      // lives in the floating badge over the image, not in the stats.
      expect(data.story.stats).toHaveLength(3);
      expect(data.story.badge.valueEn).toMatch(/days$/);
    }
  });

  it("points every drink and step image at a supplied public path", () => {
    for (const drink of ALL_DRINKS) {
      expect(drink.image).toMatch(/^\/images\//);
    }
  });
});
