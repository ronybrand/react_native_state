import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@/lib/httpClient';
import { AI_REQUEST_TIMEOUT_MS, aiAgentService } from './aiAgentService';

describe('aiAgentService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(httpClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('sends a question to the public backend proxy and returns the AI answer', async () => {
    mock.onPost('/ask?lang=en', { question: 'How many Brazilian states are there?' }).reply(200, {
      answer: 'There are 26 states and one federal district.',
      language: 'en',
    });

    await expect(aiAgentService.ask('How many Brazilian states are there?')).resolves.toEqual({
      answer: 'There are 26 states and one federal district.',
      language: 'en',
    });
    expect(mock.history.post[0]?.timeout).toBe(AI_REQUEST_TIMEOUT_MS);
  });

  it('rejects when the backend cannot answer instead of returning a fallback answer', async () => {
    mock.onPost('/ask?lang=en').reply(429, { message: 'Rate limit exceeded' });

    await expect(aiAgentService.ask('How many states are there?')).rejects.toThrow();
  });
});
