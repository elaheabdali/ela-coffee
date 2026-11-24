import { describe, expect, it } from "vitest";
import { en, fa } from "./index";

/**
 * Translation-completeness tests (Phase 5): the fa and en dictionaries
 * must cover exactly the same keys, with real translations — no empty
 * strings, no missing-translation markers, no Persian text leaking
 * into en, and no Latin letters leaking into the user-facing fa copy
 * (interpolation placeholders like {name} are stripped first).
 */

type Leaf = { path: string; value: string };

function leaves(obj: unknown, prefix = ""): Leaf[] {
  const out: Leaf[] = [];
  if (typeof obj === "string") {
    out.push({ path: prefix, value: obj });
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const [key, child] of Object.entries(obj)) {
      out.push(...leaves(child, prefix ? `${prefix}.${key}` : key));
    }
  }
  return out;
}

const faLeaves = leaves(fa);
const enLeaves = leaves(en);
const faPaths = faLeaves.map((l) => l.path).sort();
const enPaths = enLeaves.map((l) => l.path).sort();

/** User-facing namespaces (the dev-only designSystem catalog is exempt:
 * its notes name Latin tokens and keyboard keys like "Esc"). */
const USER_FACING = ["nav", "hero", "menu", "join", "footer", "bag", "dialog", "drawer", "notFound"];
const isUserFacing = (path: string) => USER_FACING.some((ns) => path.startsWith(`${ns}.`));

describe("dictionaries: completeness", () => {
  it("cover exactly the same keys in fa and en", () => {
    expect(faPaths).toEqual(enPaths);
    expect(faPaths.length).toBeGreaterThan(60);
  });

  it("have no empty strings", () => {
    for (const leaf of [...faLeaves, ...enLeaves]) {
      expect(leaf.value.trim().length, leaf.path).toBeGreaterThan(0);
    }
  });

  it("have no value that equals its own key name and no TODO markers", () => {
    for (const leaf of [...faLeaves, ...enLeaves]) {
      const keyName = leaf.path.split(".").at(-1) ?? "";
      expect(leaf.value, leaf.path).not.toBe(keyName);
      expect(leaf.value, leaf.path).not.toContain("TODO");
    }
  });
});

describe("dictionaries: script separation", () => {
  it("has no Persian script in any en string", () => {
    for (const leaf of enLeaves) {
      expect(leaf.value, leaf.path).not.toMatch(/[\u0600-\u06FF]/);
    }
  });

  it("has no Latin letters in user-facing fa strings (placeholders stripped)", () => {
    for (const leaf of faLeaves.filter((l) => isUserFacing(l.path))) {
      const stripped = leaf.value.replace(/\{[^}]*\}/g, "");
      expect(stripped, leaf.path).not.toMatch(/[A-Za-z]/);
    }
  });
});
