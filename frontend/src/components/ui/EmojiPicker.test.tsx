import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiPicker } from "@/components/ui/EmojiPicker";

describe("EmojiPicker", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <EmojiPicker isOpen={false} onClose={vi.fn()} onEmojiSelect={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders categories, filters emojis and selects one", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onEmojiSelect = vi.fn();

    render(
      <EmojiPicker
        isOpen={true}
        onClose={onClose}
        onEmojiSelect={onEmojiSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "Smileys" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Rechercher un emoji...")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Objects" }));
    expect(screen.getByRole("button", { name: "📷" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "📷" }));
    expect(onEmojiSelect).toHaveBeenCalledWith("📷");

    await user.type(screen.getByPlaceholderText("Rechercher un emoji..."), "zzz-not-found");
    expect(
      screen.getByText(/Aucun emoji trouve pour/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Smileys" })).not.toBeInTheDocument();
  });

  it("closes on outside click and Escape", () => {
    const onClose = vi.fn();

    render(
      <div>
        <EmojiPicker isOpen={true} onClose={onClose} onEmojiSelect={vi.fn()} />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
