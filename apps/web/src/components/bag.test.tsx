import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { en } from "@ela-coffee/i18n";
import { BagDrawer } from "./BagDrawer";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import type { OrderDTO } from "@/lib/types";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const originalFetch = globalThis.fetch;

function renderBag() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={en}>
        <BagDrawer />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

const fakeOrder: OrderDTO = {
  id: "order-1",
  status: "RECEIVED",
  items: [{ id: "item-1", drinkId: "ela-caramel", qty: 2, priceToman: 195_000 }],
  customerName: "Test Taster",
  phone: "09123456789",
  totalToman: 390_000,
  payment: "PAID",
  paymentAuthority: "mock_order-1_abc",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** fetch mock that answers the checkout POST and the order-status GET. */
function mockOrderFetch() {
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url);
    if (href === "/api/orders" && init?.method === "POST") {
      return new Response(JSON.stringify({ order: fakeOrder }), { status: 201 });
    }
    if (href.startsWith("/api/orders/")) {
      return new Response(JSON.stringify({ order: fakeOrder }), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 404 });
  });
  globalThis.fetch = fetchMock as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  useBag.setState({ items: [], isOpen: false });
  useBrand.setState({ brand: "ela" });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("BagDrawer", () => {
  it("renders nothing while closed", () => {
    renderBag();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the empty state when open with no items", () => {
    useBag.setState({ isOpen: true, items: [] });
    renderBag();
    expect(screen.getByRole("dialog", { name: "Your bag" })).toBeInTheDocument();
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
    expect(screen.getByText("Tap the bag under any drink to add it here.")).toBeInTheDocument();
  });

  it("shows filled rows with stepper and subtotal", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 2 }] });
    renderBag();
    expect(screen.getByText("Salted Caramel")).toBeInTheDocument();
    expect(screen.getByText("195,000 Toman")).toBeInTheDocument();
    // Line total and subtotal are both 390,000 Toman at qty 2.
    expect(screen.getAllByText("390,000 Toman")).toHaveLength(2);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ Increase quantity" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-caramel", qty: 3 }]);
    expect(screen.getAllByText("585,000 Toman")).toHaveLength(2);
  });

  it("removes the line when the stepper is stepped down to zero", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "− Decrease quantity" }));
    expect(useBag.getState().items).toEqual([]);
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
  });

  it("removes a line with the remove button", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Remove from bag" }));
    expect(useBag.getState().items).toEqual([]);
  });

  it("empties the bag with Clear bag", () => {
    useBag.setState({
      isOpen: true,
      items: [
        { drinkId: "ela-caramel", qty: 1 },
        { drinkId: "ela-mocha", qty: 2 },
      ],
    });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Clear bag" }));
    expect(useBag.getState().items).toEqual([]);
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
  });

  it("opens the checkout step from the bag", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile number")).toBeInTheDocument();
    expect(screen.getByText("This is a test payment — no real money moves.")).toBeInTheDocument();
  });

  it("places the order and shows live tracking on success", async () => {
    const fetchMock = mockOrderFetch();
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 2 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "09123456789" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Track your order")).toBeInTheDocument();
    expect(screen.getByText("Order received")).toBeInTheDocument();
    expect(screen.getAllByText("390,000 Toman").length).toBeGreaterThan(0);
    expect(useBag.getState().items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          items: [{ drinkId: "ela-caramel", qty: 2 }],
          customerName: "Test Taster",
          phone: "09123456789",
        }),
      }),
    );
  });

  it("shows a validation error for an invalid phone and never posts", async () => {
    const fetchMock = mockOrderFetch();
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("That mobile number doesn't look right.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a server error when the order request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "VALIDATION_ERROR", message: "Validation failed" } }),
    }) as typeof fetch;
    useBag.setState({ isOpen: true, items: [{ drinkId: "ela-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Taster" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "09123456789" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Track your order")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    useBag.setState({ isOpen: true, items: [] });
    renderBag();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useBag.getState().isOpen).toBe(false);
  });

  it("closes on overlay click", () => {
    useBag.setState({ isOpen: true, items: [] });
    renderBag();
    fireEvent.click(screen.getByTestId("bag-overlay"));
    expect(useBag.getState().isOpen).toBe(false);
  });
});
