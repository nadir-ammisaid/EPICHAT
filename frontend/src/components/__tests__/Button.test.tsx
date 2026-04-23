import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("applies the default primary medium styles", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass("bg-brand", "px-6", "py-2", "text-base");
  });

  it("supports secondary, outline and full width variants", () => {
    const { rerender } = render(
      <Button variant="secondary" size="sm" fullWidth>
        Secondary
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Secondary" })).toHaveClass(
      "text-border-muted",
      "px-4",
      "py-1.5",
      "text-sm",
      "w-full",
    );

    rerender(
      <Button variant="outline" size="lg">
        Outline
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Outline" })).toHaveClass(
      "rounded-md",
      "font-medium",
      "transition-colors",
      "hover:cursor-pointer",
      "border border-border",
      "text-slate-600",
      "hover:text-brand-hover",
      "px-8",
      "py-3",
      "text-lg",
    );
  });
});
