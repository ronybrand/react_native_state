import { render, screen, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { API_UNAVAILABLE_MESSAGE, START_API_URL } from '@/lib/apiErrorMessage';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  it('renders nothing without an error', async () => {
    await render(<ErrorBanner error={null} requestId={null} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('announces the message as an alert', async () => {
    await render(<ErrorBanner error="Failed" requestId={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.queryByText(/Reference ID/)).toBeNull();
  });

  it('is an assertive live region, so screen readers announce it as soon as it appears', async () => {
    await render(<ErrorBanner error="Failed" requestId={null} />);
    expect(screen.getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'assertive');
  });

  it('shows the reference id when present', async () => {
    await render(<ErrorBanner error="Failed" requestId="abc" />);
    expect(screen.getByText('Reference ID: abc')).toBeOnTheScreen();
  });

  it('offers the turn-on link only when the API is unavailable, opening it in the browser', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<ErrorBanner error={API_UNAVAILABLE_MESSAGE} requestId={null} />);

    await userEvent.setup().press(screen.getByRole('link', { name: 'Turn on the API' }));

    expect(openURL).toHaveBeenCalledWith(START_API_URL);
    openURL.mockRestore();
  });

  it('shows no link for an ordinary error', async () => {
    await render(<ErrorBanner error="Failed" requestId={null} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
