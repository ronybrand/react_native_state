import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '../lib/httpClient';
import { authService } from './authService';
import { clearToken, getToken } from '../auth/tokenStorage';

describe('authService', () => {
  let mock: MockAdapter;

  beforeEach(async () => {
    mock = new MockAdapter(httpClient);
    await clearToken();
  });

  afterEach(async () => {
    mock.restore();
    await clearToken();
  });

  it('login posts credentials and stores the returned token', async () => {
    mock.onPost('/auth/login', { username: 'admin', password: 'secret' }).reply(200, {
      token: 'issued-token',
      expiresInSeconds: 3600,
    });

    const result = await authService.login({ username: 'admin', password: 'secret' });

    expect(result).toEqual({ token: 'issued-token', expiresInSeconds: 3600 });
    expect(getToken()).toBe('issued-token');
  });

  it('login does not store a token when the request fails', async () => {
    mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });

    await expect(authService.login({ username: 'admin', password: 'wrong' })).rejects.toThrow();

    expect(getToken()).toBeNull();
  });

  it('logout clears the stored token', async () => {
    mock.onPost('/auth/login').reply(200, { token: 'issued-token', expiresInSeconds: 3600 });
    await authService.login({ username: 'admin', password: 'secret' });

    await authService.logout();

    expect(getToken()).toBeNull();
  });
});
