import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LocaleError from "./error";

// The error page reads the locale from the URL path only, so it works
// even when the intl provider above it has failed (Phase 8).
const mockPathname = vi.fn(() => "/fa");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("locale error page (Phase 8)", () => {
  it("fa: branded 500 with a retry button and no stack trace", () => {
    mockPathname.mockReturnValue("/fa");
    const reset = vi.fn();
    render(<LocaleError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { name: "مشکلی پیش آمد…" })).toBeInTheDocument();
    expect(screen.getByText("۵۰۰")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
    expect(reset).toHaveBeenCalledTimes(1);

    // Nothing from the error object leaks onto the page.
    expect(document.body.textContent).not.toContain("boom");
    expect(document.body.textContent).not.toContain("Error:");
    expect(document.body.textContent).not.toContain("at ");
  });

  it("en: English copy for /en", () => {
    mockPathname.mockReturnValue("/en");
    const reset = vi.fn();
    render(<LocaleError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Something went wrong…" })).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the flavors" })).toHaveAttribute(
      "href",
      "/en",
    );
  });

  it("links back to the home page of the current locale", () => {
    mockPathname.mockReturnValue("/fa");
    render(<LocaleError error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "بازگشت به طعم‌ها" })).toHaveAttribute("href", "/fa");
  });
});
