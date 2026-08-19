'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/common/Navbar';
import { FullPageLoader } from '@/components/common/Loader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (pathname.startsWith('/agent') && user.role !== 'AGENT') {
        router.replace('/employee/tickets');
      } else if (pathname.startsWith('/employee') && user.role !== 'EMPLOYEE') {
        router.replace('/agent/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return null;
  }

  const isUnauthorized =
    (pathname.startsWith('/agent') && user.role !== 'AGENT') ||
    (pathname.startsWith('/employee') && user.role !== 'EMPLOYEE');

  if (isUnauthorized) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} onLogout={logout} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
