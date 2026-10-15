import { useQuery } from '@tanstack/react-query';
import { infoService } from '@/services/infoService';

// The footer is informational, not critical: if the backend does not answer the
// query just stays errored and that part of the footer hides, without an alert.
export function useBackendInfo() {
  return useQuery({
    queryKey: ['backendInfo'],
    queryFn: infoService.getBackendInfo,
    retry: false,
  });
}
