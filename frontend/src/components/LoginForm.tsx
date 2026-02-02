import Link from "next/link";

export default function LoginForm() {
    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold">Bienvenue !</h1>
            <h4 className="text-base">Inscrivez-vous ou connectez-vous</h4>
            <form>
                <div>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" className="w-full p-2 border border-border rounded-md" />
                </div>
                <div>
                    <label htmlFor="password">Mot de passe</label>
                    <input type="password" id="password" name="password" className="w-full p-2 border border-border rounded-md" />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirmation du mot de passe</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" className="w-full p-2 border border-border rounded-md" />
                </div>
            </form>
            <button type="submit" className="w-md p-2 bg-brand text-white rounded-full">Se connecter</button>

            <p>Pas encore de compte ? <Link href="/register">Inscrivez-vous</Link></p>
        </div>
    )
}