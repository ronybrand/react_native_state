import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts with the source value', async () => {
    const { result } = await renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('follows the source only after the delay', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');
  });

  it('only publishes the last value of a burst', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: '' } },
    );

    for (const value of ['r', 'ri', 'rio']) {
      await rerender({ value });
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }
    expect(result.current).toBe('');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('rio');
  });

  it('cancels its pending timer on unmount', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
    const { rerender, unmount } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );
    await rerender({ value: 'b' });
    const index = setTimeoutSpy.mock.calls.map(([, ms]) => ms).lastIndexOf(300);
    const timerId = setTimeoutSpy.mock.results[index].value;

    await unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
