import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marquee } from "./Marquee";

const ITEMS = ["Kuro Original", "Salted Caramel", "Vanilla Cream"];

describe("Marquee", () => {
  it("renders every item twice (duplicated content for the seamless loop)", () => {
    render(<Marquee items={ITEMS} />);
    expect(screen.getAllByText("Kuro Original")).toHaveLength(2);
    expect(screen.getAllByText("Salted Caramel")).toHaveLength(2);
    expect(screen.getAllByText("Vanilla Cream")).toHaveLength(2);
  });

  it("hides the duplicate copy from screen readers", () => {
    const { container } = render(<Marquee items={ITEMS} />);
    const copies = container.querySelectorAll(".animate-kuro-marquee > span");
    expect(copies).toHaveLength(2);
    expect(copies[0]).not.toHaveAttribute("aria-hidden");
    expect(copies[1]).toHaveAttribute("aria-hidden", "true");
    // Each item is announced exactly once: the second occurrence sits
    // inside the aria-hidden copy (getByText matches hidden text too,
    // so assert on the DOM instead).
    const matches = screen.getAllByText("Kuro Original");
    expect(matches).toHaveLength(2);
    expect(matches[0].closest("[aria-hidden='true']")).toBeNull();
    expect(matches[1].closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("uses the marquee animation class (48s linear infinite in globals.css)", () => {
    const { container } = render(<Marquee items={ITEMS} />);
    expect(container.querySelector(".animate-kuro-marquee")).toBeInTheDocument();
  });

  it("renders the separator between items", () => {
    const { container } = render(<Marquee items={ITEMS} separator="•" />);
    expect(container.textContent).toContain("•");
  });
});
