import { render, screen } from '@testing-library/react-native';
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
});
