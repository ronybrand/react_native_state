import { Alert } from 'react-native';
import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { router } from 'expo-router';
import StateListScreen from '@/app/index';
import { stateService } from '@/services/stateService';
import { createAuth, renderWithProviders, resetRouter } from '@/testUtils';
import type { State } from '@/interfaces/state';

jest.mock('@/services/stateService');
jest.mock('@/lib/appVersion', () => ({ getAppVersion: () => '1.0.0' }));
jest.mock('@/services/infoService', () => ({
  infoService: { getBackendInfo: jest.fn().mockRejectedValue(new Error('down')) },
}));

const sp: State = {
  id: 1,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};
const rj: State = { ...sp, id: 2, name: 'Rio de Janeiro', abbreviation: 'RJ' };

describe('StateListScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    resetRouter();
    jest.mocked(stateService.list).mockResolvedValue([sp, rj]);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => alertSpy.mockRestore());

  it('exposes a stable test id on the search box, for the end-to-end flows', async () => {
    await renderWithProviders(<StateListScreen />);
    expect(screen.getByTestId('state-search')).toBe(
      screen.getByLabelText('Search by name or abbreviation'),
    );
  });

  it('shows a loading indicator, then the states', async () => {
    await renderWithProviders(<StateListScreen />);
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(await screen.findByText('Sao Paulo')).toBeOnTheScreen();
    expect(screen.getByText('Rio de Janeiro')).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('offers to create the first state when there are none', async () => {
    jest.mocked(stateService.list).mockResolvedValue([]);
    await renderWithProviders(<StateListScreen />);
    expect(await screen.findByText('No states registered.')).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Create the first state' }));
    expect(router.push).toHaveBeenCalledWith('/state/new');
  });

  it('shows the error with its reference id when loading fails', async () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    jest
      .mocked(stateService.list)
      .mockRejectedValue(
        new AxiosError('x', undefined, undefined, undefined, { data: { requestId } } as never),
      );
    await renderWithProviders(<StateListScreen />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Failed to fetch states\./);
    expect(screen.getByText(`Reference ID: ${requestId}`)).toBeOnTheScreen();
  });

  it('opens the create screen from the "New state" button', async () => {
    await renderWithProviders(<StateListScreen />);
    await userEvent.setup().press(await screen.findByRole('button', { name: 'New state' }));
    expect(router.push).toHaveBeenCalledWith('/state/new');
  });

  it('opens the AI assistant from the list screen', async () => {
    await renderWithProviders(<StateListScreen />);
    await userEvent.setup().press(await screen.findByRole('button', { name: 'Ask AI' }));
    expect(router.push).toHaveBeenCalledWith('/assistant');
  });

  it('opens the edit screen of the pressed row', async () => {
    await renderWithProviders(<StateListScreen />);
    await userEvent.setup().press(await screen.findByRole('button', { name: 'Edit SP' }));
    expect(router.push).toHaveBeenCalledWith('/state/1/edit');
  });

  it('debounces the search by 300ms and sends it as busca', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<StateListScreen />);
    await screen.findByText('Sao Paulo');
    await user.type(screen.getByLabelText('Search by name or abbreviation'), 'rio');
    expect(stateService.list).not.toHaveBeenCalledWith('rio', undefined);
    await waitFor(() => expect(stateService.list).toHaveBeenCalledWith('rio', undefined));
  });

  it('sorts by a field, toggling the direction on a second press', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<StateListScreen />);
    await screen.findByText('Sao Paulo');

    await user.press(screen.getByRole('button', { name: 'Name' }));
    await waitFor(() => expect(stateService.list).toHaveBeenCalledWith(undefined, 'nome,asc'));

    await user.press(screen.getByRole('button', { name: 'Name' }));
    await waitFor(() => expect(stateService.list).toHaveBeenCalledWith(undefined, 'nome,desc'));
  });

  it('keeps the rows on screen while a new search or sort loads', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<StateListScreen />);
    await screen.findByText('Sao Paulo');
    jest.mocked(stateService.list).mockReturnValue(new Promise(() => {}));

    await user.press(screen.getByRole('button', { name: 'Name' }));

    expect(screen.getByText('Sao Paulo')).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('refetches on pull to refresh', async () => {
    await renderWithProviders(<StateListScreen />);
    await screen.findByText('Sao Paulo');
    expect(stateService.list).toHaveBeenCalledTimes(1);

    const { refreshControl } = screen.getByTestId('state-list').props;
    await act(async () => {
      refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(stateService.list).toHaveBeenCalledTimes(2));
  });

  describe('deleting', () => {
    const pressDeleteSp = async () => {
      const user = userEvent.setup();
      await user.press(await screen.findByRole('button', { name: 'Delete SP' }));
      return user;
    };
    // Alert.alert(title, message, buttons): hand back the pressed button's handler.
    const alertButton = (label: string) => {
      const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
      return buttons.find((button) => button.text === label)!;
    };

    it('asks for confirmation with a native alert before deleting', async () => {
      await renderWithProviders(<StateListScreen />);
      await pressDeleteSp();
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete state',
        'Are you sure you want to delete SP?',
        expect.any(Array),
      );
      expect(stateService.delete).not.toHaveBeenCalled();
    });

    it('makes the destructive choice explicit and keeps Cancel as the safe default', async () => {
      await renderWithProviders(<StateListScreen />);
      await pressDeleteSp();
      expect(alertButton('Delete')).toMatchObject({ style: 'destructive' });
      expect(alertButton('Cancel')).toMatchObject({ style: 'cancel' });
    });

    it('deletes and refreshes the list once confirmed', async () => {
      jest.mocked(stateService.delete).mockResolvedValue(undefined);
      await renderWithProviders(<StateListScreen />);
      await pressDeleteSp();

      await act(async () => alertButton('Delete').onPress?.());

      await waitFor(() => expect(stateService.delete).toHaveBeenCalledWith(1));
      await waitFor(() => expect(stateService.list).toHaveBeenCalledTimes(2));
    });

    it('does not delete when cancelled', async () => {
      await renderWithProviders(<StateListScreen />);
      await pressDeleteSp();
      await act(async () => alertButton('Cancel').onPress?.());
      expect(stateService.delete).not.toHaveBeenCalled();
    });

    it('shows an error when deleting fails', async () => {
      jest.mocked(stateService.delete).mockRejectedValue(new Error('boom'));
      await renderWithProviders(<StateListScreen />);
      await pressDeleteSp();
      await act(async () => alertButton('Delete').onPress?.());
      expect(await screen.findByRole('alert')).toHaveTextContent(/Failed to delete state\./);
    });
  });

  describe('session control', () => {
    it('offers "Log in" when logged out', async () => {
      await renderWithProviders(<StateListScreen />, {
        auth: createAuth({ status: 'unauthenticated' }),
      });
      await userEvent.setup().press(screen.getByRole('button', { name: 'Log in' }));
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('offers "Log out" when logged in, and signs out', async () => {
      const auth = createAuth({ status: 'authenticated' });
      await renderWithProviders(<StateListScreen />, { auth });
      await userEvent.setup().press(screen.getByRole('button', { name: 'Log out' }));
      expect(auth.signOut).toHaveBeenCalledTimes(1);
    });
  });
});
