import { QueryClient } from '@tanstack/react-query';

// httpClient already resends failing GETs (RETRY_COUNT, see lib/httpClient.ts) -
// disable React Query's own retry so it does not duplicate attempts on top.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
