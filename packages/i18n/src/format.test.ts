import { describe, expect, it } from "vitest";
import { formatJalali, formatToman, isValidIranianPhone, normalizeDigits, toFaDigits } from "./format";

describe("formatToman", () => {
  it("formats Toman with Persian digits in fa", () => {
    expect(formatToman(180000, "fa")).toBe("۱۸۰٬۰۰۰ تومان");
  });

  it("formats Toman with Latin digits in en", () => {
    expect(formatToman(180000, "en")).toBe("180,000 T");
  });

  it("defaults to fa", () => {
    expect(formatToman(195000)).toContain("تومان");
  });
});

describe("toFaDigits", () => {
  it("converts Latin digits to Persian digits", () => {
    expect(toFaDigits("0123456789")).toBe("۰۱۲۳۴۵۶۷۸۹");
    expect(toFaDigits(2026)).toBe("۲۰۲۶");
  });
});

describe("formatJalali", () => {
  it("formats a known date in the Jalali calendar (fa)", () => {
    // 2026-11-24 == 3 Azar 1405
    expect(formatJalali(new Date(2026, 10, 24), "fa")).toBe("۳ آذر ۱۴۰۵");
  });

  it("formats the same date in English with the Persian calendar", () => {
    // ICU appends the Persian-calendar era ("AP") in English output.
    expect(formatJalali(new Date(2026, 10, 24), "en")).toBe("Azar 3, 1405 AP");
  });
});

describe("isValidIranianPhone", () => {
  it("accepts 09xx and +98 forms", () => {
    expect(isValidIranianPhone("09123456789")).toBe(true);
    expect(isValidIranianPhone("+989123456789")).toBe(true);
  });

  it("accepts Persian digits after normalisation", () => {
    expect(isValidIranianPhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe(true);
  });

  it("accepts +98 written with Persian digits", () => {
    expect(isValidIranianPhone("+۹۸۹۱۲۳۴۵۶۷۸۹")).toBe(true);
    expect(isValidIranianPhone(" ۰۹۱۲۳۴۵۶۷۸۹ ")).toBe(true);
  });

  it("rejects landlines, short numbers and other countries", () => {
    expect(isValidIranianPhone("02112345678")).toBe(false);
    expect(isValidIranianPhone("0912345678")).toBe(false);
    expect(isValidIranianPhone("+12123456789")).toBe(false);
  });

  it("rejects the 0098 prefix, inner spaces and too-short numbers", () => {
    expect(isValidIranianPhone("00989123456789")).toBe(false);
    expect(isValidIranianPhone("0912 345 6789")).toBe(false);
    expect(isValidIranianPhone("091234567")).toBe(false);
    expect(isValidIranianPhone("")).toBe(false);
  });
});

describe("normalizeDigits", () => {
  it("converts Persian and Arabic-Indic digits to Latin", () => {
    expect(normalizeDigits("۱۲۳")).toBe("123");
    expect(normalizeDigits("٩١٢")).toBe("912");
  });
});

describe("formatToman", () => {
  it("formats zero", () => {
    expect(formatToman(0, "fa")).toBe("۰ تومان");
    expect(formatToman(0, "en")).toBe("0 T");
  });
});
