import { useCallback, useEffect, useRef, useState } from 'react';
import { API_UNAVAILABLE_MESSAGE } from '@/lib/apiErrorMessage';

const DEFAULT_DURATION_MS = 5000;
// The error only arrives after the timeout and retries (~45s) with an empty
// screen, so the usual 5s would vanish before being read.
const API_UNAVAILABLE_DURATION_MS = 60000;

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
    (
      message: string,
      id: string | null = null,
      durationMs = message === API_UNAVAILABLE_MESSAGE
        ? API_UNAVAILABLE_DURATION_MS
        : DEFAULT_DURATION_MS,
    ) => {
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
