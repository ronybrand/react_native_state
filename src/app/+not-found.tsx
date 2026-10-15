import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { colors, spacing } from '@/theme/colors';

// Reached by an unknown deep link (estados://nope).
export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Page not found
      </Text>
      <Text style={styles.text}>The screen you are looking for does not exist.</Text>
      <AppButton label="Back to home" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: colors.text },
  text: { color: colors.muted, fontSize: 15 },
});
