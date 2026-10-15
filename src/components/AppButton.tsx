import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/theme/colors';

type Variant = 'primary' | 'success' | 'danger' | 'neutral';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

const background: Record<Variant, string> = {
  primary: colors.brand,
  success: colors.success,
  danger: colors.danger,
  neutral: colors.border,
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: AppButtonProps) {
  const inactive = disabled || loading;
  const textColor = variant === 'neutral' ? colors.text : colors.onBrand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      // 44pt is the minimum touch target on iOS (48dp on Android).
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background[variant] },
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '600' },
});
