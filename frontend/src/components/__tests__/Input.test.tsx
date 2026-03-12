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
});
