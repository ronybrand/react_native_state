import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import CreateStateScreen from '@/app/(protected)/state/new';
import { stateService } from '@/services/stateService';
import { renderWithProviders, resetRouter } from '@/testUtils';
import type { State } from '@/interfaces/state';

jest.mock('@/services/stateService');

const created: State = {
  id: 9,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};

async function fillAndSave() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Abbreviation'), 'sp');
  await user.type(screen.getByLabelText('Name'), 'Sao Paulo');
  const save = screen.getByRole('button', { name: 'Save' });
  await waitFor(() => expect(save).toBeEnabled());
  await user.press(save);
}

describe('CreateStateScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetRouter();
    jest.mocked(stateService.list).mockResolvedValue([]);
  });

  it('renders the form under a "New state" title', async () => {
    await renderWithProviders(<CreateStateScreen />);
    expect(screen.getByRole('header', { name: 'New state' })).toBeOnTheScreen();
  });

  it('creates the state and goes back', async () => {
    jest.mocked(stateService.create).mockResolvedValue(created);
    await renderWithProviders(<CreateStateScreen />);
    await fillAndSave();
    await waitFor(() =>
      expect(stateService.create).toHaveBeenCalledWith({ abbreviation: 'SP', name: 'Sao Paulo' }),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  });

  it('falls back to the list when there is nothing to go back to', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);
    jest.mocked(stateService.create).mockResolvedValue(created);
    await renderWithProviders(<CreateStateScreen />);
    await fillAndSave();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  });

  it('blocks an abbreviation that is already in the list', async () => {
    jest.mocked(stateService.list).mockResolvedValue([created]);
    const user = userEvent.setup();
    await renderWithProviders(<CreateStateScreen />);
    await waitFor(() => expect(stateService.list).toHaveBeenCalled());
    await user.type(screen.getByLabelText('Abbreviation'), 'SP');
    await user.type(screen.getByLabelText('Name'), 'Another');
    expect(
      await screen.findByText('A state with this abbreviation already exists.'),
    ).toBeOnTheScreen();
  });

  it('stays on the screen and shows an error when creation fails', async () => {
    jest.mocked(stateService.create).mockRejectedValue(new Error('boom'));
    await renderWithProviders(<CreateStateScreen />);
    await fillAndSave();
    expect(await screen.findByText('Failed to create state.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });
});
