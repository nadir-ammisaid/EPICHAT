import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    const onClose = vi.fn();

    const { container } = render(
      <Modal open={false} onClose={onClose} title="Titre du modal">
        <p>Contenu</p>
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders the title and closes on backdrop click or Escape", () => {
    const onClose = vi.fn();

    render(
      <Modal open={true} onClose={onClose} title="Titre du modal">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-labelledby",
      "modal-title",
    );
    expect(
      screen.getByRole("heading", { name: "Titre du modal" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Contenu")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("uses a custom title id when provided", () => {
    const onClose = vi.fn();

    render(
      <Modal open={true} onClose={onClose} title="Titre" titleId="custom-id">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-labelledby",
      "custom-id",
    );
  });
});
