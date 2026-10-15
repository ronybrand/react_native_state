import { render, screen } from '@testing-library/react-native';
import { LoadingIndicator } from './LoadingIndicator';

it('is exposed to assistive tech as a labelled progress indicator', async () => {
  await render(<LoadingIndicator />);
  expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeOnTheScreen();
});
