import { Linking } from 'react-native';
import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import AskAiScreen from '@/app/assistant';
import { aiAgentService } from '@/services/aiAgentService';
import { renderWithProviders } from '@/testUtils';

jest.mock('@/services/aiAgentService');

describe('AskAiScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(aiAgentService.ask).mockResolvedValue({
      answer: 'There are 26 states and one federal district.',
      language: 'en',
    });
  });

  it('explains the live data integration and provides a source link', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderWithProviders(<AskAiScreen />);

    expect(screen.getByRole('header', { name: 'Ask about Brazilian states' })).toBeOnTheScreen();
    expect(screen.getByText(/real data queried from the Estado API/i)).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('link', { name: 'View AI agent source' }));
    expect(openUrl).toHaveBeenCalledWith('https://github.com/ronybrand/estado-ai-agent');
    openUrl.mockRestore();
  });

  it('keeps the ask action disabled for an empty question and enforces the backend limit', async () => {
    await renderWithProviders(<AskAiScreen />);

    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
    expect(screen.getByLabelText('Ask a question')).toHaveProp('maxLength', 1000);
    expect(aiAgentService.ask).not.toHaveBeenCalled();
  });

  it('submits a trimmed question, shows progress, and renders the live answer', async () => {
    let resolveAnswer!: (value: { answer: string; language: 'en' }) => void;
    jest.mocked(aiAgentService.ask).mockReturnValue(
      new Promise((resolve) => {
        resolveAnswer = resolve;
      }),
    );
    const user = userEvent.setup();
    await renderWithProviders(<AskAiScreen />);

    await user.type(screen.getByLabelText('Ask a question'), '  How many states are there?  ');
    await user.press(screen.getByRole('button', { name: 'Ask' }));

    expect(aiAgentService.ask).toHaveBeenCalledWith('How many states are there?');
    expect(screen.getByRole('button', { name: 'Asking...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Asking...' })).toBeBusy();

    await act(async () =>
      resolveAnswer({ answer: 'There are 26 states and one federal district.', language: 'en' }),
    );
    expect(
      await screen.findByText('There are 26 states and one federal district.'),
    ).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ask' })).toBeEnabled());
  });

  it('fills the input when a suggested question is selected', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<AskAiScreen />);

    await user.press(screen.getByRole('button', { name: 'How many Brazilian states are there?' }));

    expect(screen.getByLabelText('Ask a question')).toHaveProp(
      'value',
      'How many Brazilian states are there?',
    );
  });

  it('shows an actionable offline message when the request fails without a response', async () => {
    jest
      .mocked(aiAgentService.ask)
      .mockRejectedValue(Object.assign(new Error('Network unavailable'), { isAxiosError: true }));
    const user = userEvent.setup();
    await renderWithProviders(<AskAiScreen />);

    await user.type(screen.getByLabelText('Ask a question'), 'How many states are there?');
    await user.press(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/API is offline/i);
    expect(screen.getByRole('link', { name: 'Turn on the API' })).toBeOnTheScreen();
  });

  it('shows backend errors and validated request ids without exposing raw details', async () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    jest.mocked(aiAgentService.ask).mockRejectedValue(
      Object.assign(new Error('Rate limited'), {
        isAxiosError: true,
        response: { data: { message: 'Rate limit exceeded', requestId }, status: 429 },
      }),
    );
    const user = userEvent.setup();
    await renderWithProviders(<AskAiScreen />);

    await user.type(screen.getByLabelText('Ask a question'), 'How many states are there?');
    await user.press(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Failed to reach the AI assistant\. Please try again shortly\./,
    );
    expect(screen.getByText(`Reference ID: ${requestId}`)).toBeOnTheScreen();
    expect(screen.queryByText('Rate limit exceeded')).toBeNull();
  });
});
