import { fetchApi, setAccessToken } from '../lib/api';
import { LoginPayload, SessionItem, UserProfile } from '@/types';

export type { LoginPayload, SessionItem, UserProfile };

export const AuthService = {
  async login(payload: LoginPayload) {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res;
  },

  async getProfile(): Promise<UserProfile> {
    const res = await fetchApi('/auth/me');
    return res.data;
  },

  async getSessions(): Promise<SessionItem[]> {
    const res = await fetchApi('/auth/sessions');
    return res.data || [];
  },

  async revokeSession(sessionId: string) {
    const res = await fetchApi(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
    return res;
  },

  async logoutAll() {
    const res = await fetchApi('/auth/logout-all', { method: 'POST' });
    setAccessToken(null);
    return res;
  },

  async logout() {
    const res = await fetchApi('/auth/logout', { method: 'POST' });
    setAccessToken(null);
    return res;
  },
};
