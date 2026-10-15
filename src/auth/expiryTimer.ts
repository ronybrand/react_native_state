import { getTokenExpiry, isTokenValid } from './jwt';
import { getToken } from './tokenStorage';

// setTimeout stores its delay in a 32-bit integer; a longer one fires at once.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

// Nothing on the device announces that a JWT's `exp` has passed, and the app can
// stay open (or in the background) well past it: a timer ends the session on
// time instead of waiting for the next request to fail with a 401. Kept outside
// React so the re-arming below is plain recursion rather than a hook calling
// itself.
export function createExpiryTimer(onExpired: () => void) {
  let id: ReturnType<typeof setTimeout> | undefined;

  function cancel() {
    clearTimeout(id);
    id = undefined;
  }

  function schedule() {
    cancel();
    const token = getToken();
    const expiry = token ? getTokenExpiry(token) : null;
    if (expiry === null) {
      return;
    }
    const delay = Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT_MS);
    id = setTimeout(() => {
      // A clamped timer fires early: only expire if the token really is done.
      const current = getToken();
      if (current && isTokenValid(current)) {
        schedule();
      } else {
        onExpired();
      }
    }, delay);
  }

  return { schedule, cancel };
}
