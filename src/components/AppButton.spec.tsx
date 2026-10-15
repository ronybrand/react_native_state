import { render, screen, userEvent } from '@testing-library/react-native';
import { AppButton } from './AppButton';

describe('AppButton', () => {
  it('renders its label as a button', async () => {
    await render(<AppButton label="Save" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<AppButton label="Save" onPress={onPress} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress and reports itself disabled when disabled', async () => {
    const onPress = jest.fn();
    await render(<AppButton label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await userEvent.setup().press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is busy and not pressable while loading', async () => {
    const onPress = jest.fn();
    await render(<AppButton label="Log in" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Log in' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    await userEvent.setup().press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('can carry a custom accessibility label (per-row actions)', async () => {
    await render(<AppButton label="Delete" accessibilityLabel="Delete SP" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete SP' })).toBeOnTheScreen();
  });
});
