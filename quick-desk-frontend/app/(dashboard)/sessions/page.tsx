'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, SessionItem } from '@/services/auth.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { setAccessToken } from '@/lib/api';
import { Loader } from '@/components/common/Loader';

import { toast } from 'sonner';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getSessions();
      setSessions(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to load active sessions';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string, isCurrent?: boolean) => {
    try {
      setActionLoading(true);
      const res = await AuthService.revokeSession(sessionId);

      if (res?.message) {
        toast.success(res.message);
      }

      if (isCurrent || res?.data?.isCurrentSession) {
        setAccessToken(null);
        router.push('/login');
        return;
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setActionLoading(true);
      const res = await AuthService.logoutAll();
      if (res?.message) {
        toast.success(res.message);
      }
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to logout from all devices');
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Active Sessions</h1>
          <p className="text-sm text-muted-foreground">Manage your active device logins and security tokens</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading || sessions.length === 0}
              >
                Sign Out All Devices
              </Button>
            }
          />

          <AlertDialogContent className="bg-popover border-border text-popover-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">Sign out from all devices?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-xs">
                This action will invalidate all current active sessions across all browsers. You will need to sign in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogoutAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sign Out All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="bg-card border-border text-card-foreground">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Logged-in Devices</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            List of all authenticated devices for your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader />
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No active sessions found.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-medium">Device & Platform</TableHead>
                  <TableHead className="text-muted-foreground font-medium">IP Address</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Logged In At</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{session.userAgent || 'Unknown Device'}</span>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-[10px]">
                            Current Session
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs">
                      {session.ipAddress || '127.0.0.1'}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(session.createdAt).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="text-xs border-border hover:bg-destructive/10 hover:text-destructive"
                            >
                              Revoke
                            </Button>
                          }
                        />

                        <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-bold">
                              {session.isCurrent ? 'Revoke Current Session?' : 'Revoke Session?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-xs">
                              {session.isCurrent
                                ? 'This is your current active session. You will be logged out immediately if you revoke this.'
                                : 'Are you sure you want to revoke access for this device?'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel variant="outline">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeSession(session.id, session.isCurrent)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Access
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
