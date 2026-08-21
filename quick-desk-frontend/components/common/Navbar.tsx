'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NavbarProps } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { LogOut, Monitor } from 'lucide-react';

export function Navbar({ user, onLogout }: NavbarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const logoHref = user
    ? (user.role === 'AGENT' ? '/agent' : '/employee')
    : '/login';

  return (
    <>
      <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={logoHref} className="flex items-center gap-2">
            <img src="/logo.png" alt="QuickDesk Logo" className="w-8 h-8 object-contain rounded-lg shadow-md" />
            <span className="font-bold text-foreground text-base tracking-tight">QuickDesk</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-muted-foreground">
              {user.role === 'AGENT' && (
                <>
                  <Link href="/agent" className="hover:text-primary transition-colors">
                    Agent Dashboard
                  </Link>
                  <Link href="/agent/metrics" className="hover:text-primary transition-colors">
                    Metrics Dashboard
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer">
                <Avatar size="default" className="bg-primary/10 border border-primary/20 text-primary font-semibold hover:opacity-90">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="p-2 font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground leading-none truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="p-0">
                  <Link href="/sessions" className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer">
                    <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Active Sessions</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your QuickDesk account? You will need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowLogoutConfirm(false);
                onLogout();
              }}
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
