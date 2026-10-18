import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { API_UNAVAILABLE_MESSAGE, START_API_URL } from '@/lib/apiErrorMessage';
import { colors, spacing } from '@/theme/colors';

interface ErrorBannerProps {
  error: string | null;
  requestId: string | null;
}

export function ErrorBanner({ error, requestId }: ErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    // An assertive live region makes TalkBack announce it on Android; iOS
    // VoiceOver announces role "alert" content the same way.
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.banner}
    >
      <Text style={styles.message}>{error}</Text>
      {error === API_UNAVAILABLE_MESSAGE ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(START_API_URL)}
          style={styles.link}
        >
          <Text style={styles.linkText}>Turn on the API</Text>
        </Pressable>
      ) : null}
      {requestId ? <Text style={styles.reference}>Reference ID: {requestId}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  message: { color: colors.danger, fontSize: 15 },
  link: { marginTop: spacing.sm, paddingVertical: spacing.xs },
  linkText: { color: colors.danger, fontSize: 15, textDecorationLine: 'underline' },
  reference: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
});
