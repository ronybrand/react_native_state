import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import LoginScreen from '@/app/login';
import { createAuth, renderWithProviders, resetRouter } from '@/testUtils';

async function fill(username = 'admin', password = 'secret') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Username'), username);
  await user.type(screen.getByLabelText('Password'), password);
  return user;
}

const logIn = () => screen.getByRole('button', { name: 'Log in' });

describe('LoginScreen', () => {
  beforeEach(() => resetRouter());

  it('exposes stable test ids on the fields, for the end-to-end flows', async () => {
    await renderWithProviders(<LoginScreen />);
    expect(screen.getByTestId('login-username')).toBe(screen.getByLabelText('Username'));
    expect(screen.getByTestId('login-password')).toBe(screen.getByLabelText('Password'));
  });

  it('keeps Log in disabled until both fields are filled', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<LoginScreen />);
    expect(logIn()).toBeDisabled();
    await user.type(screen.getByLabelText('Username'), 'admin');
    expect(logIn()).toBeDisabled();
    await user.type(screen.getByLabelText('Password'), 'secret');
    expect(logIn()).toBeEnabled();
  });

  it('hides the password and tells the keyboard what the fields are', async () => {
    await renderWithProviders(<LoginScreen />);
    const password = screen.getByLabelText('Password');
    expect(password).toHaveProp('secureTextEntry', true);
    expect(password).toHaveProp('textContentType', 'password');
    expect(password).toHaveProp('autoComplete', 'current-password');
    const username = screen.getByLabelText('Username');
    expect(username).toHaveProp('autoCapitalize', 'none');
    expect(username).toHaveProp('textContentType', 'username');
  });

  it('signs in and goes to the list', async () => {
    const auth = createAuth();
    await renderWithProviders(<LoginScreen />, { auth });
    const user = await fill();
    await user.press(logIn());
    await waitFor(() =>
      expect(auth.signIn).toHaveBeenCalledWith({ username: 'admin', password: 'secret' }),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  });

  it('shows an error and stays when the credentials are rejected', async () => {
    const auth = createAuth({ signIn: jest.fn().mockRejectedValue(new Error('401')) });
    await renderWithProviders(<LoginScreen />, { auth });
    const user = await fill();
    await user.press(logIn());
    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid username or password\./);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('ignores a second press while the first request is in flight', async () => {
    const auth = createAuth({ signIn: jest.fn(() => new Promise<void>(() => {})) });
    await renderWithProviders(<LoginScreen />, { auth });
    const user = await fill();
    await user.press(logIn());
    await user.press(logIn());
    expect(auth.signIn).toHaveBeenCalledTimes(1);
  });

  it('lets the user try again after a failure', async () => {
    const auth = createAuth({ signIn: jest.fn().mockRejectedValue(new Error('401')) });
    await renderWithProviders(<LoginScreen />, { auth });
    const user = await fill();
    await user.press(logIn());
    await screen.findByRole('alert');
    await user.press(logIn());
    await waitFor(() => expect(auth.signIn).toHaveBeenCalledTimes(2));
  });

  it('shows the public demo credentials', async () => {
    await renderWithProviders(<LoginScreen />);
    expect(screen.getByTestId('demo-credentials')).toHaveTextContent(/admin/);
  });
});
