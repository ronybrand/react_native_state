import { render, screen, userEvent } from '@testing-library/react-native';
import { SortBar } from './SortBar';

describe('SortBar', () => {
  it('offers sorting by abbreviation and by name, none selected at first', async () => {
    await render(<SortBar field={null} direction="asc" onSort={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Abbreviation/ })).not.toBeSelected();
    expect(screen.getByRole('button', { name: /Name/ })).not.toBeSelected();
  });

  it('reports which field was pressed', async () => {
    const onSort = jest.fn();
    await render(<SortBar field={null} direction="asc" onSort={onSort} />);
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: /Abbreviation/ }));
    await user.press(screen.getByRole('button', { name: /Name/ }));
    expect(onSort).toHaveBeenNthCalledWith(1, 'sigla');
    expect(onSort).toHaveBeenNthCalledWith(2, 'nome');
  });

  it('marks the active field as selected and says the direction out loud', async () => {
    await render(<SortBar field="sigla" direction="desc" onSort={jest.fn()} />);
    const active = screen.getByRole('button', { name: /Abbreviation/ });
    expect(active).toBeSelected();
    expect(active).toHaveAccessibilityValue({ text: 'descending' });
    expect(screen.getByRole('button', { name: /Name/ })).not.toBeSelected();
  });

  it('says ascending for the ascending direction', async () => {
    await render(<SortBar field="nome" direction="asc" onSort={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Name/ })).toHaveAccessibilityValue({
      text: 'ascending',
    });
  });
});
