import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRegisterForm } from "./useRegisterForm";

const signupMock = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  signup: (...args: unknown[]) => signupMock(...args),
}));

function buildRegisterForm(): HTMLFormElement {
  const form = document.createElement("form");

  const email = document.createElement("input");
  email.name = "email";
  email.value = "john@doe.com";

  const username = document.createElement("input");
  username.name = "username";
  username.value = "john_doe";

  const password = document.createElement("input");
  password.name = "password";
  password.value = "Password123@";

  const confirmPassword = document.createElement("input");
  confirmPassword.name = "confirmPassword";
  confirmPassword.value = "Password123@";

  form.append(email, username, password, confirmPassword);
  return form;
}

describe("useRegisterForm", () => {
  it("shows generic message when non-Error is thrown", async () => {
    signupMock.mockRejectedValueOnce("boom");

    const { result } = renderHook(() => useRegisterForm());
    const form = buildRegisterForm();

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        currentTarget: form,
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.error).toBe("Erreur lors de l'inscription");
  });
});
