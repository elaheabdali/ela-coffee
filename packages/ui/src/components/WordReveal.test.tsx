import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordReveal } from "./WordReveal";

describe("WordReveal", () => {
  it("splits the text into one word span per word, with stagger variables", () => {
    const { container } = render(<WordReveal as="h1" text="Choose your coffee" />);
    const words = container.querySelectorAll(".ela-word");
    expect(words).toHaveLength(3);
    expect(words[0]).toHaveTextContent("Choose");
    expect(words[2]).toHaveTextContent("coffee");
    const inners = container.querySelectorAll(".ela-word-inner");
    expect(inners[0].getAttribute("style")).toContain("--i: 0");
    expect(inners[1].getAttribute("style")).toContain("--i: 1");
    expect(inners[2].getAttribute("style")).toContain("--i: 2");
  });

  it("renders the requested heading element", () => {
    render(<WordReveal as="h2" text="Six iced lattes" />);
    expect(screen.getByRole("heading", { level: 2, name: "Six iced lattes" })).toBeInTheDocument();
  });

  it("does not put aria-label on a paragraph (axe aria-prohibited-attr)", () => {
    const { container } = render(<WordReveal as="p" text="Ela Original" />);
    const p = container.querySelector("p");
    expect(p).not.toHaveAttribute("aria-label");
    // The full text stays available to assistive tech once, visually hidden.
    expect(p?.querySelector(".sr-only")).toHaveTextContent("Ela Original");
    expect(p?.querySelector('[aria-hidden="true"]')).toHaveTextContent("ElaOriginal");
  });

  it("applies the soft variant class", () => {
    const { container } = render(<WordReveal text="Soft heading" variant="soft" />);
    expect(container.firstElementChild).toHaveClass("ela-words-soft");
  });

  it("passes the delay through --reveal-delay", () => {
    const { container } = render(<WordReveal text="Delayed" delayMs={300} />);
    expect(container.firstElementChild?.getAttribute("style")).toContain("--reveal-delay: 300ms");
  });
});
