import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stateService } from '@/services/stateService';

// Every state mutation invalidates the whole ['states'] key, so the list and
// any open detail query refetch.
function useInvalidatingMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    // React Query passes extra context as a 2nd argument; the services take one.
    mutationFn: (variables: TVariables) => mutationFn(variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['states'] }),
  });
}

export function useStates(search?: string, sort?: string) {
  return useQuery({
    queryKey: ['states', search, sort],
    queryFn: () => stateService.list(search, sort),
    // Keep the rows on screen while a new search or sort loads, instead of
    // swapping the list for a spinner on every keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useStateById(id: number, enabled = true) {
  return useQuery({
    queryKey: ['states', id],
    queryFn: () => stateService.get(id),
    enabled,
  });
}

export const useCreateState = () => useInvalidatingMutation(stateService.create);
export const useUpdateState = () => useInvalidatingMutation(stateService.update);
export const useDeleteState = () => useInvalidatingMutation(stateService.delete);
