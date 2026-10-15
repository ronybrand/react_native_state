import { createExpiryTimer } from './expiryTimer';
import { clearToken, saveToken } from './tokenStorage';

function jwt(expSecondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
}

describe('createExpiryTimer', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await clearToken();
  });
  afterEach(() => jest.useRealTimers());

  it('calls onExpired when the stored token reaches its exp', async () => {
    const onExpired = jest.fn();
    await saveToken(jwt(30));
    createExpiryTimer(onExpired).schedule();

    jest.advanceTimersByTime(29_000);
    expect(onExpired).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2_000);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('does nothing without a token', () => {
    const onExpired = jest.fn();
    createExpiryTimer(onExpired).schedule();
    jest.advanceTimersByTime(10 * 24 * 3600 * 1000);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('cancel stops the pending call', async () => {
    const onExpired = jest.fn();
    await saveToken(jwt(30));
    const timer = createExpiryTimer(onExpired);
    timer.schedule();
    timer.cancel();
    jest.advanceTimersByTime(60_000);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('scheduling again replaces the previous timer instead of stacking', async () => {
    const onExpired = jest.fn();
    await saveToken(jwt(30));
    const timer = createExpiryTimer(onExpired);
    timer.schedule();
    timer.schedule();
    jest.advanceTimersByTime(31_000);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('survives a token that outlives setTimeout’s 32-bit limit (about 24.8 days)', async () => {
    const onExpired = jest.fn();
    const fortyDays = 40 * 24 * 3600;
    await saveToken(jwt(fortyDays));
    createExpiryTimer(onExpired).schedule();

    // The first timer is clamped and fires early; it must re-arm, not expire the session.
    jest.advanceTimersByTime(2 ** 31);
    expect(onExpired).not.toHaveBeenCalled();
    jest.advanceTimersByTime((fortyDays + 60) * 1000);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
