import { describe, expect, it, vi } from "vitest";

// next/font/local has no runtime value to test here — the layout only
// needs its CSS-variable class names.
vi.mock("next/font/local", () => ({
  default: () => ({ variable: "mock-font-var" }),
}));

vi.mock("next-intl/server", () => ({
  getMessages: async () => ({}),
  setRequestLocale: () => undefined,
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, hasLocale: () => true };
});

import LocaleLayout from "./layout";

/**
 * The locale layout sets lang/dir on <html> (architecture §10).
 * The layout is called as a function and its returned element's props
 * are asserted — no DOM rendering of an <html> element is needed.
 */
describe("locale layout (Phase 5)", () => {
  it("sets lang=fa and dir=rtl for fa", async () => {
    const el = await LocaleLayout({
      params: Promise.resolve({ locale: "fa" }),
      children: null,
    });
    expect(el.props.lang).toBe("fa");
    expect(el.props.dir).toBe("rtl");
  });

  it("sets lang=en and dir=ltr for en", async () => {
    const el = await LocaleLayout({
      params: Promise.resolve({ locale: "en" }),
      children: null,
    });
    expect(el.props.lang).toBe("en");
    expect(el.props.dir).toBe("ltr");
  });
});
