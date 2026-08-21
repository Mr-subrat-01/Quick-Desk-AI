export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}, retryOn401 = true): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  let response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && retryOn401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.data?.accessToken) {
        setAccessToken(refreshData.data.accessToken);
        headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;

        response = await fetch(`${BACKEND_URL}${endpoint}`, {
          ...options,
          credentials: 'include',
          headers,
        });
      } else {
        setAccessToken(null);
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    } catch {
      console.log(`Refresh Token Failed and set access token to null `);
      setAccessToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
  }

  const data = await response.json();
  if (!response.ok) {
    console.log(`API request failed: ${endpoint} | ${retryOn401} | ${data?.message} | ${response.status} | ${response.statusText}`);
    throw new Error(data.message || 'API request failed');
  }

  return data;
}
