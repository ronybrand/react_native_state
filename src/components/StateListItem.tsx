import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { formatDate } from '@/lib/formatDate';
import type { State } from '@/interfaces/state';
import { colors, spacing } from '@/theme/colors';

interface StateListItemProps {
  state: State;
  onEdit: (state: State) => void;
  onDelete: (state: State) => void;
  deleting?: boolean;
}

// memo: a FlatList re-renders rows on scroll and on every search keystroke;
// the row only depends on its props.
export const StateListItem = memo(function StateListItem({
  state,
  onEdit,
  onDelete,
  deleting = false,
}: StateListItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.abbreviation}>{state.abbreviation}</Text>
        <Text style={styles.name}>{state.name}</Text>
      </View>
      <Text style={styles.meta}>Created: {formatDate(state.createdAt)}</Text>
      <Text style={styles.meta}>Updated: {formatDate(state.updatedAt)}</Text>
      <View style={styles.actions}>
        <AppButton
          label="Edit"
          accessibilityLabel={`Edit ${state.abbreviation}`}
          onPress={() => onEdit(state)}
        />
        <AppButton
          label="Delete"
          variant="danger"
          accessibilityLabel={`Delete ${state.abbreviation}`}
          disabled={deleting}
          onPress={() => onDelete(state)}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  abbreviation: { fontSize: 20, fontWeight: '700', color: colors.brand },
  name: { fontSize: 17, color: colors.text, flexShrink: 1 },
  meta: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
