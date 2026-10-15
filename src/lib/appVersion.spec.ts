import Constants from 'expo-constants';
import { getAppVersion } from './appVersion';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.2.3' } as { version?: string } | null },
}));

describe('getAppVersion', () => {
  it('returns the version from app.json', () => {
    expect(getAppVersion()).toBe('1.2.3');
  });

  it('falls back to "dev" when the config has no version', () => {
    (Constants as { expoConfig: unknown }).expoConfig = {};
    expect(getAppVersion()).toBe('dev');
  });

  it('falls back to "dev" when there is no config at all', () => {
    (Constants as { expoConfig: unknown }).expoConfig = null;
    expect(getAppVersion()).toBe('dev');
  });
});
