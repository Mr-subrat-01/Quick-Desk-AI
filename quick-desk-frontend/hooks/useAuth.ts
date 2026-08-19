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

  useEffect(() => {
    AuthService.getProfile()
      .then((data) => setUser(data))
      .catch(() => {
        setUser(null);
        router.push('/login');
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

  return { user, loading, logout };
}
