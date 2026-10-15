import { colors } from './colors';

// Shared by the root stack and the protected stack so every header looks alike.
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.brand },
  headerTintColor: colors.onBrand,
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: colors.background },
};
