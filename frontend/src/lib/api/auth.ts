/**
 * Auth API module — wraps /auth/login and /auth/signup HTTP calls.
 * No bearer token is attached (not yet authenticated).
 * All errors are thrown as user-friendly Error instances.
 */

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

export async function login(email: string, password: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Erreur lors de la connexion");
  }

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Erreur lors de la connexion");
  if (!data.accessToken) throw new Error("Identifiants invalides");

  return data.accessToken as string;
}

export async function signup(
  email: string,
  username: string,
  password: string,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
  } catch {
    throw new Error("Erreur lors de l'inscription");
  }

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Erreur lors de l'inscription");
}
