import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION_MS = 5000;

export function useErrorMessage() {
  const [error, setErrorState] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearError = useCallback(() => {
    clearTimeout(timeoutId.current);
    setErrorState(null);
    setRequestId(null);
  }, []);

  const setError = useCallback(
    (message: string, id: string | null = null, durationMs = DEFAULT_DURATION_MS) => {
      clearTimeout(timeoutId.current);
      setErrorState(message);
      setRequestId(id);
      timeoutId.current = setTimeout(clearError, durationMs);
    },
    [clearError],
  );

  useEffect(() => () => clearTimeout(timeoutId.current), []);

  return { error, requestId, setError, clearError };
}
