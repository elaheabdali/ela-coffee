import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { en } from "@ela-coffee/i18n";
import { MenuDrawer } from "./MenuDrawer";
import { useBrand } from "@/stores/brand";
import { useMotion } from "@/stores/motion";

function renderDrawer(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <NextIntlClientProvider locale="en" messages={en}>
        <MenuDrawer open onClose={onClose} />
      </NextIntlClientProvider>,
    ),
  };
}

beforeEach(() => {
  localStorage.clear();
  useBrand.setState({ brand: "kuro" });
  useMotion.setState({ paused: false });
});

describe("MenuDrawer", () => {
  it("renders the wordmark, numbered links and the bottom bar", () => {
    renderDrawer();
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByText("kuro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Story/ })).toHaveAttribute("href", "#story");
    expect(screen.getByRole("link", { name: /Menu/ })).toHaveAttribute("href", "#menu");
    expect(screen.getByRole("link", { name: /How it's made/ })).toHaveAttribute("href", "#process");
    expect(screen.getByRole("link", { name: /Origins/ })).toHaveAttribute("href", "#origins");
    expect(screen.getByRole("link", { name: /Join the list/ })).toHaveAttribute("href", "#join");
    expect(screen.getByText(/Small-batch iced lattes/)).toBeInTheDocument();
    expect(screen.getByText(/Fresh every morning/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Coffee/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause floating motion" })).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const { onClose } = renderDrawer();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when a link is clicked", () => {
    const { onClose } = renderDrawer();
    fireEvent.click(screen.getByRole("link", { name: /Menu/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the Close button", () => {
    const { onClose } = renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <MenuDrawer open={false} onClose={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
