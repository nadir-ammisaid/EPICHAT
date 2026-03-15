import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLoginForm } from "./useLoginForm";

const loginMock = vi.fn();
const setStoredTokenMock = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  login: (...args: unknown[]) => loginMock(...args),
}));

vi.mock("@/lib/auth/token", () => ({
  setStoredToken: (...args: unknown[]) => setStoredTokenMock(...args),
}));

function buildLoginForm(): HTMLFormElement {
  const form = document.createElement("form");

  const email = document.createElement("input");
  email.name = "email";
  email.value = "john@doe.com";

  const password = document.createElement("input");
  password.name = "password";
  password.value = "password123";

  form.append(email, password);
  return form;
}

describe("useLoginForm", () => {
  it("shows generic message when non-Error is thrown", async () => {
    loginMock.mockRejectedValueOnce("boom");

    const { result } = renderHook(() => useLoginForm());
    const form = buildLoginForm();

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        currentTarget: form,
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.error).toBe("Erreur lors de la connexion");
    expect(setStoredTokenMock).not.toHaveBeenCalled();
  });
});
