import { DEFAULT_API_URL, getApiBaseUrl } from './config';

describe('getApiBaseUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = original;
    }
  });

  it('falls back to the default when the variable is not set', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe(DEFAULT_API_URL);
  });

  it('falls back to the default when the variable is blank', () => {
    process.env.EXPO_PUBLIC_API_URL = '   ';
    expect(getApiBaseUrl()).toBe(DEFAULT_API_URL);
  });

  it('uses EXPO_PUBLIC_API_URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api';
    expect(getApiBaseUrl()).toBe('https://api.example.com/api');
  });

  it('drops trailing slashes so paths can be appended with a single slash', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api///';
    expect(getApiBaseUrl()).toBe('https://api.example.com/api');
  });

  it.each(['ftp://example.com', 'javascript:alert(1)', 'not a url', '/relative'])(
    'rejects %s: a native app has no origin to resolve it against',
    (value) => {
      process.env.EXPO_PUBLIC_API_URL = value;
      expect(() => getApiBaseUrl()).toThrow(/EXPO_PUBLIC_API_URL/);
    },
  );
});
