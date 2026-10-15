import { screen } from '@testing-library/react-native';
import ProtectedLayout from '@/app/(protected)/_layout';
import { createAuth, renderWithProviders } from '@/testUtils';

describe('ProtectedLayout', () => {
  it('waits for the keychain before deciding (no premature redirect on a cold start)', async () => {
    await renderWithProviders(<ProtectedLayout />, { auth: createAuth({ status: 'loading' }) });
    expect(screen.queryByTestId('redirect')).toBeNull();
    expect(screen.queryByTestId('stack')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('redirects to /login without a session', async () => {
    await renderWithProviders(<ProtectedLayout />, {
      auth: createAuth({ status: 'unauthenticated' }),
    });
    expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
    expect(screen.queryByTestId('stack')).toBeNull();
  });

  it('renders the protected screens with a session', async () => {
    await renderWithProviders(<ProtectedLayout />, {
      auth: createAuth({ status: 'authenticated' }),
    });
    expect(screen.getByTestId('stack')).toBeOnTheScreen();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });
});
