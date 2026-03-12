import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "@/components/LoginForm";
import { routerPushMock } from "@/test/mocks/nextNavigation";

function jsonResponse(payload: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("LoginForm", () => {
  const fetchMock = vi.spyOn(global, "fetch");

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("shows validation error and skips API call when password is too short", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "short");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByText("Le mot de passe doit contenir au moins 8 caractères"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows loading state during submit", async () => {
    const user = userEvent.setup();

    let resolveFetch: ((value: Response) => void) | undefined;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(screen.getByRole("button", { name: "Connexion..." })).toBeDisabled();

    resolveFetch?.(jsonResponse({ accessToken: "token-123" }, true));

    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("stores token and redirects on success", async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    fetchMock.mockResolvedValue(jsonResponse({ accessToken: "token-123" }, true));

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "John@Doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@doe.com",
            password: "password123",
          }),
        }),
      );
      expect(setItemSpy).toHaveBeenCalledWith("token", "token-123");
      expect(routerPushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows backend error when API returns non-ok response", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(jsonResponse({ message: "Identifiants invalides" }, false));

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Identifiants invalides")).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("shows generic API error when backend message is missing", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(jsonResponse({}, false));

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByText("Erreur lors de la connexion"),
    ).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("shows invalid credentials when API succeeds without token", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(jsonResponse({}, true));

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Identifiants invalides")).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("shows generic error when network fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(new Error("Network error"));

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByText("Erreur lors de la connexion"),
    ).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });
});
