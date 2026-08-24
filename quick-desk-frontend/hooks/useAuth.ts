'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';
import { UserProfile } from '@/types';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    AuthService.getProfile()
      .then((data) => {
        setUser(data);
        setError(null);
      })
      .catch((err) => {
        if ((err as any).status === 401) {
          setUser(null);
          router.push('/login');
        } else {
          setError(err);
          toast.error(err.message || 'An error occurred during authentication');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const logout = async () => {
    const res = await AuthService.logout();
    setUser(null);
    if (res?.message) {
      toast.success(res.message);
    }
    router.push('/login');
  };

  return { user, loading, error, logout };
}
