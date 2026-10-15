import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService, type LoginCredentials } from '@/services/authService';
import { onSessionExpired } from '@/lib/sessionExpired';
import { createExpiryTimer } from './expiryTimer';
import { loadToken } from './tokenStorage';

// 'loading' lasts only while the keychain is read at launch. Guards must wait
// for it: judging a logged-in user by the initial state would bounce them to
// the login screen on every cold start.
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [expiryTimer] = useState(() =>
    createExpiryTimer(() => {
      setStatus('unauthenticated');
      void authService.logout();
    }),
  );

  const signOut = useCallback(async () => {
    expiryTimer.cancel();
    setStatus('unauthenticated');
    await authService.logout();
  }, [expiryTimer]);

  useEffect(() => {
    let active = true;
    void loadToken().then((token) => {
      if (!active) {
        return;
      }
      setStatus(token ? 'authenticated' : 'unauthenticated');
      expiryTimer.schedule();
    });
    // httpClient's 401 handler runs outside React; it clears the token and
    // notifies this subscriber, which updates the state the guards read.
    const unsubscribe = onSessionExpired(() => {
      expiryTimer.cancel();
      setStatus('unauthenticated');
    });
    return () => {
      active = false;
      unsubscribe();
      expiryTimer.cancel();
    };
  }, [expiryTimer]);

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      await authService.login(credentials);
      setStatus('authenticated');
      expiryTimer.schedule();
    },
    [expiryTimer],
  );

  const value = useMemo(() => ({ status, signIn, signOut }), [status, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
