import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EditStateScreen from '@/app/(protected)/state/[id]/edit';
import { stateService } from '@/services/stateService';
import { renderWithProviders, resetRouter } from '@/testUtils';
import type { State } from '@/interfaces/state';

jest.mock('@/services/stateService');

const sp: State = {
  id: 3,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};

const openWithId = (id: string) => jest.mocked(useLocalSearchParams).mockReturnValue({ id });

describe('EditStateScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetRouter();
    openWithId('3');
    jest.mocked(stateService.list).mockResolvedValue([sp]);
    jest.mocked(stateService.get).mockResolvedValue(sp);
  });

  it('loads the state and prefills the form', async () => {
    await renderWithProviders(<EditStateScreen />);
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByLabelText('Name').props.value).toBe('Sao Paulo'));
    expect(stateService.get).toHaveBeenCalledWith(3);
    expect(screen.getByLabelText('Abbreviation').props.value).toBe('SP');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('saves the merged state and goes back', async () => {
    const user = userEvent.setup();
    jest.mocked(stateService.update).mockResolvedValue(sp);
    await renderWithProviders(<EditStateScreen />);
    await waitFor(() => expect(screen.getByLabelText('Name').props.value).toBe('Sao Paulo'));

    await user.type(screen.getByLabelText('Name'), ' Capital');
    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.press(save);

    await waitFor(() =>
      expect(stateService.update).toHaveBeenCalledWith({ ...sp, name: 'Sao Paulo Capital' }),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  });

  it('shows an error when saving fails', async () => {
    const user = userEvent.setup();
    jest.mocked(stateService.update).mockRejectedValue(new Error('boom'));
    await renderWithProviders(<EditStateScreen />);
    await waitFor(() => expect(screen.getByLabelText('Name').props.value).toBe('Sao Paulo'));
    await user.type(screen.getByLabelText('Name'), '!');
    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.press(save);
    expect(await screen.findByText('Failed to update state.')).toBeOnTheScreen();
  });

  it('shows an error when the state cannot be loaded', async () => {
    jest.mocked(stateService.get).mockRejectedValue(new Error('boom'));
    await renderWithProviders(<EditStateScreen />);
    expect(await screen.findByText('Failed to fetch state.')).toBeOnTheScreen();
  });

  it.each(['abc', '0', '-2', '1.5'])('rejects id "%s" without calling the API', async (id) => {
    openWithId(id);
    await renderWithProviders(<EditStateScreen />);
    expect(await screen.findByText('Invalid state.')).toBeOnTheScreen();
    expect(stateService.get).not.toHaveBeenCalled();
  });

  it('treats a missing id as invalid', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    await renderWithProviders(<EditStateScreen />);
    expect(await screen.findByText('Invalid state.')).toBeOnTheScreen();
  });
});
