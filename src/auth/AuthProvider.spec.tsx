import { useEffect } from 'react';
import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import MockAdapter from 'axios-mock-adapter';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthProvider';
import { clearToken, getToken, saveToken } from './tokenStorage';
import { httpClient } from '@/lib/httpClient';
import { notifySessionExpired } from '@/lib/sessionExpired';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __resetSecureStore } = require('../../__mocks__/expo-secure-store');

function jwt(expSecondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
}

const captured: { auth: ReturnType<typeof useAuth> | null } = { auth: null };
const latest = () => captured.auth!;

function Probe() {
  const auth = useAuth();
  // Captured in an effect, not during render, so render stays pure.
  useEffect(() => {
    captured.auth = auth;
  });
  return <Text testID="status">{auth.status}</Text>;
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

const status = () => screen.getByTestId('status').props.children;

describe('AuthProvider', () => {
  let mock: MockAdapter;

  beforeEach(async () => {
    __resetSecureStore();
    await clearToken();
    mock = new MockAdapter(httpClient);
  });

  afterEach(() => {
    mock.restore();
    jest.useRealTimers();
  });

  it('starts as loading while the keychain is read, then unauthenticated without a token', async () => {
    await renderProvider();
    await waitFor(() => expect(status()).toBe('unauthenticated'));
  });

  it('restores a valid token from the keychain as authenticated', async () => {
    const token = jwt(600);
    await saveToken(token);
    // Simulate a cold start: memory is empty, only the keychain has it.
    await clearToken();
    await SecureStore.setItemAsync('estado_jwt', token);

    await renderProvider();

    await waitFor(() => expect(status()).toBe('authenticated'));
  });

  it('treats an expired stored token as logged out', async () => {
    await SecureStore.setItemAsync('estado_jwt', jwt(-60));

    await renderProvider();

    await waitFor(() => expect(status()).toBe('unauthenticated'));
  });

  it('signIn authenticates after a successful login', async () => {
    mock.onPost('/auth/login').reply(200, { token: jwt(600), expiresInSeconds: 600 });
    await renderProvider();
    await waitFor(() => expect(status()).toBe('unauthenticated'));

    await act(() => latest().signIn({ username: 'admin', password: 'secret' }));

    expect(status()).toBe('authenticated');
  });

  it('signIn rejects and stays unauthenticated when the login fails', async () => {
    mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });
    await renderProvider();
    await waitFor(() => expect(status()).toBe('unauthenticated'));

    await expect(
      act(() => latest().signIn({ username: 'admin', password: 'wrong' })),
    ).rejects.toThrow();

    expect(status()).toBe('unauthenticated');
  });

  it('signOut clears the token and flips to unauthenticated', async () => {
    mock.onPost('/auth/login').reply(200, { token: jwt(600), expiresInSeconds: 600 });
    await renderProvider();
    await act(() => latest().signIn({ username: 'admin', password: 'secret' }));

    await act(() => latest().signOut());

    expect(status()).toBe('unauthenticated');
    expect(getToken()).toBeNull();
  });

  it('flips to unauthenticated when a request reports the session expired (401)', async () => {
    mock.onPost('/auth/login').reply(200, { token: jwt(600), expiresInSeconds: 600 });
    await renderProvider();
    await act(() => latest().signIn({ username: 'admin', password: 'secret' }));

    await act(async () => notifySessionExpired());

    expect(status()).toBe('unauthenticated');
  });

  it('logs out by itself when the token reaches its expiry', async () => {
    jest.useFakeTimers();
    mock.onPost('/auth/login').reply(200, { token: jwt(30), expiresInSeconds: 30 });
    await renderProvider();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    await act(() => latest().signIn({ username: 'admin', password: 'secret' }));
    expect(status()).toBe('authenticated');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(31_000);
    });

    expect(status()).toBe('unauthenticated');
    expect(getToken()).toBeNull();
  });

  it('useAuth outside the provider is a programming error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useAuth();
      return null;
    }
    await expect(render(<Orphan />)).rejects.toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
