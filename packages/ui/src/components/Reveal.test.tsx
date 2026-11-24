import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "./Reveal";

describe("Reveal", () => {
  it("keeps content visible when IntersectionObserver is unavailable (no-JS fallback)", () => {
    render(
      <Reveal variant="fade-up">
        <p>Always visible</p>
      </Reveal>,
    );
    // jsdom has no IntersectionObserver: the component must reveal immediately.
    expect(screen.getByText("Always visible")).toBeInTheDocument();
    expect(screen.getByText("Always visible").parentElement).toHaveAttribute("data-revealed");
  });

  it("sets the data-reveal attribute per variant", () => {
    const { rerender } = render(
      <Reveal variant="fade">
        <p>Fading</p>
      </Reveal>,
    );
    expect(screen.getByText("Fading").parentElement).toHaveAttribute("data-reveal", "fade");

    rerender(
      <Reveal variant="image">
        <p>Image</p>
      </Reveal>,
    );
    expect(screen.getByText("Image").parentElement).toHaveAttribute("data-reveal", "image");
  });

  it("passes the delay through --reveal-delay", () => {
    render(
      <Reveal variant="fade-up" delayMs={450}>
        <p>Delayed</p>
      </Reveal>,
    );
    expect(screen.getByText("Delayed").parentElement?.getAttribute("style")).toContain(
      "--reveal-delay: 450ms",
    );
  });
});
