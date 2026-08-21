'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/common/Navbar';
import { FullPageLoader } from '@/components/common/Loader';
import { socket } from '@/lib/socket';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
    }
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const isWrongRole = user && (
    (pathname.startsWith('/agent') && user.role !== 'AGENT') ||
    (pathname.startsWith('/employee') && user.role !== 'EMPLOYEE')
  );

  useEffect(() => {
    if (isWrongRole) {
      const correctPath = user.role === 'AGENT' ? '/agent' : '/employee';
      router.replace(correctPath);
    }
  }, [isWrongRole, user?.role, router]);

  if (loading || isWrongRole) {
    return <FullPageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} onLogout={logout} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}