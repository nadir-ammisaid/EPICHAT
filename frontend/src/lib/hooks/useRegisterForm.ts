import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validation/auth";
import { signup } from "@/lib/api/auth";

export function useRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = registerSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const { email, username, password } = result.data;

    setIsLoading(true);
    try {
      await signup(email, username, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return { error, isLoading, handleSubmit };
}
