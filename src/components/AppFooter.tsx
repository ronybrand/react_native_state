import { StyleSheet, Text, View } from 'react-native';
import { useBackendInfo } from '@/hooks/useBackendInfo';
import { formatDate } from '@/lib/formatDate';
import { getAppVersion } from '@/lib/appVersion';
import { colors, spacing } from '@/theme/colors';

export function AppFooter() {
  const { data: backendInfo } = useBackendInfo();

  return (
    <View style={styles.footer}>
      <Text style={styles.text}>app {getAppVersion()}</Text>
      {backendInfo ? (
        <>
          <Text style={styles.text}>|</Text>
          <Text style={styles.text}>
            back {backendInfo.build.commit} · {formatDate(backendInfo.build.time)}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  text: { fontSize: 11, color: colors.muted },
});
