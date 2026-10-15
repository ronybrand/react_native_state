import { render, screen, userEvent } from '@testing-library/react-native';
import { StateListItem } from './StateListItem';
import type { State } from '@/interfaces/state';

const state: State = {
  id: 7,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};

describe('StateListItem', () => {
  it('shows abbreviation and name', async () => {
    await render(<StateListItem state={state} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('SP')).toBeOnTheScreen();
    expect(screen.getByText('Sao Paulo')).toBeOnTheScreen();
  });

  it('shows the created date and a dash for a state that was never updated', async () => {
    await render(<StateListItem state={state} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText(/Created/)).toBeOnTheScreen();
    expect(screen.getByText(/Updated: -/)).toBeOnTheScreen();
  });

  it('has per-row actions labelled with the abbreviation', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await render(<StateListItem state={state} onEdit={onEdit} onDelete={onDelete} />);
    const user = userEvent.setup();

    await user.press(screen.getByRole('button', { name: 'Edit SP' }));
    expect(onEdit).toHaveBeenCalledWith(state);

    await user.press(screen.getByRole('button', { name: 'Delete SP' }));
    expect(onDelete).toHaveBeenCalledWith(state);
  });

  it('disables delete while a deletion is running', async () => {
    await render(<StateListItem state={state} onEdit={jest.fn()} onDelete={jest.fn()} deleting />);
    expect(screen.getByRole('button', { name: 'Delete SP' })).toBeDisabled();
  });
});
