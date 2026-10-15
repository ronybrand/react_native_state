// Public (testing) deployment of the same API, reached through the web
// app's /api proxy. Fine for trying the app; point EXPO_PUBLIC_API_URL at
// your own backend for anything real.
export const DEFAULT_API_URL = 'https://react-state-flax.vercel.app/api';

// A native app has no origin and no CORS, so unlike the web frontends it talks
// to the API directly - no BFF proxy. Expo inlines EXPO_PUBLIC_* into the
// bundle at build time (the reference must stay a literal
// `process.env.EXPO_PUBLIC_*`), which is why nothing secret may live here.
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configured) {
    return DEFAULT_API_URL;
  }
  if (!/^https?:\/\/[^\s/]+/i.test(configured)) {
    throw new Error(`EXPO_PUBLIC_API_URL must be an absolute http(s) url, got "${configured}"`);
  }
  return configured.replace(/\/+$/, '');
}
