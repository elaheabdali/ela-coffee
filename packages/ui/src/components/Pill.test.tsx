import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders the glass variant by default (header / hero pill)", () => {
    render(<Pill>Glass pill</Pill>);
    const pill = screen.getByText("Glass pill");
    expect(pill.className).toContain("bg-espresso/45");
    expect(pill.className).toContain("backdrop-blur-md");
    expect(pill.className).toContain("ring-cream/10");
  });

  it("renders the small uppercase label variant", () => {
    render(<Pill variant="label">Tag</Pill>);
    const pill = screen.getByText("Tag");
    expect(pill.className).toContain("uppercase");
    expect(pill.className).toContain("tracking-[0.18em]");
    expect(pill.className).not.toContain("backdrop-blur-md");
  });
});
