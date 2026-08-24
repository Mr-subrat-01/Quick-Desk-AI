'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { LoginForm } from '@/components/forms/LoginForm';
import { toast } from 'sonner';

import { FullPageLoader } from '@/components/common/Loader';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('is_logged_in') === 'false') {
      setChecking(false);
      return;
    }

    AuthService.getProfile()
      .then((user) => {
        if (user) {
          const target = user.role === 'AGENT' ? '/agent' : '/employee';
          router.replace(target);
        } else {
          setChecking(false);
        }
      })
      .catch((err) => {
        setChecking(false);
        if (err && (err as any).status !== 401) {
          toast.error(err.message || 'An error occurred during authentication');
        }
      });
  }, [router]);

  if (checking) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <LoginForm />
    </div>
  );
}
