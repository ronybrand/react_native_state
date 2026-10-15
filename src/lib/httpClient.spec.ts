import MockAdapter from 'axios-mock-adapter';
import { httpClient, REQUEST_ID_HEADER, RETRY_DELAY_MS } from './httpClient';
import { clearToken, getToken, saveToken } from '../auth/tokenStorage';
import { onSessionExpired } from './sessionExpired';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('httpClient', () => {
  let mock: MockAdapter;
  let sessionExpiredListener: jest.Mock<void, []>;
  let unsubscribe: () => void;

  beforeEach(async () => {
    mock = new MockAdapter(httpClient);
    await clearToken();
    sessionExpiredListener = jest.fn();
    unsubscribe = onSessionExpired(sessionExpiredListener);
  });

  afterEach(async () => {
    mock.restore();
    await clearToken();
    unsubscribe();
  });

  it('talks to the configured API base url', () => {
    expect(httpClient.defaults.baseURL).toMatch(/^https?:\/\//);
    expect(httpClient.defaults.baseURL).not.toMatch(/\/$/);
  });

  it('sends an X-Request-Id (UUID) on every request', async () => {
    mock.onGet('/state/').reply((config) => {
      expect(config.headers?.[REQUEST_ID_HEADER]).toMatch(UUID);
      return [200, []];
    });

    await httpClient.get('/state/');
  });

  it('keeps the same X-Request-Id across retry attempts of a GET', async () => {
    const requestIds: unknown[] = [];
    mock.onGet('/state/').reply((config) => {
      requestIds.push(config.headers?.[REQUEST_ID_HEADER]);
      return [500];
    });

    await expect(httpClient.get('/state/')).rejects.toThrow();

    expect(requestIds).toHaveLength(3);
    expect(new Set(requestIds).size).toBe(1);
  });

  it('resends a failing GET up to RETRY_COUNT times', async () => {
    let attempts = 0;
    mock.onGet('/state/').reply(() => {
      attempts++;
      return attempts <= 2 ? [500] : [200, []];
    });

    const response = await httpClient.get('/state/');

    expect(response.status).toBe(200);
    expect(attempts).toBe(3);
  });

  it('retries a GET that failed without any response (network down, typical on mobile)', async () => {
    mock.onGet('/state/').networkErrorOnce();
    mock.onGet('/state/').reply(200, []);

    const response = await httpClient.get('/state/');

    expect(response.status).toBe(200);
  });

  it('waits longer between each retry attempt (exponential backoff)', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    let attempts = 0;
    mock.onGet('/state/').reply(() => {
      attempts++;
      return attempts <= 2 ? [500] : [200, []];
    });

    await httpClient.get('/state/');

    const delays = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
    expect(delays).toEqual(expect.arrayContaining([RETRY_DELAY_MS, RETRY_DELAY_MS * 2]));
    setTimeoutSpy.mockRestore();
  });

  it('does not resend a GET that failed with a 4xx status', async () => {
    let attempts = 0;
    mock.onGet('/state/999').reply(() => {
      attempts++;
      return [404];
    });

    await expect(httpClient.get('/state/999')).rejects.toThrow();

    expect(attempts).toBe(1);
  });

  it('does not resend a failing POST', async () => {
    let attempts = 0;
    mock.onPost('/state/').reply(() => {
      attempts++;
      return [500];
    });

    await expect(httpClient.post('/state/', {})).rejects.toThrow();

    expect(attempts).toBe(1);
  });

  it('attaches Authorization when a token is stored', async () => {
    await saveToken('stored-token');
    mock.onPost('/state/').reply((config) => {
      expect(config.headers?.['Authorization']).toBe('Bearer stored-token');
      return [201, {}];
    });

    await httpClient.post('/state/', {});
  });

  it('does not attach Authorization when there is no token', async () => {
    mock.onPost('/state/').reply((config) => {
      expect(config.headers?.['Authorization']).toBeUndefined();
      return [201, {}];
    });

    await httpClient.post('/state/', {});
  });

  it('does not attach Authorization to an absolute url outside the API boundary', async () => {
    await saveToken('stored-token');
    const neighborUrl = `${httpClient.defaults.baseURL}evil.com/state`;
    // axios-mock-adapter strips the baseURL prefix before matching, so match loosely.
    mock.onGet(/evil\.com\/state/).reply((config) => {
      expect(config.headers?.['Authorization']).toBeUndefined();
      return [200, {}];
    });

    await httpClient.get(neighborUrl);
  });

  it('attaches Authorization to an absolute url that is the API itself', async () => {
    await saveToken('stored-token');
    const url = `${httpClient.defaults.baseURL}/state/`;
    mock.onGet(url).reply((config) => {
      expect(config.headers?.['Authorization']).toBe('Bearer stored-token');
      return [200, []];
    });

    await httpClient.get(url);
  });

  it('clears the token and announces the session loss on a 401, without retrying', async () => {
    await saveToken('existing-token');
    let attempts = 0;
    mock.onPost('/state/').reply(() => {
      attempts++;
      return [401, { message: 'Unauthenticated' }];
    });

    await expect(httpClient.post('/state/', {})).rejects.toThrow();

    expect(attempts).toBe(1);
    expect(getToken()).toBeNull();
    expect(sessionExpiredListener).toHaveBeenCalledTimes(1);
  });

  it('only announces once when concurrent requests all 401', async () => {
    await saveToken('existing-token');
    mock.onGet('/state/a').reply(() => [401, { message: 'Unauthenticated' }]);
    mock.onGet('/state/b').reply(() => [401, { message: 'Unauthenticated' }]);

    await Promise.allSettled([httpClient.get('/state/a'), httpClient.get('/state/b')]);

    expect(getToken()).toBeNull();
    expect(sessionExpiredListener).toHaveBeenCalledTimes(1);
  });

  it('ignores a 401 from the login request itself (a normal wrong-password error)', async () => {
    await saveToken('existing-token');
    mock.onPost('/auth/login').reply(() => [401, { message: 'Invalid credentials' }]);

    await expect(httpClient.post('/auth/login', {})).rejects.toThrow();

    expect(getToken()).toBe('existing-token');
    expect(sessionExpiredListener).not.toHaveBeenCalled();
  });

  it('does not clear the token on a non-401 error', async () => {
    await saveToken('existing-token');
    mock.onPost('/state/999').reply(() => [404]);

    await expect(httpClient.post('/state/999', {})).rejects.toThrow();

    expect(getToken()).toBe('existing-token');
  });
});
