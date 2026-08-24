'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthService } from '@/services/auth.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await AuthService.login({ email, password });
      if (res?.message) {
        toast.success(res.message);
      }

      const user = res?.data?.user;
      if (user) {
        if (user.role === 'AGENT') {
          router.push('/agent');
        } else {
          router.push('/employee');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card text-card-foreground border-border shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <img src="/logo.png" alt="QuickDesk Logo" className="mx-auto w-12 h-12 object-contain rounded-xl shadow-lg mb-2" />
        <CardTitle className="text-2xl font-bold text-foreground">QuickDesk</CardTitle>
        <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              required
              placeholder="alex@quickdesk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Password</label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
