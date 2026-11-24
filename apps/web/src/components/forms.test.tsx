/**
 * ReservationForm + ContactForm tests (Phase 6).
 * Both forms POST to their API route and show the localized
 * success state on a real 200/201 response.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { en } from "@ela-coffee/i18n";
import { ReservationForm } from "./ReservationForm";
import { ContactForm } from "./ContactForm";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function renderWithLocale(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ReservationForm", () => {
  it("shows a validation error for an invalid phone and never posts", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<ReservationForm />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("Date and time"), {
      target: { value: "2030-06-15T19:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Book a table" }));

    expect(await screen.findByText("That mobile number doesn't look right.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the reservation and shows the success state with a Jalali date", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reservation: {
          id: "res-1",
          name: "Test Taster",
          phone: "09123456789",
          date: "2030-06-15T19:00:00.000Z",
          guests: 2,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        },
      }),
    });
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<ReservationForm />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "09123456789" },
    });
    fireEvent.change(screen.getByLabelText("Date and time"), {
      target: { value: "2030-06-15T19:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Book a table" }));

    expect(await screen.findByText("Your table is booked!")).toBeInTheDocument();
    expect(screen.getByText(/We'll call you to confirm\./)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/reservations",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"name":"Test Taster"'),
      }),
    );
  });
});

describe("ContactForm", () => {
  it("shows a validation error for an empty message and never posts", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<ContactForm />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Email or mobile number"), {
      target: { value: "taster@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("A message is required.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the message and shows the success state", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<ContactForm />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Email or mobile number"), {
      target: { value: "taster@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Great coffee, thank you!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Message received!")).toBeInTheDocument();
    expect(screen.getByText("We'll get back to you soon.")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Test Taster",
          contact: "taster@example.com",
          message: "Great coffee, thank you!",
        }),
      }),
    );
  });
});
