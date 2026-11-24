import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace?: string) => (key: string) => `${namespace ?? "?"}.${key}`,
  setRequestLocale: () => undefined,
}));

describe("placeholder page (Phase 2 scaffold)", () => {
  it("renders the hero heading, the placeholder price label and the Phase 4 note", async () => {
    const ui = await Page({ params: Promise.resolve({ locale: "fa" }) });
    render(ui);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("placeholder.priceDemo")).toBeInTheDocument();
    expect(screen.getByText("placeholder.note")).toBeInTheDocument();
    // Both decorative images render; the hero scene is the approved image.
    const images = screen.getAllByAltText("");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/images/scenes/original.webp");
    // Brand toggle is present (kuro by default).
    expect(screen.getByRole("button", { name: /nav\.brandCoffee/ })).toBeInTheDocument();
  });
});
