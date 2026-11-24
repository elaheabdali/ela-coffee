import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
  it("renders an uppercase label with the md size by default", () => {
    render(<Eyebrow>Our story</Eyebrow>);
    const label = screen.getByText("Our story");
    expect(label).toHaveClass("uppercase");
    expect(label.className).toContain("text-[0.6875rem]");
    expect(label.className).toContain("tracking-[0.18em]");
  });

  it("renders the sm size (.625rem / .2em)", () => {
    render(<Eyebrow size="sm">Menu</Eyebrow>);
    const label = screen.getByText("Menu");
    expect(label.className).toContain("text-[0.625rem]");
    expect(label.className).toContain("tracking-[0.2em]");
  });
});
