// Decodes the `exp` claim client-side, no round trip. This is a UI hint only
// (should the login screen show?), not an authorization check: the signature
// is never verified, and the backend authorizes every real request. Do not
// reuse this to read claims such as a role for access decisions.
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
      const { exp } = decoded;
      return typeof exp === 'number' ? exp * 1000 : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string, now: number = Date.now()): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry > now;
}
