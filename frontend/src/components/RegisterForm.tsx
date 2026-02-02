"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import Loader from "./Loader";

export default function RegisterForm() {
    const router = useRouter();
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            setIsLoading(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Erreur lors de l'inscription");
                setIsLoading(false);
                return;
            }

            router.push("/login");
        } catch (error) {
            setError("Erreur lors de l'inscription");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-14">²
            <h1 className="text-4xl font-bold">Bienvenue !</h1>
            <h2 className="h5">Inscrivez-vous</h2>
            <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-4 w-full max-w-md">
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
                {error && (
                    <p className="text-sm text-error">{error}</p>
                )}
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

            <p>Déjà un compte ? <Link href="/login" className="text-brand hover:underline underline-offset-2">Connectez-vous</Link></p>
        </div>
    );
}