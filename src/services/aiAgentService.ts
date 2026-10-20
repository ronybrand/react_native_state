import { httpClient } from '@/lib/httpClient';

export interface AiAgentResponse {
  answer: string;
  language?: 'en' | 'pt' | null;
}

// The BFF may spend up to 50s waiting for the agent; leave a small margin so
// the app receives its structured response instead of timing out first.
export const AI_REQUEST_TIMEOUT_MS = 55_000;

export const aiAgentService = {
  ask: (question: string) =>
    httpClient
      .post<AiAgentResponse>('/ask?lang=en', { question }, { timeout: AI_REQUEST_TIMEOUT_MS })
      .then((response) => response.data),
};
