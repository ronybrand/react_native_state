import { screen, waitFor } from '@testing-library/react-native';
import { AppFooter } from './AppFooter';
import { infoService } from '@/services/infoService';
import { renderWithProviders } from '@/testUtils';

jest.mock('@/services/infoService');
jest.mock('@/lib/appVersion', () => ({ getAppVersion: () => '1.2.3' }));

describe('AppFooter', () => {
  beforeEach(() => jest.resetAllMocks());

  it('always shows the app version, even when the backend is unreachable', async () => {
    jest.mocked(infoService.getBackendInfo).mockRejectedValue(new Error('down'));
    await renderWithProviders(<AppFooter />);
    expect(screen.getByText(/app 1\.2\.3/)).toBeOnTheScreen();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText(/back /)).toBeNull();
  });

  it('adds the backend build once it answers', async () => {
    jest.mocked(infoService.getBackendInfo).mockResolvedValue({
      build: { commit: 'def5678', time: '2026-01-02T03:04:05Z' },
    });
    await renderWithProviders(<AppFooter />);
    await waitFor(() => expect(screen.getByText(/back def5678/)).toBeOnTheScreen());
    expect(screen.getByText(/app 1\.2\.3/)).toBeOnTheScreen();
  });
});
