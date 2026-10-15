import { httpClient } from '../lib/httpClient';
import { clearToken, saveToken } from '../auth/tokenStorage';
import { LOGIN_PATH } from '../lib/apiPaths';

export interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponseDto {
  token: string;
  expiresInSeconds: number;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await httpClient.post<LoginResponseDto>(LOGIN_PATH, credentials);
    await saveToken(data.token);
    return data;
  },
  logout: () => clearToken(),
};
