// In memory storage for revoked JWT tokens
const revokedTokens = new Set<string>();

// Add token to blacklist
export function revokeToken(token: string) {
  revokedTokens.add(token);
}

// checking if token has been revoked
export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}
