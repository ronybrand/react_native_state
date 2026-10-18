import { isAxiosError } from 'axios';

// Page served by the start-api Lambda (backend repo, ADR 0026): anti-bot
// challenge, starts the EC2 and waits for the API to come back. Opened in the
// browser, since the challenge widget needs one. ?lang=en: this app is
// English-only. No ?back: a native app has no web page to return to.
export const START_API_URL =
  'https://pizowbnhivr3vholalz5r7ajta0mkvqn.lambda-url.us-east-1.on.aws/?lang=en';

export const API_UNAVAILABLE_MESSAGE =
  'The API is offline (paused to save cost). Turn it on with the link below; it takes about 1 minute.';

const GATEWAY_STATUSES = new Set([502, 503, 504]);

// No usable backend answer: no response at all (network, or axios' own
// timeout) or the BFF proxy's 502/504 when it can't reach the backend (see
// app/api/[...path]/route.ts). With the EC2 turned off (deploy/aws-power.ps1
// in the backend repo) this is exactly what the user sees.
export function isApiUnavailable(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  return !error.response || GATEWAY_STATUSES.has(error.response.status);
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return isApiUnavailable(error) ? API_UNAVAILABLE_MESSAGE : fallback;
}
