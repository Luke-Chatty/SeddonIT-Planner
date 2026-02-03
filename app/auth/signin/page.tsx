'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Layout, ShieldAlert, ChevronLeft, Mail, Lock } from 'lucide-react';

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
      .then((d) => {
        const azure = d.hasAzure === true;
        setHasAzure(azure);
        if (!azure) setShowBackup(true); // Only backup available: show form directly
      })
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:bg-[#001524] relative font-sans selection:bg-[#ed1c24]/30 transition-colors duration-300 p-4">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* IT Planner logo / wordmark */}
      <div className="mb-10 relative z-30 group">
        <div className="absolute inset-0 bg-[#022943]/20 dark:bg-primary/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-4 rounded-2xl bg-[#022943] dark:bg-primary shadow-[0_20px_50px_rgba(2,41,67,0.3)] transition-transform duration-300 group-hover:scale-105">
              <Layout className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
          </div>
          <div className="text-center">
            <span className="text-2xl font-extrabold tracking-tight text-[#022943] dark:text-white">
              IT <span className="text-[#ed1c24]">Planner</span>
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
            Infrastructure planning
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-[#022943] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-[440px] overflow-hidden flex flex-col relative z-10 border border-slate-200 dark:border-white/10 transition-all duration-300">
        <div className="p-10 pb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-[#ed1c24] rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ed1c24]/70 dark:text-[#ed1c24]">
              Secure portal
            </span>
            <div className="h-1 w-8 bg-[#ed1c24] rounded-full" />
          </div>

          <h2 className="text-2xl font-extrabold text-[#022943] dark:text-white mb-8 tracking-tight text-center">
            Sign in to continue
          </h2>

          {!showBackup ? (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {hasAzure && (
                <button
                  type="button"
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="w-full h-14 bg-slate-50 dark:bg-white border border-slate-200 dark:border-gray-200 text-[#022943] dark:text-gray-700 hover:bg-slate-100 dark:hover:bg-gray-50 hover:border-slate-300 dark:hover:border-gray-300 transition-all duration-300 font-bold text-[16px] flex items-center justify-center gap-4 shadow-sm rounded-xl active:scale-[0.98] disabled:opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  <span>{loading ? 'Signing in…' : 'Sign in with Microsoft'}</span>
                </button>
              )}

              {hasAzure && (
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-[#022943] px-3 text-slate-500 dark:text-slate-400">or</span>
                  </div>
                </div>
              )}

              {!showBackup ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBackup(true)}
                    className="group flex items-center gap-2 text-sm font-semibold text-slate-400 dark:text-slate-400 hover:text-[#ed1c24] dark:hover:text-[#ed1c24] transition-all duration-300"
                  >
                    <ShieldAlert className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    <span className="border-b border-transparent group-hover:border-[#ed1c24]">
                      Backup login (when SSO is down)
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleBackupSignIn} className="w-full space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-slate-200 dark:border-gray-200 bg-slate-50/50 dark:bg-gray-50/50 focus:ring-2 focus:ring-[#ed1c24]/10 rounded-xl pl-4 text-[#022943] dark:text-gray-900 font-medium"
                    placeholder="Backup admin email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Lock className="w-3 h-3" />
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-slate-200 dark:border-gray-200 bg-slate-50/50 dark:bg-gray-50/50 focus:ring-2 focus:ring-[#ed1c24]/10 rounded-xl pl-4 text-[#022943] dark:text-gray-900 font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {(backupError || error) && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error === 'CredentialsSignin' ? 'Invalid email or password.' : backupError || error}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#022943] hover:bg-[#033a5f] dark:bg-primary dark:hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-[#022943]/20 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowBackup(false); setBackupError(''); }}
                  className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-400 dark:text-slate-400 hover:text-[#022943] dark:hover:text-slate-200 transition-colors py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Single Sign-On
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Seddon color stripe */}
        <div className="h-2.5 w-full flex mt-6">
          <div className="flex-1 bg-[#30b996]" />
          <div className="flex-1 bg-[#e8bf1e]" />
          <div className="flex-1 bg-[#804097]" />
          <div className="flex-1 bg-[#4ebec7]" />
          <div className="flex-1 bg-[#ce167c]" />
          <div className="flex-1 bg-[#f58720]" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center relative z-10">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em] opacity-60">
          Seddon IT Planner &bull; Seddon IT
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:bg-[#001524]">
          <div className="animate-spin w-10 h-10 border-2 border-[#022943] dark:border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
