import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Toast, ToastProvider, useToast } from "./Toast";

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when closed", () => {
    render(<Toast message="Added" open={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders a polite live region when open", () => {
    render(<Toast message="Salted Caramel added to your bag." open durationMs={0} />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Salted Caramel added to your bag.");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("auto-dismisses after durationMs", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="Added" open onClose={onClose} durationMs={2000} />);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not auto-dismiss when durationMs is 0", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="Added" open onClose={onClose} durationMs={0} />);
    vi.advanceTimersByTime(10_000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("re-triggers the bump animation when bumpKey changes", () => {
    const { rerender } = render(<Toast message="2 items" open bumpKey={1} durationMs={0} />);
    expect(screen.getByText("2 items")).toHaveClass("animate-kuro-bump");
    rerender(<Toast message="3 items" open bumpKey={2} durationMs={0} />);
    expect(screen.getByText("3 items")).toHaveClass("animate-kuro-bump");
  });
});

describe("ToastProvider", () => {
  it("shows a toast from useToast and dismisses it after 4s", () => {
    vi.useFakeTimers();

    function Demo() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast("Added to your bag.")}>
          Add
        </button>
      );
    }

    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    // fireEvent (not user-event): user-event's pointer simulation waits on
    // timers, which are faked here.
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("status")).toHaveTextContent("Added to your bag.");
    // Flush the React state update the timer triggers.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("throws when useToast is used outside a provider", () => {
    function Demo() {
      useToast();
      return null;
    }
    // Suppress the React error-boundary console noise for this assertion.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Demo />)).toThrow("useToast must be used inside a ToastProvider");
    spy.mockRestore();
  });

  it("is keyboard accessible (trigger is a real button)", () => {
    function Demo() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast("Hi")}>
          Show
        </button>
      );
    }
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Show" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("status")).toHaveTextContent("Hi");
  });
});
