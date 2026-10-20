import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { AppButton } from '@/components/AppButton';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { extractRequestId } from '@/lib/extractRequestId';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { aiAgentService } from '@/services/aiAgentService';
import { colors, spacing } from '@/theme/colors';

const MAX_QUESTION_LENGTH = 1000;
const AI_AGENT_SOURCE_URL = 'https://github.com/ronybrand/estado-ai-agent';
const SUGGESTED_QUESTIONS = [
  'How many Brazilian states are there?',
  'What is the abbreviation for Paraná?',
  'Which states are in the Southeast region?',
];

export default function AskAiScreen() {
  const [question, setQuestion] = useState('');
  const [exchange, setExchange] = useState<{ question: string; answer: string } | null>(null);
  const { error, requestId, setError, clearError } = useErrorMessage();
  const askMutation = useMutation({
    mutationFn: (submittedQuestion: string) => aiAgentService.ask(submittedQuestion),
  });
  const canAsk = question.trim().length > 0 && !askMutation.isPending;

  function handleAsk() {
    const trimmedQuestion = question.trim();
    clearError();
    setExchange(null);
    askMutation.mutate(trimmedQuestion, {
      onSuccess: (result) => setExchange({ question: trimmedQuestion, answer: result.answer }),
      onError: (err) =>
        setError(
          apiErrorMessage(err, 'Failed to reach the AI assistant. Please try again shortly.'),
          extractRequestId(err),
        ),
    });
  }

  function selectSuggestedQuestion(suggestion: string) {
    setQuestion(suggestion);
    clearError();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        testID="assistant-scroll"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LIVE AI AGENT</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Ask about Brazilian states
          </Text>
          <Text style={styles.intro}>
            Get answers grounded in real data queried from the Estado API, not scripted responses.
          </Text>
          <View style={styles.techStack}>
            <Text style={styles.techLabel}>Spring AI</Text>
            <Text style={styles.techDivider}>/</Text>
            <Text style={styles.techLabel}>Gemini</Text>
            <Text style={styles.techDivider}>/</Text>
            <Text style={styles.techLabel}>Live API tools</Text>
          </View>
        </View>

        <ErrorBanner error={error} requestId={requestId} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your question</Text>
          <TextInput
            testID="assistant-question"
            accessibilityLabel="Ask a question"
            accessibilityHint="Ask about Brazilian states in English or Portuguese"
            editable={!askMutation.isPending}
            multiline
            maxLength={MAX_QUESTION_LENGTH}
            onChangeText={(value) => {
              setQuestion(value);
              clearError();
            }}
            placeholder="e.g. How many states are in the Southeast?"
            placeholderTextColor={colors.muted}
            returnKeyType="default"
            textAlignVertical="top"
            value={question}
            style={styles.input}
          />
          <Text style={styles.counter}>
            {question.length} / {MAX_QUESTION_LENGTH}
          </Text>

          <Text style={styles.sectionLabel}>Try asking</Text>
          <View style={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                accessibilityLabel={suggestion}
                onPress={() => selectSuggestedQuestion(suggestion)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>

          <AppButton
            label={askMutation.isPending ? 'Asking...' : 'Ask'}
            onPress={handleAsk}
            disabled={!canAsk}
            loading={askMutation.isPending}
          />
          <Text style={styles.languageNote}>
            Ask in English or Portuguese; answers are returned in English.
          </Text>
        </View>

        {exchange ? (
          <View
            testID="assistant-answer"
            accessibilityLiveRegion="polite"
            style={styles.answerCard}
          >
            <Text style={styles.answerEyebrow}>AI ANSWER</Text>
            <Text style={styles.askedQuestion}>{exchange.question}</Text>
            <Text selectable style={styles.answer}>
              {exchange.answer}
            </Text>
            <Text style={styles.answerSource}>Generated from live state data</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="View AI agent source"
          onPress={() => void Linking.openURL(AI_AGENT_SOURCE_URL)}
          style={styles.sourceLink}
        >
          <Text style={styles.sourceText}>Explore the AI agent source on GitHub</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  hero: { backgroundColor: colors.brand, borderRadius: 12, padding: spacing.xl, gap: spacing.sm },
  eyebrow: { color: '#c9e6dd', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.onBrand, fontSize: 25, fontWeight: '700', lineHeight: 31 },
  intro: { color: '#edf6f4', fontSize: 15, lineHeight: 22 },
  techStack: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  techLabel: { color: colors.onBrand, fontSize: 12, fontWeight: '600' },
  techDivider: { color: '#c9e6dd', fontSize: 12 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    backgroundColor: colors.background,
  },
  counter: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12, marginTop: -spacing.sm },
  sectionLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  suggestions: { gap: spacing.sm },
  suggestion: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  suggestionText: { color: colors.brandDark, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.75 },
  languageNote: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  answerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.brand,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.lg,
    gap: spacing.md,
  },
  answerEyebrow: { color: colors.brand, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  askedQuestion: { color: colors.muted, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  answer: { color: colors.text, fontSize: 16, lineHeight: 24 },
  answerSource: { color: colors.muted, fontSize: 12 },
  sourceLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sourceText: { color: colors.brand, fontSize: 13, textDecorationLine: 'underline' },
});
