import { useMemo } from 'react';
import { router } from 'expo-router';
import { FormScreen } from '@/components/FormScreen';
import { StateForm } from '@/components/StateForm';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useCreateState, useStates } from '@/hooks/useStateQueries';
import { extractRequestId } from '@/lib/extractRequestId';
import { closeScreen } from '@/lib/navigation';
import type { NewState } from '@/interfaces/state';

export default function CreateStateScreen() {
  const createState = useCreateState();
  const { data: states } = useStates();
  const existingAbbreviations = useMemo(() => states?.map((s) => s.abbreviation), [states]);
  const { error, requestId, setError } = useErrorMessage();

  function handleSubmit(state: NewState) {
    createState.mutate(state, {
      onSuccess: () => closeScreen(router),
      onError: (err) => setError('Failed to create state.', extractRequestId(err)),
    });
  }

  return (
    <FormScreen title="New state" error={error} requestId={requestId}>
      <StateForm
        disabled={createState.isPending}
        existingAbbreviations={existingAbbreviations}
        onSubmitState={handleSubmit}
      />
    </FormScreen>
  );
}
