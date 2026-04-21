import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(
      <Input
        type="password"
        name="password"
        placeholder="Mot de passe"
        aria-label="Mot de passe"
      />,
    );

    const input = screen.getByPlaceholderText("Mot de passe");
    expect(input).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", {
      name: "Afficher le mot de passe",
    });
    await user.click(toggleButton);

    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toBeInTheDocument();
  });

  it("does not render toggle for non-password inputs", () => {
    render(<Input type="email" name="email" placeholder="Email" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders label, error and compact width classes", () => {
    render(
      <Input
        type="text"
        name="username"
        label="Pseudo"
        error="Champ requis"
        fullWidth={false}
        size="lg"
      />,
    );

    expect(screen.getByLabelText("Pseudo")).toBeInTheDocument();
    expect(screen.getByText("Champ requis")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveClass("px-4", "py-3", "text-lg");
  });

  it("uses the medium and small size variants", () => {
    const { rerender } = render(
      <Input type="text" name="first" size="sm" />,
    );

    expect(screen.getByRole("textbox")).toHaveClass("px-2", "py-1", "text-sm");

    rerender(<Input type="text" name="second" size="md" />);

    expect(screen.getByRole("textbox")).toHaveClass("px-3", "py-2", "text-base");
  });
});
