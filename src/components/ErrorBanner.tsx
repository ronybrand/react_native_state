import { StyleSheet, Text, View } from 'react-native';
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
  reference: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
});
