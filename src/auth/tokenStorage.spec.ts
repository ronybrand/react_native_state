import * as SecureStore from 'expo-secure-store';
import { clearToken, getToken, loadToken, saveToken, TOKEN_KEY } from './tokenStorage';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __resetSecureStore } = require('../../__mocks__/expo-secure-store');

function jwt(expSecondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
}

describe('tokenStorage', () => {
  beforeEach(async () => {
    __resetSecureStore();
    await clearToken();
    jest.mocked(SecureStore.deleteItemAsync).mockClear();
  });

  it('has no token before anything is saved', () => {
    expect(getToken()).toBeNull();
  });

  it('saveToken makes the token readable synchronously and persists it in the keychain', async () => {
    const token = jwt(60);
    await saveToken(token);
    expect(getToken()).toBe(token);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, token);
  });

  it('keeps the session in memory when the keychain write fails', async () => {
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('keychain locked'));
    const token = jwt(60);
    await expect(saveToken(token)).resolves.toBeUndefined();
    expect(getToken()).toBe(token);
  });

  it('clearToken forgets the token and removes it from the keychain', async () => {
    await saveToken(jwt(60));
    await clearToken();
    expect(getToken()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
  });

  it('clearToken still forgets the token when the keychain delete fails', async () => {
    await saveToken(jwt(60));
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('boom'));
    await expect(clearToken()).resolves.toBeUndefined();
    expect(getToken()).toBeNull();
  });

  describe('loadToken (app start)', () => {
    it('restores a valid token from the keychain into memory', async () => {
      const token = jwt(60);
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      expect(await loadToken()).toBe(token);
      expect(getToken()).toBe(token);
    });

    it('returns null when nothing is stored', async () => {
      expect(await loadToken()).toBeNull();
    });

    it('drops and deletes an expired token', async () => {
      await SecureStore.setItemAsync(TOKEN_KEY, jwt(-60));
      expect(await loadToken()).toBeNull();
      expect(getToken()).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    });

    it('drops a stored value that is not a jwt', async () => {
      await SecureStore.setItemAsync(TOKEN_KEY, 'garbage');
      expect(await loadToken()).toBeNull();
    });

    it('treats an unreadable keychain as logged out instead of crashing the app start', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('keychain error'));
      await expect(loadToken()).resolves.toBeNull();
      expect(getToken()).toBeNull();
    });
  });
});
