"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { loginSchema } from "@/lib/validation/auth";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email") ?? "",
      password: formData.get("password") ?? "",
    };

    const result = loginSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    const { email, password } = result.data;

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors de la connexion");
        setIsLoading(false);
        return;
      }

      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        router.push("/dashboard");
      } else {
        setError("Identifiants invalides");
        setIsLoading(false);
      }
    } catch {
      setError("Erreur lors de la connexion");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <h1 className="text-4xl font-bold">Bienvenue !</h1>
      <h2 className="h5">Connectez-vous</h2>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col items-center justify-center gap-4"
      >
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          size="md"
          fullWidth
          required
        />
        <Input
          type="password"
          id="password"
          name="password"
          placeholder="Mot de passe"
          size="md"
          fullWidth
          required
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="max-w-78"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <p>
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="text-brand underline-offset-2 hover:underline"
        >
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
}
