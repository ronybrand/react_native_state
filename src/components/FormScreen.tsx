import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { ErrorBanner } from './ErrorBanner';
import { colors, spacing } from '@/theme/colors';

interface FormScreenProps {
  title: string;
  error: string | null;
  requestId: string | null;
  children: ReactNode;
}

export function FormScreen({ title, error, requestId, children }: FormScreenProps) {
  return (
    // iOS needs padding to lift the form above the keyboard; Android resizes the
    // window itself (adjustResize), so the behaviour is left off there.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* "handled": a tap on a button still works while the keyboard is open,
          instead of the first tap only dismissing it. */}
      <ScrollView
        testID="form-scroll"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <ErrorBanner error={error} requestId={requestId} />
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
});
