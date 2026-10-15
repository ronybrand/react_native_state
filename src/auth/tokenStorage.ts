import * as SecureStore from 'expo-secure-store';
import { isTokenValid } from './jwt';

export const TOKEN_KEY = 'estado_jwt';

// The keychain (iOS) / keystore (Android) is the right home for a credential on
// a phone; the web apps' localStorage has no equivalent here. Its API is async,
// but the axios request interceptor needs the token synchronously - so the
// value is mirrored in memory and written through to the keychain.
let cached: string | null = null;

export function getToken(): string | null {
  return cached;
}

// Called once at app start. A keychain that cannot be read is treated as
// "logged out", never as a crash on launch.
export async function loadToken(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored && isTokenValid(stored)) {
      cached = stored;
      return stored;
    }
    cached = null;
    if (stored) {
      await clearToken();
    }
    return null;
  } catch {
    cached = null;
    return null;
  }
}

// The memory copy is updated first and synchronously, so concurrent requests see
// the new state at once; a failing keychain write only costs persistence across
// restarts, not the current session.
export async function saveToken(token: string): Promise<void> {
  cached = token;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Session stays valid for this run only.
  }
}

export async function clearToken(): Promise<void> {
  cached = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing to do: the in-memory token is already gone.
  }
}
