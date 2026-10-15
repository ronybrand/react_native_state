import { notifySessionExpired, onSessionExpired } from './sessionExpired';

describe('sessionExpired', () => {
  it('calls a subscribed listener when notified', () => {
    const listener = jest.fn();
    onSessionExpired(listener);

    notifySessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls every subscribed listener', () => {
    const first = jest.fn();
    const second = jest.fn();
    onSessionExpired(first);
    onSessionExpired(second);

    notifySessionExpired();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops calling a listener once unsubscribed', () => {
    const listener = jest.fn();
    const unsubscribe = onSessionExpired(listener);

    unsubscribe();
    notifySessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });

  it('does nothing when notified with no listeners subscribed', () => {
    expect(() => notifySessionExpired()).not.toThrow();
  });
});
