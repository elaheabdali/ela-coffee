import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("shows the current value", () => {
    render(<Stepper value={2} onChange={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("2");
  });

  it("increments and decrements through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "+ Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole("button", { name: "− Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables decrease at min and increase at max", () => {
    const { rerender } = render(<Stepper value={1} min={1} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "− Decrease quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "+ Increase quantity" })).not.toBeDisabled();

    rerender(<Stepper value={5} min={1} max={5} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "+ Increase quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "− Decrease quantity" })).not.toBeDisabled();
  });

  it("announces value changes to screen readers (aria-live)", () => {
    const { rerender } = render(<Stepper value={1} onChange={vi.fn()} />);
    const value = screen.getByRole("status");
    expect(value).toHaveAttribute("aria-live", "polite");
    rerender(<Stepper value={2} onChange={vi.fn()} />);
    expect(value).toHaveTextContent("2");
  });

  it("is keyboard accessible (Enter on the focused button steps up)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={2} onChange={onChange} />);
    const increase = screen.getByRole("button", { name: "+ Increase quantity" });
    increase.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
