import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/validation/auth";
import { login } from "@/lib/api/auth";
import { setStoredToken } from "@/lib/auth/token";

export function useLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const { email, password } = result.data;

    setIsLoading(true);
    try {
      const accessToken = await login(email, password);
      setStoredToken(accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return { error, isLoading, handleSubmit };
}
