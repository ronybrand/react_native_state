import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json stays the source of truth; this only layers on what depends on the
// environment. E2E=1 (set by the end-to-end workflow) lets a release build talk plain
// http to the local mock API: Android blocks cleartext traffic in release builds, and
// the shipped app must keep blocking it.
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (process.env.E2E !== '1') {
    return base;
  }
  return {
    ...base,
    plugins: [
      ...(base.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
    ],
  };
};
