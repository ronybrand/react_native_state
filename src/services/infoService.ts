import { httpClient } from '../lib/httpClient';
import type { BackendInfo } from '../interfaces/backendInfo';

export const infoService = {
  getBackendInfo: () => httpClient.get<BackendInfo>('/actuator/info').then((r) => r.data),
};
