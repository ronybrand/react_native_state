import Constants from 'expo-constants';

// The web frontends show the commit of the build from a generated version.json;
// a mobile binary carries its version in app.json instead.
export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? 'dev';
}
