import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { en } from "@ela-coffee/i18n";
import { SiteHeader } from "./SiteHeader";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";
import { useMotion } from "@/stores/motion";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

function renderHeader() {
  // Phase 6: SiteHeader renders BagDrawer, which uses useMutation.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={en}>
        <SiteHeader />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useBag.setState({ items: [], isOpen: false });
  useBrand.setState({ brand: "ela" });
  useFlavour.setState({ index: 0 });
  useMotion.setState({ paused: false });
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

describe("SiteHeader", () => {
  it("renders the wordmark and the flavour controls in the hero state", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "ela" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All flavors" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    // Scrolled-only links are not rendered yet.
    expect(screen.queryByRole("link", { name: "Story" })).not.toBeInTheDocument();
  });

  it("shows a bag count badge after adding a drink", () => {
    renderHeader();
    expect(screen.queryByTestId("bag-count")).not.toBeInTheDocument();
    act(() => {
      useBag.getState().add("ela-original");
    });
    expect(screen.getByTestId("bag-count")).toHaveTextContent("1");
  });

  it("switches to the scrolled cream bar after scrolling past the hero", () => {
    renderHeader();
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole("link", { name: "Story" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How it's made" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join the list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open bag" })).toBeInTheDocument();
  });

  it("opens the menu drawer from the hamburger button", async () => {
    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    // The drawer is a dynamic import: the chunk loads after the click.
    expect(await screen.findByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it("toggles motion pause with aria-pressed", () => {
    renderHeader();
    const pause = screen.getByRole("button", { name: "Pause floating motion" });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pause);
    expect(screen.getByRole("button", { name: "Play motion" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
