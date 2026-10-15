import { useEffect, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FormScreen } from '@/components/FormScreen';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { StateForm } from '@/components/StateForm';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useStateById, useStates, useUpdateState } from '@/hooks/useStateQueries';
import { extractRequestId } from '@/lib/extractRequestId';
import { closeScreen } from '@/lib/navigation';
import type { NewState } from '@/interfaces/state';

export default function EditStateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  // A route param is user-controllable (deep links): validate before it reaches the API.
  const stateId = Number(id);
  const validId = typeof id === 'string' && Number.isInteger(stateId) && stateId > 0;

  const { data: state, isLoading, isError, error: loadError } = useStateById(stateId, validId);
  const updateState = useUpdateState();
  const { data: states } = useStates();
  const existingAbbreviations = useMemo(() => states?.map((s) => s.abbreviation), [states]);
  const { error, requestId, setError, clearError } = useErrorMessage();
  const initialValues = useMemo(
    () => (state ? { abbreviation: state.abbreviation, name: state.name } : undefined),
    [state],
  );

  useEffect(() => {
    if (!validId) {
      setError('Invalid state.');
    } else if (isError) {
      setError('Failed to fetch state.', extractRequestId(loadError));
    } else {
      clearError();
    }
  }, [validId, isError, loadError, setError, clearError]);

  function handleSubmit(data: NewState) {
    if (!state) {
      return;
    }
    updateState.mutate(
      { ...state, ...data },
      {
        onSuccess: () => closeScreen(router),
        onError: (err) => setError('Failed to update state.', extractRequestId(err)),
      },
    );
  }

  return (
    <FormScreen title="Edit state" error={error} requestId={requestId}>
      {validId && isLoading ? <LoadingIndicator /> : null}
      {initialValues ? (
        <StateForm
          initialValues={initialValues}
          disabled={updateState.isPending}
          existingAbbreviations={existingAbbreviations}
          onSubmitState={handleSubmit}
        />
      ) : null}
    </FormScreen>
  );
}
