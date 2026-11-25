import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marquee } from "./Marquee";

const ITEMS = ["Ela Original", "Salted Caramel", "Vanilla Cream"];

describe("Marquee", () => {
  it("renders every item four times (four identical lists for the seamless loop)", () => {
    render(<Marquee items={ITEMS} />);
    expect(screen.getAllByText("Ela Original")).toHaveLength(4);
    expect(screen.getAllByText("Salted Caramel")).toHaveLength(4);
    expect(screen.getAllByText("Vanilla Cream")).toHaveLength(4);
  });

  it("hides the duplicate copies from screen readers", () => {
    const { container } = render(<Marquee items={ITEMS} />);
    const copies = container.querySelectorAll(".animate-ela-marquee > ul");
    expect(copies).toHaveLength(4);
    expect(copies[0]).not.toHaveAttribute("aria-hidden");
    expect(copies[1]).toHaveAttribute("aria-hidden", "true");
    expect(copies[2]).toHaveAttribute("aria-hidden", "true");
    expect(copies[3]).toHaveAttribute("aria-hidden", "true");
    // Each item is announced exactly once: the later occurrences sit
    // inside aria-hidden copies (getByText matches hidden text too,
    // so assert on the DOM instead).
    const matches = screen.getAllByText("Ela Original");
    expect(matches).toHaveLength(4);
    expect(matches[0].closest("[aria-hidden='true']")).toBeNull();
    expect(matches[1].closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("uses the marquee animation class (48s linear infinite in globals.css)", () => {
    const { container } = render(<Marquee items={ITEMS} />);
    expect(container.querySelector(".animate-ela-marquee")).toBeInTheDocument();
  });

  it("separates items with a bean icon by default", () => {
    const { container } = render(<Marquee items={ITEMS} />);
    expect(container.querySelectorAll(".lucide-bean")).toHaveLength(ITEMS.length * 4);
    expect(container.querySelector(".lucide-leaf")).toBeNull();
  });

  it("separates items with a leaf icon in matcha mode", () => {
    const { container } = render(<Marquee items={ITEMS} separator="leaf" />);
    expect(container.querySelectorAll(".lucide-leaf")).toHaveLength(ITEMS.length * 4);
    expect(container.querySelector(".lucide-bean")).toBeNull();
  });
});
