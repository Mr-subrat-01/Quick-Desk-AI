import { toast } from 'sonner';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}
async function makeRequest(
  endpoint: string,
  options: RequestInit,
  token: string | null = inMemoryAccessToken
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });
}
function redirectToLogin() {
  setAccessToken(null);
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/login';
  }
}

export async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true,
  skipGlobalToast = false
): Promise<any> {
  let response = await makeRequest(endpoint, options);

  if (response.status === 401 && retryOn401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    try {
      const refreshResponse = await makeRequest('/auth/refresh', {
        method: 'POST',
      });
      if (!refreshResponse.ok) {
        redirectToLogin();
        const error = new Error('Session expired. Please login again.');
        (error as any).status = 401;
        throw error;
      }
      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.data?.accessToken;
      if (!newAccessToken) {
        redirectToLogin();
        const error = new Error('Failed to refresh access token.');
        (error as any).status = 401;
        throw error;
      }
      setAccessToken(newAccessToken);
      response = await makeRequest(endpoint, options, newAccessToken);
    } catch (error) {
      if (error instanceof Error && ((error as any).status === 401)) {
        throw error;
      }
      redirectToLogin();
      const err = new Error('Failed to authenticate please login again');
      (err as any).status = 401;
      throw err;
    }

  }

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    (error as any).status = response.status;
    if (response.status !== 401 && !skipGlobalToast) {
      toast.error(error.message);
    }
    throw error;
  }

  return data;
}
