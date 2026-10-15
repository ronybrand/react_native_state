import axios, { type AxiosRequestConfig } from 'axios';
import * as Crypto from 'expo-crypto';
import { clearToken, getToken } from '../auth/tokenStorage';
import { getApiBaseUrl } from './config';
import { LOGIN_PATH } from './apiPaths';
import { notifySessionExpired } from './sessionExpired';

export const REQUEST_ID_HEADER = 'X-Request-Id';
export const TIMEOUT_MS = 15000;
export const RETRY_COUNT = 2;
export const RETRY_DELAY_MS = 500;

interface RetryConfig extends AxiosRequestConfig {
  _retryCount?: number;
}

// Resolved once at startup (see lib/config.ts). Absolute, because a native app
// has no origin for a relative '/api' to resolve against.
const baseURL = getApiBaseUrl();

// eslint-disable-next-line import/no-named-as-default-member -- `axios.create` is the documented API
export const httpClient = axios.create({
  baseURL,
  timeout: TIMEOUT_MS,
});

// A relative url is always resolved against baseURL by axios, so it's safe.
// A request can also be made with an absolute url on this same instance
// though (bypassing baseURL entirely), so that case is checked against a
// boundary - not just startsWith - so a neighboring origin like
// `${baseURL}evil.com` isn't treated as the API itself.
function isApiRequest(url: string | undefined): boolean {
  if (!url || !/^https?:\/\//i.test(url)) {
    return true;
  }
  return url === baseURL || url.startsWith(`${baseURL}/`);
}

// Generated once per logical user action, not per network attempt - the
// retry interceptor resends the same config through the client, which goes
// through this interceptor again; only generate a new id when there isn't
// one yet, so that up to RETRY_COUNT attempts of the same GET correlate as
// a single action in the backend logs, not disconnected events.
httpClient.interceptors.request.use((config) => {
  if (!config.headers.has(REQUEST_ID_HEADER)) {
    config.headers.set(REQUEST_ID_HEADER, Crypto.randomUUID());
  }

  const token = getToken();
  if (token && !config.headers.has('Authorization') && isApiRequest(config.url)) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

httpClient.interceptors.response.use(undefined, async (error) => {
  const config: RetryConfig | undefined = error.config;
  const status: number | undefined = error.response?.status;

  // Checked before the retry branch below so a 401 is never retried, and handled
  // here (not left to screen-level onError) because it is a global concern: any
  // request can lose auth mid-session. The login request itself is excluded - a
  // wrong password also answers 401, and that is a normal form error. Only the
  // first 401 to see a token still present announces the loss; concurrent ones
  // are no-ops. Navigation is the auth provider's job (see sessionExpired.ts).
  if (status === 401 && !config?.url?.endsWith(LOGIN_PATH) && getToken()) {
    void clearToken();
    notifySessionExpired();
    throw error;
  }

  const retryable = !status || status >= 500;

  if (!config || config.method?.toLowerCase() !== 'get' || !retryable) {
    throw error;
  }

  config._retryCount = (config._retryCount ?? 0) + 1;
  if (config._retryCount > RETRY_COUNT) {
    throw error;
  }

  await delay(RETRY_DELAY_MS * 2 ** (config._retryCount - 1));
  return httpClient(config);
});
