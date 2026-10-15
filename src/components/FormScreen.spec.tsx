import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { FormScreen } from './FormScreen';

describe('FormScreen', () => {
  it('renders the title, the error and the form content', async () => {
    await render(
      <FormScreen title="New state" error="Oops" requestId={null}>
        <Text>body</Text>
      </FormScreen>,
    );
    expect(screen.getByRole('header', { name: 'New state' })).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Oops');
    expect(screen.getByText('body')).toBeOnTheScreen();
  });

  it('keeps taps working while the keyboard is open', async () => {
    await render(
      <FormScreen title="T" error={null} requestId={null}>
        <Text>body</Text>
      </FormScreen>,
    );
    expect(screen.getByTestId('form-scroll')).toHaveProp('keyboardShouldPersistTaps', 'handled');
  });
});
