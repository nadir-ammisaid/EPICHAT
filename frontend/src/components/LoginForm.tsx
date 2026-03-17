"use client";

import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useLoginForm } from "@/lib/hooks/useLoginForm";

export default function LoginForm() {
    const { error, isLoading, handleSubmit } = useLoginForm();

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