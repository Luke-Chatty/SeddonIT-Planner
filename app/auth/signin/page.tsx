'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Layout } from 'lucide-react';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');
  const [showBackup, setShowBackup] = useState(false);
  const [hasAzure, setHasAzure] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backupError, setBackupError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((d) => setHasAzure(d.hasAzure === true))
      .catch(() => setHasAzure(false));
  }, []);

  const handleMicrosoftSignIn = () => {
    setLoading(true);
    signIn('azure-ad', { callbackUrl });
  };

  const handleBackupSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackupError('');
    setLoading(true);
    const result = await signIn('backup-login', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (result?.error) {
      setBackupError('Invalid email or password.');
      return;
    }
    if (result?.url) window.location.href = result.url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
            <Layout className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Seddon IT Planner</h1>
          <p className="text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          {hasAzure && (
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={handleMicrosoftSignIn}
              disabled={loading}
            >
              {loading && !showBackup ? 'Signing in…' : 'Sign in with Microsoft'}
            </Button>
          )}

          {hasAzure && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
          )}

          {!showBackup ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowBackup(true)}
            >
              Use backup login (when SSO is down)
            </Button>
          ) : (
            <form onSubmit={handleBackupSignIn} className="space-y-3 p-4 rounded-lg border border-border bg-card">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Backup admin email"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Backup admin password"
                required
              />
              {backupError && (
                <p className="text-sm text-destructive">{backupError}</p>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowBackup(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Signing in…' : 'Backup sign in'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {(error || backupError) && (
          <p className="text-center text-sm text-destructive">
            {error === 'CredentialsSignin' ? 'Backup sign-in failed.' : error ?? backupError}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
