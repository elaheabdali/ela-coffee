import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

expect.extend(toHaveNoViolations);

function Harness({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tasting notes"
        description="Kuro Original — dark cocoa, toasted almond, brown sugar."
      >
        <p>Dialog body</p>
        <Button onClick={() => setOpen(false)}>Add to bag</Button>
        {children}
      </Dialog>
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  return user;
}

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Hidden">
        <p>Body</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders as a labelled modal when open", async () => {
    await openDialog();
    const dialog = screen.getByRole("dialog", { name: "Tasting notes" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("Dialog body");
    expect(
      screen.getByText("Kuro Original — dark cocoa, toasted almond, brown sugar."),
    ).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = await openDialog();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on the close button", async () => {
    const user = await openDialog();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on overlay click", async () => {
    const user = await openDialog();
    await user.click(screen.getByTestId("dialog-overlay"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps focus inside while open (Tab cycles)", async () => {
    const user = await openDialog();
    const dialog = screen.getByRole("dialog");
    const controls = within(dialog).getAllByRole("button");
    // First focusable (the close button) receives focus on open.
    expect(controls[0]).toHaveFocus();
    // Tab from the last control wraps back to the first.
    controls[controls.length - 1].focus();
    await user.keyboard("{Tab}");
    expect(controls[0]).toHaveFocus();
    // Shift+Tab from the first wraps to the last.
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(controls[controls.length - 1]).toHaveFocus();
  });

  it("returns focus to the trigger when closed", async () => {
    const user = await openDialog();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open dialog" })).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Dialog open onClose={vi.fn()} title="Tasting notes" description="Notes.">
        <p>Dialog body</p>
        <Button>Add to bag</Button>
      </Dialog>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
