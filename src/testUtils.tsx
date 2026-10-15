import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { AuthContext, type AuthContextValue } from '@/auth/AuthProvider';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function createAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'unauthenticated',
    signIn: jest.fn(async () => {}),
    signOut: jest.fn(async () => {}),
    ...overrides,
  };
}

// Mounts a screen with the providers the real root layout installs. Auth is
// injected as plain context state, so a spec decides "logged in or not"
// without touching the keychain.
export async function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createQueryClient(),
    auth = createAuth(),
  }: { queryClient?: QueryClient; auth?: AuthContextValue } = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  const utils = await render(ui, { wrapper: Wrapper });
  return { ...utils, queryClient, auth };
}
