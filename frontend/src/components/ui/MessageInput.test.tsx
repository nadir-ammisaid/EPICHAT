import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageInput } from "@/components/ui/MessageInput";

describe("MessageInput", () => {
  it("sends trimmed messages and notifies typing callbacks", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    const onTypingStart = vi.fn();
    const onTypingStop = vi.fn();

    render(
      <MessageInput
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        placeholder="Écris un message"
      />,
    );

    const textarea = screen.getByPlaceholderText("Écris un message");

    await user.type(textarea, "  Bonjour tout le monde  ");

    expect(onTypingStart).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSendMessage).toHaveBeenCalledWith("Bonjour tout le monde");
    expect(onTypingStop).toHaveBeenCalled();
    expect(textarea).toHaveValue("");
  });

  it("opens the emoji picker and inserts the selected emoji", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();

    render(<MessageInput onSendMessage={onSendMessage} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Salut");

    await user.click(screen.getByRole("button", { name: "Open emoji picker" }));
    await user.click(screen.getByRole("button", { name: "😀" }));

    expect(textarea).toHaveValue("Salut😀");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("does not send when disabled", () => {
    const onSendMessage = vi.fn();

    render(<MessageInput onSendMessage={onSendMessage} disabled />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "message" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSendMessage).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });
});
