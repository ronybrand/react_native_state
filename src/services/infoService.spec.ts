import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '../lib/httpClient';
import { infoService } from './infoService';

describe('infoService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(httpClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('getBackendInfo returns the build info from /actuator/info', async () => {
    const info = { build: { commit: 'abc1234', time: '2026-01-01T00:00:00Z' } };
    mock.onGet('/actuator/info').reply(200, info);

    expect(await infoService.getBackendInfo()).toEqual(info);
  });

  it('getBackendInfo rejects when the backend is down', async () => {
    mock.onGet('/actuator/info').reply(503);

    await expect(infoService.getBackendInfo()).rejects.toThrow();
  });
});
