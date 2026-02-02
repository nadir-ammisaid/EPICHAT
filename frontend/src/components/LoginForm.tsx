import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function LoginForm() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-14">
            <h1 className="text-4xl font-bold">Bienvenue !</h1>
            <h2 className="h5">Connectez-vous</h2>
            <form className="flex flex-col gap-4 w-full max-w-md">
                <Input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="Email" 
                    size="md"
                    fullWidth
                />
                <Input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="Mot de passe" 
                    size="md"
                    fullWidth
                />
            </form>
            <Button type="submit" variant="primary" size="md" className="max-w-78" fullWidth>
                Se connecter
            </Button>

            <p>
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-brand hover:underline underline-offset-2">Inscrivez-vous</Link>
            </p>
        </div>
    );
}