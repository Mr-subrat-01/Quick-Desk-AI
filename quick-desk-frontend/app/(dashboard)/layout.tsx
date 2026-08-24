'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/common/Navbar';
import { FullPageLoader } from '@/components/common/Loader';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }
    const joinRoom = () => {
      if (user.role === 'AGENT') {
        socket.emit('join:agents');
      } else {
        socket.emit('join:employee', { employeeId: user.id });
      }
    };
    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);
    return () => {
      socket.off('connect', joinRoom);
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

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

  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-slate-400">
          {error.message || 'We encountered an issue checking your session.'}
        </p>
        <Button onClick={() => window.location.reload()} size="sm">Retry Connection</Button>
      </div>
    );
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