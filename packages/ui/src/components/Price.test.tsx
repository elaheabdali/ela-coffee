import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Price } from "./Price";

describe("Price", () => {
  it("formats Toman with Persian digits in fa", () => {
    render(<Price amountToman={180000} locale="fa" />);
    expect(screen.getByText("۱۸۰٬۰۰۰ تومان")).toBeInTheDocument();
  });

  it("formats Toman with Latin digits in en", () => {
    render(<Price amountToman={180000} locale="en" />);
    expect(screen.getByText("180,000 Toman")).toBeInTheDocument();
  });

  it("shows a struck-through original price when given", () => {
    render(<Price amountToman={180000} originalPriceToman={210000} locale="en" />);
    expect(screen.getByText("180,000 Toman")).toBeInTheDocument();
    const original = screen.getByText("210,000 Toman");
    expect(original.tagName).toBe("S");
    expect(original).toHaveClass("line-through");
  });

  it("renders size variants", () => {
    const { rerender } = render(<Price amountToman={1000} size="sm" />);
    // Size classes live on the outer wrapper, not the text node itself.
    expect(screen.getByText("۱٬۰۰۰ تومان").parentElement).toHaveClass("text-sm");
    rerender(<Price amountToman={1000} size="lg" />);
    expect(screen.getByText("۱٬۰۰۰ تومان").parentElement).toHaveClass("text-2xl");
  });
});
