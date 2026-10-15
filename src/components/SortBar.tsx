import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

export type SortField = 'nome' | 'sigla';
export type SortDirection = 'asc' | 'desc';

interface SortBarProps {
  field: SortField | null;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

// The wire names (sigla, nome) are the backend's `sort` contract; the labels
// are what the user reads.
const OPTIONS: { field: SortField; label: string }[] = [
  { field: 'sigla', label: 'Abbreviation' },
  { field: 'nome', label: 'Name' },
];

export function SortBar({ field, direction, onSort }: SortBarProps) {
  return (
    <View style={styles.bar}>
      <Text style={styles.caption}>Sort by</Text>
      {OPTIONS.map((option) => {
        const selected = option.field === field;
        return (
          <Pressable
            key={option.field}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            // VoiceOver/TalkBack read the value after the label: "Abbreviation, descending".
            accessibilityValue={
              selected ? { text: direction === 'asc' ? 'ascending' : 'descending' } : undefined
            }
            onPress={() => onSort(option.field)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.label}
              {selected ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  caption: { color: colors.muted, fontSize: 13 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextSelected: { color: colors.onBrand, fontWeight: '600' },
});
