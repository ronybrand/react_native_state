import { getTokenExpiry, isTokenValid } from './jwt';

function tokenWith(payload: unknown): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${encoded}.signature`;
}

describe('getTokenExpiry', () => {
  it('returns exp in milliseconds', () => {
    expect(getTokenExpiry(tokenWith({ exp: 1_800_000_000 }))).toBe(1_800_000_000_000);
  });

  it.each([
    ['not a jwt', 'nope'],
    ['a payload that is not json', 'a.%%%.c'],
    ['no exp claim', tokenWith({ sub: 'admin' })],
    ['a non-numeric exp', tokenWith({ exp: 'soon' })],
    ['an empty string', ''],
  ])('returns null for %s', (_label, token) => {
    expect(getTokenExpiry(token)).toBeNull();
  });
});

describe('isTokenValid', () => {
  const now = 1_700_000_000_000;

  it('is true before exp', () => {
    expect(isTokenValid(tokenWith({ exp: now / 1000 + 60 }), now)).toBe(true);
  });

  it('is false at and after exp', () => {
    expect(isTokenValid(tokenWith({ exp: now / 1000 }), now)).toBe(false);
    expect(isTokenValid(tokenWith({ exp: now / 1000 - 1 }), now)).toBe(false);
  });

  it('is false for anything that cannot be decoded', () => {
    expect(isTokenValid('garbage', now)).toBe(false);
  });
});
