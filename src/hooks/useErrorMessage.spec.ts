import { act, renderHook } from '@testing-library/react-native';
import { useErrorMessage } from './useErrorMessage';

describe('useErrorMessage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts empty', async () => {
    const { result } = await renderHook(() => useErrorMessage());
    expect(result.current.error).toBeNull();
    expect(result.current.requestId).toBeNull();
  });

  it('sets the message and request id', async () => {
    const { result } = await renderHook(() => useErrorMessage());
    await act(async () => result.current.setError('Boom', 'id-1'));
    expect(result.current.error).toBe('Boom');
    expect(result.current.requestId).toBe('id-1');
  });

  it('clears itself after the default 5s', async () => {
    const { result } = await renderHook(() => useErrorMessage());
    await act(async () => result.current.setError('Boom'));
    await act(async () => {
      jest.advanceTimersByTime(4999);
    });
    expect(result.current.error).toBe('Boom');
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.error).toBeNull();
  });

  it('restarts the timer when a new error replaces the previous one', async () => {
    const { result } = await renderHook(() => useErrorMessage());
    await act(async () => result.current.setError('first'));
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    await act(async () => result.current.setError('second'));
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.error).toBe('second');
  });

  it('clearError clears immediately and cancels the pending timer', async () => {
    const { result } = await renderHook(() => useErrorMessage());
    await act(async () => result.current.setError('Boom', 'id-1'));
    await act(async () => result.current.clearError());
    expect(result.current.error).toBeNull();
    expect(result.current.requestId).toBeNull();
  });

  it('cancels its pending timer on unmount', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = await renderHook(() => useErrorMessage());
    await act(async () => result.current.setError('Boom'));
    const index = setTimeoutSpy.mock.calls.findIndex(([, ms]) => ms === 5000);
    const timerId = setTimeoutSpy.mock.results[index].value;

    await unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
