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

// LocaleSwitcher uses next-intl navigation (usePathname/useRouter),
// which needs the App Router context — answer it from a mock so the
// header tests stay router-free. The mock records replace() calls so
// the locale-switch test can assert the target locale.
const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: replaceMock }),
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
  replaceMock.mockClear();
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

  it("switches to the scrolled floating pill after scrolling past the hero", () => {
    renderHeader();
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole("link", { name: "Story" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How it's made" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join the list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open bag" })).toBeInTheDocument();
    // The pill shows both brands as a segmented control (reference
    // scrolled navbar), not the single toggle button of the hero.
    expect(screen.getByRole("button", { name: "Coffee" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Matcha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coffee" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Matcha" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches brand from the segmented toggle in the scrolled pill", () => {
    renderHeader();
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole("button", { name: "Matcha" }));
    expect(useBrand.getState().brand).toBe("midori");
    expect(screen.getByRole("link", { name: "midori" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Matcha" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a language switcher in both states that navigates to the other locale without scrolling", () => {
    renderHeader();
    // Hero state (en): the switcher offers Persian (ISO code "FA").
    const switcher = screen.getByRole("button", { name: "Switch language to Persian" });
    expect(switcher).toBeInTheDocument();
    expect(switcher).toHaveTextContent("FA");
    fireEvent.click(switcher);
    // Bare pathname, no #hash carried over, and scroll:false — the
    // old code appended window.location.hash, which jumped the page
    // down to that anchor after switching (fix batch 2).
    expect(replaceMock).toHaveBeenCalledWith("/", { locale: "fa", scroll: false });

    // Scrolled state: the switcher is in the pill too.
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    fireEvent.scroll(window);
    expect(
      screen.getByRole("button", { name: "Switch language to Persian" }),
    ).toBeInTheDocument();
  });

  it("does not carry the URL hash when switching language", () => {
    renderHeader();
    window.location.hash = "#join";
    fireEvent.click(screen.getByRole("button", { name: "Switch language to Persian" }));
    expect(replaceMock).toHaveBeenCalledWith("/", { locale: "fa", scroll: false });
    window.location.hash = "";
  });

  it("shows the single icon brand switch in both states", () => {
    renderHeader();
    // Hero state: the icon button offers the other brand (matcha).
    const heroSwitch = screen.getByRole("button", { name: "Switch to matcha" });
    expect(heroSwitch).toBeInTheDocument();
    fireEvent.click(heroSwitch);
    expect(useBrand.getState().brand).toBe("midori");
    expect(screen.getByRole("link", { name: "midori" })).toBeInTheDocument();
    // …and now it offers coffee again.
    expect(screen.getByRole("button", { name: "Switch to coffee" })).toBeInTheDocument();
  });

  it("shows the single icon brand switch and a hamburger in the scrolled pill", async () => {
    renderHeader();
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { name: "Switch to matcha" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch to matcha" }));
    expect(useBrand.getState().brand).toBe("midori");
    // The scrolled pill has its own hamburger (the reference's
    // scrolled navbar), opening the same drawer.
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("dialog", { name: "Menu" })).toBeInTheDocument();
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
