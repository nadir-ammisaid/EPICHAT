import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dropdown } from "@/components/ui/Dropdown";

describe("Dropdown", () => {
  it("toggles open with a single child trigger and closes on menu item click", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button type="button">Open</button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <button type="button" role="menuitem">
            Item
          </button>
        </Dropdown.Menu>
      </Dropdown>,
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Item" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports a non-element trigger and closes on outside click and Escape", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <span>Toggle</span>
        </Dropdown.Trigger>
        <Dropdown.Menu position="top" align="right">
          <div>Menu content</div>
        </Dropdown.Menu>
      </Dropdown>,
    );

    await user.click(screen.getByText("Toggle"));
    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("bottom-full", "right-0");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByText("Toggle"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles a non-element trigger with Enter", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <span>Keyboard toggle</span>
          <span>more</span>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <div>Keyboard menu</div>
        </Dropdown.Menu>
      </Dropdown>,
    );

    const trigger = screen.getByRole("button", { name: /Keyboard togglemore/i });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("clones a single child trigger and forwards the click handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button type="button" onClick={onClick}>
            Open details
          </button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <div>Details</div>
        </Dropdown.Menu>
      </Dropdown>,
    );

    await user.click(screen.getByRole("button", { name: "Open details" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("menu")).toHaveClass("top-full", "left-0");
  });

  it("throws when trigger or menu is used outside the dropdown context", () => {
    expect(() =>
      render(
        <Dropdown.Trigger>
          <button type="button">Orphan</button>
        </Dropdown.Trigger>,
      ),
    ).toThrow("Dropdown.Trigger and Dropdown.Menu must be used inside Dropdown");
  });
});