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

  it("flags exactly the 75 uncertain Persian strings with TODO(review)", () => {
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
    // 12 drink descriptions + 36 tasting notes + 4 story bodies +
    // 2 menu intros + 8 process bodies + 2 origins intros +
    // 4 origin-card intros + 1 midori story title + 1 midori badge
    // caption + 3 midori stat labels + 2 midori origin-note values
    // (batch 9: the reference's "Umami, sweet grass" / "Floral,
    // sweet pea" replaced the invented "Umami, seaweed" /
    // "Grass, green apple", so their fa values are unreviewed).
    // The tasting notes were never flagged before fix batch 7; the
    // menu rebuild restored the reference's note wording, so all 36
    // fa notes are unreviewed.
    expect(flagged).toHaveLength(75);
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

  it("gives every drink a sprite-sheet cell on its brand's sheet (fix batch 7)", () => {
    // The reference crops one cell of a 3×2 sprite sheet per card:
    // inner span 390% × 260% with left in {-15, -145, -275} and
    // top in {-15, -145} (percent). The offsets are keyed by drink,
    // not by index, so reordering never remaps a tile.
    const xs = new Set([-15, -145, -275]);
    const ys = new Set([-15, -145]);
    for (const drink of ALL_DRINKS) {
      expect(xs.has(drink.sprite.x)).toBe(true);
      expect(ys.has(drink.sprite.y)).toBe(true);
    }
    expect(BRANDS.ela.spriteSheet).toBe("/images/ingredients.webp");
    // Midori's sheet is the cream-background version keyed from the
    // supplied blue-key art (fix7-check/key-v2-cream.py): the raw
    // v2-key sheet is the same 6 ingredients on a blue screen, while
    // the reference sheet — and the thumbnails — are on cream.
    expect(BRANDS.midori.spriteSheet).toBe("/images/ingredients-v2.webp");
    // Each brand shows 6 different cells, one per drink.
    for (const brand of ["ela", "midori"] as const) {
      const cells = BRANDS[brand].drinks.map((d) => `${d.sprite.x},${d.sprite.y}`);
      expect(new Set(cells).size).toBe(6);
    }
  });

  it("gives every drink a transparent hero cut-out matching its sprite cell (hero cutout fix)", () => {
    // Verified against the sheets: coffee (ingredients.webp, cream)
    // is beans/caramel/vanilla on the top row and hazelnut/
    // chocolate/cinnamon below; matcha (ingredients-v2-key.jpg,
    // blue) is matcha/strawberry/blueberry on top and blackberry/
    // cherry/coconut below. The wheel renders the cut-out, not the
    // sprite cell, so the ingredient floats bare on the dark hero
    // like the reference (whose blue sheet is keyed out by its
    // feColorMatrix filter); the menu thumbnails keep the sprite.
    const expectedCutout: Record<string, string> = {
      "ela-original": "coffee-beans",
      "ela-caramel": "coffee-caramel",
      "ela-vanilla": "coffee-vanilla",
      "ela-hazelnut": "coffee-hazelnut",
      "ela-mocha": "coffee-chocolate",
      "ela-cinnamon": "coffee-cinnamon",
      "midori-original": "matcha-matcha",
      "midori-strawberry": "matcha-strawberry",
      "midori-blueberry": "matcha-blueberry",
      "midori-blackberry": "matcha-blackberry",
      "midori-cherry": "matcha-cherry",
      "midori-coconut": "matcha-coconut",
    };
    for (const drink of ALL_DRINKS) {
      expect(drink.cutout).toBe(`/images/cutouts/${expectedCutout[drink.id]}.webp`);
    }
    // One distinct cut-out per drink.
    expect(new Set(ALL_DRINKS.map((d) => d.cutout)).size).toBe(12);
  });

  it("offers Coconut milk for matcha and Almond for coffee (fix batch 7)", () => {
    const milk = (brand: "ela" | "midori") =>
      BRANDS[brand].makeItYours.find((g) => g.labelEn === "Milk");
    expect(milk("ela")?.optionsEn).toEqual(["Whole", "Oat", "Almond"]);
    expect(milk("midori")?.optionsEn).toEqual(["Whole", "Oat", "Coconut"]);
    expect(milk("midori")?.optionsFa).toEqual(["کامل", "جو دوسر", "نارگیل"]);
  });
});
