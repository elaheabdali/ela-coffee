import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Add to bag</Button>);
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeInTheDocument();
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press me</Button>);
    await user.click(screen.getByRole("button", { name: "Press me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders every variant with its own styling", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button", { name: "Primary" }).className).toContain("bg-primary");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button", { name: "Secondary" }).className).toContain("bg-secondary");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: "Ghost" }).className).not.toContain("bg-primary");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" }).className).toContain(
      "ring-foreground/50",
    );
  });

  it("renders every size", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: "Small" }).className).toContain("text-sm");
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button", { name: "Large" }).className).toContain("text-lg");
  });

  it("is disabled and busy while loading, and shows a spinner", () => {
    render(<Button loading>Adding…</Button>);
    const button = screen.getByRole("button", { name: "Adding…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is keyboard accessible (Enter activates it)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Keyboard</Button>);
    screen.getByRole("button", { name: "Keyboard" }).focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
