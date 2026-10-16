import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppFooter } from '@/components/AppFooter';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { SortBar, type SortDirection, type SortField } from '@/components/SortBar';
import { StateListItem } from '@/components/StateListItem';
import { useAuth } from '@/auth/AuthProvider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useDeleteState, useStates } from '@/hooks/useStateQueries';
import { extractRequestId } from '@/lib/extractRequestId';
import type { State } from '@/interfaces/state';
import { colors, spacing } from '@/theme/colors';

const DEBOUNCE_MS = 300;

export default function StateListScreen() {
  const { status, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [refreshing, setRefreshing] = useState(false);

  const sort = sortField ? `${sortField},${sortDirection}` : undefined;
  const {
    data: states = [],
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useStates(debouncedSearch || undefined, sort);
  const deleteState = useDeleteState();
  const { error, requestId, setError } = useErrorMessage();

  useEffect(() => {
    if (isError) {
      setError('Failed to fetch states.', extractRequestId(loadError));
    }
  }, [isError, loadError, setError]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  // The spinner belongs to the user's own pull, not to background refetches
  // (search, sort, invalidation after a mutation), so it is its own state.
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  // Native confirmation instead of deleting on tap: the destructive choice is
  // marked as such and Cancel is the safe default.
  const confirmDelete = useCallback(
    (state: State) => {
      Alert.alert('Delete state', `Are you sure you want to delete ${state.abbreviation}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteState.mutate(state.id, {
              onError: (err) => setError('Failed to delete state.', extractRequestId(err)),
            }),
        },
      ]);
    },
    [deleteState, setError],
  );

  const editState = useCallback((state: State) => router.push(`/state/${state.id}/edit`), []);

  const header = (
    <View style={styles.header}>
      <ErrorBanner error={error} requestId={requestId} />
      <View style={styles.actions}>
        {status === 'authenticated' ? (
          <AppButton label="Log out" variant="neutral" onPress={() => void signOut()} />
        ) : status === 'unauthenticated' ? (
          <AppButton label="Log in" variant="neutral" onPress={() => router.push('/login')} />
        ) : null}
        <AppButton label="New state" variant="success" onPress={() => router.push('/state/new')} />
      </View>
      <TextInput
        testID="state-search"
        accessibilityLabel="Search by name or abbreviation"
        placeholder="Search by name or abbreviation..."
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.search}
      />
      <SortBar field={sortField} direction={sortDirection} onSort={handleSort} />
    </View>
  );

  return (
    <FlatList
      testID="state-list"
      data={states}
      keyExtractor={(state) => String(state.id)}
      renderItem={({ item }) => (
        <StateListItem
          state={item}
          onEdit={editState}
          onDelete={confirmDelete}
          deleting={deleteState.isPending}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? (
          <LoadingIndicator />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No states registered.</Text>
            <AppButton
              label="Create the first state"
              variant="success"
              onPress={() => router.push('/state/new')}
            />
          </View>
        )
      }
      ListFooterComponent={<AppFooter />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      // Taps on a row's buttons must work while the search keyboard is open.
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      style={styles.list}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  separator: { height: spacing.md },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyText: { color: colors.muted, fontSize: 15 },
});
