"use client";

import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useRegisterForm } from "@/lib/hooks/useRegisterForm";

export default function RegisterForm() {
  const { error, isLoading, handleSubmit } = useRegisterForm();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <h1 className="text-4xl font-bold">Bienvenue !</h1>
      <h2 className="h5">Inscrivez-vous</h2>
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
          type="text"
          id="username"
          name="username"
          placeholder="Nom d'utilisateur"
          size="md"
          fullWidth
          required
          minLength={3}
          maxLength={32}
        />
        <Input
          type="password"
          id="password"
          name="password"
          placeholder="Mot de passe"
          size="md"
          fullWidth
          required
          minLength={8}
        />
        <Input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirmation du mot de passe"
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
          {isLoading ? "Inscription..." : "Inscrire"}
        </Button>
      </form>

      <p>
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-brand underline-offset-2 hover:underline"
        >
          Connectez-vous
        </Link>
      </p>
    </div>
  );
}
