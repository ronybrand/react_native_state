import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

export function LoadingIndicator() {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={styles.box}
    >
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: spacing.xl },
});
