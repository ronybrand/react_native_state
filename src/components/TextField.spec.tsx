import { render, screen, userEvent } from '@testing-library/react-native';
import { TextField } from './TextField';

describe('TextField', () => {
  it('is labelled so screen readers and tests find it by its label', async () => {
    await render(<TextField label="Name" value="" onChangeText={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toBeOnTheScreen();
    expect(screen.getByText('Name')).toBeOnTheScreen();
  });

  it('reports typed text', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Name" value="" onChangeText={onChangeText} />);
    await userEvent.setup().type(screen.getByLabelText('Name'), 'Rio');
    expect(onChangeText).toHaveBeenCalledTimes(3);
  });

  it('shows no error by default', async () => {
    await render(<TextField label="Name" value="" onChangeText={jest.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the error text, announced, when there is an error', async () => {
    await render(<TextField label="Name" value="" onChangeText={jest.fn()} error="Too short" />);
    expect(screen.getByText('Too short')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('passes native input props through (capitalization, max length)', async () => {
    await render(
      <TextField
        label="Abbreviation"
        value=""
        onChangeText={jest.fn()}
        maxLength={2}
        autoCapitalize="characters"
      />,
    );
    const input = screen.getByLabelText('Abbreviation');
    expect(input).toHaveProp('maxLength', 2);
    expect(input).toHaveProp('autoCapitalize', 'characters');
  });
});
