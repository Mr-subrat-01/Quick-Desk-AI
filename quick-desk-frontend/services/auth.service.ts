import { fetchApi, setAccessToken } from '../lib/api';
import { LoginPayload, SessionItem, UserProfile } from '@/types';

export type { LoginPayload, SessionItem, UserProfile };

let getProfilePromise: Promise<UserProfile> | null = null;

export const AuthService = {
  async login(payload: LoginPayload) {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('is_logged_in', 'true');
      }
    }
    return res;
  },

  getProfile(): Promise<UserProfile> {
    if (!getProfilePromise) {
      getProfilePromise = fetchApi('/auth/me')
        .then((res) => {
          getProfilePromise = null;
          return res.data;
        })
        .catch((err) => {
          getProfilePromise = null;
          if (typeof window !== 'undefined') {
            localStorage.setItem('is_logged_in', 'false');
          }
          throw err;
        });
    }
    return getProfilePromise;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('is_logged_in', 'false');
    }
    return res;
  },

  async logout() {
    const res = await fetchApi('/auth/logout', { method: 'POST' });
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('is_logged_in', 'false');
    }
    return res;
  },
};
