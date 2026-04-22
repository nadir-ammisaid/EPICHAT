import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterForm from "@/components/RegisterForm";
import { routerPushMock } from "@/test/mocks/nextNavigation";

function jsonResponse(payload: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("RegisterForm", () => {
  const fetchMock = vi.spyOn(global, "fetch");

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("shows validation error when passwords mismatch", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(
      screen.getByPlaceholderText("Nom d'utilisateur"),
      "john_doe",
    );
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
    await user.type(
      screen.getByPlaceholderText("Confirmation du mot de passe"),
      "Password321@",
    );

    await user.click(screen.getByRole("button", { name: "Inscrire" }));

    expect(
      await screen.findByText("Les mots de passe ne correspondent pas"),
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

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(
      screen.getByPlaceholderText("Nom d'utilisateur"),
      "john_doe",
    );
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
    await user.type(
      screen.getByPlaceholderText("Confirmation du mot de passe"),
      "Password123@",
    );

    await user.click(screen.getByRole("button", { name: "Inscrire" }));

    expect(screen.getByRole("button", { name: "Inscription..." })).toBeDisabled();

    resolveFetch?.(jsonResponse({}, true));

    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to login on successful registration", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(jsonResponse({}, true));

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Email"), "John@Doe.com");
    await user.type(
      screen.getByPlaceholderText("Nom d'utilisateur"),
      "john_doe",
    );
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
    await user.type(
      screen.getByPlaceholderText("Confirmation du mot de passe"),
      "Password123@",
    );

    await user.click(screen.getByRole("button", { name: "Inscrire" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/auth/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@doe.com",
            username: "john_doe",
            password: "Password123@",
          }),
        }),
      );
      expect(routerPushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("uses NEXT_PUBLIC_API_URL when provided", async () => {
    const user = userEvent.setup();
    const previousApiUrl = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://api.test.local";

    try {
      fetchMock.mockResolvedValue(jsonResponse({}, true));

      render(<RegisterForm />);

      await user.type(screen.getByPlaceholderText("Email"), "John@Doe.com");
      await user.type(
        screen.getByPlaceholderText("Nom d'utilisateur"),
        "john_doe",
      );
      await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
      await user.type(
        screen.getByPlaceholderText("Confirmation du mot de passe"),
        "Password123@",
      );

      await user.click(screen.getByRole("button", { name: "Inscrire" }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "http://api.test.local/auth/signup",
          expect.objectContaining({ method: "POST" }),
        );
        expect(routerPushMock).toHaveBeenCalledWith("/login");
      });
    } finally {
      if (previousApiUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_URL;
      } else {
        process.env.NEXT_PUBLIC_API_URL = previousApiUrl;
      }
    }
  });

  it("shows backend error message when API fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Utilisateur deja existant" }, false),
    );

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(
      screen.getByPlaceholderText("Nom d'utilisateur"),
      "john_doe",
    );
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
    await user.type(
      screen.getByPlaceholderText("Confirmation du mot de passe"),
      "Password123@",
    );

    await user.click(screen.getByRole("button", { name: "Inscrire" }));

    expect(await screen.findByText("Utilisateur deja existant")).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("shows generic API error when backend message is missing", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(jsonResponse({}, false));

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(
      screen.getByPlaceholderText("Nom d'utilisateur"),
      "john_doe",
    );
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
    await user.type(
      screen.getByPlaceholderText("Confirmation du mot de passe"),
      "Password123@",
    );

    await user.click(screen.getByRole("button", { name: "Inscrire" }));

    expect(
      await screen.findByText("Erreur lors de l'inscription"),
    ).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("shows generic error when network fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(new Error("Network error"));

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Email"), "john@doe.com");
    await user.type(
      screen.getByPlaceholderText("Nom d'utilisateur"),
      "john_doe",
    );
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Password123@");
    await user.type(
      screen.getByPlaceholderText("Confirmation du mot de passe"),
      "Password123@",
    );

    await user.click(screen.getByRole("button", { name: "Inscrire" }));

    expect(
      await screen.findByText("Erreur lors de l'inscription"),
    ).toBeInTheDocument();
    expect(routerPushMock).not.toHaveBeenCalled();
  });
});
