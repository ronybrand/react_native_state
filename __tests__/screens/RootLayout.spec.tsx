import { render, screen, waitFor } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import RootLayout from '@/app/_layout';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));
jest.mock('@/services/infoService', () => ({
  infoService: { getBackendInfo: jest.fn().mockRejectedValue(new Error('down')) },
}));

describe('RootLayout', () => {
  it('keeps the native splash screen up while the keychain is read, then hides it', async () => {
    await render(<RootLayout />);
    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1));
  });

  it('mounts the navigator', async () => {
    await render(<RootLayout />);
    expect(screen.getByTestId('stack')).toBeOnTheScreen();
  });
});
