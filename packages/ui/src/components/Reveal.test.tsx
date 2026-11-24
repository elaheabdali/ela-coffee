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
});
