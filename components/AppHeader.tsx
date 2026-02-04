'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import { Layout, Moon, Sun, LogOut, ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  /** Link or action for back (e.g. "/" or "/plans/123"). If set, shows back button. */
  backHref?: string;
  /** Main title (e.g. "Seddon IT Plans" or plan name). */
  title: string;
  /** Optional subtitle under the title. */
  subtitle?: string;
  /** Optional icon - default is Layout. Pass null to hide. */
  showLogo?: boolean;
  /** When true, show branded "Seddon IT Planner" wordmark with red accent instead of plain title. */
  brandTitle?: boolean;
  /** Right-side content (e.g. Import, New Plan, Share, QuickActions). */
  children?: React.ReactNode;
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export function AppHeader({ backHref, title, subtitle, showLogo = true, brandTitle = false, children }: AppHeaderProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined' && isDarkMode !== undefined) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  const displayName = session?.user?.name?.trim() || session?.user?.email || '';
  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#022943]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 min-h-[96px] py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {backHref != null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backHref)}
              className="p-2 flex-shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {showLogo && (
            <div className="p-2.5 bg-[#022943]/10 dark:bg-white/10 rounded-xl flex-shrink-0">
              <Layout className="w-5 h-5 text-[#022943] dark:text-[#4ebec7]" />
            </div>
          )}
          <div className="min-w-0">
            {brandTitle ? (
              <h1 className="flex items-baseline gap-2 flex-wrap" title={title}>
                <span className="text-xl font-extrabold text-[#022943] dark:text-white tracking-tight">Seddon</span>
                <span className="text-xl font-extrabold text-[#022943] dark:text-white tracking-tight">IT</span>
                <span className="text-xl font-extrabold text-[#ed1c24] tracking-tight">Planner</span>
              </h1>
            ) : (
              <h1 className="text-xl font-extrabold text-[#022943] dark:text-white truncate tracking-tight">
                {title}
              </h1>
            )}
            {subtitle != null && subtitle !== '' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
          {children != null && (
            <div className="w-px h-8 bg-slate-200 dark:bg-white/20 mx-1" />
          )}
          <div className="flex items-center gap-2">
            {status === 'authenticated' && (
              <div className="hidden sm:flex items-center gap-3 min-w-0 max-w-[200px] pl-2">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200 dark:ring-white/20 flex-shrink-0"
                  />
                ) : (
                  <div
                    className="h-24 w-24 rounded-full bg-[#022943]/15 dark:bg-[#4ebec7]/20 text-[#022943] dark:text-[#4ebec7] flex items-center justify-center text-lg font-bold flex-shrink-0"
                    aria-hidden
                  >
                    {initials}
                  </div>
                )}
                <span className="text-sm font-semibold text-[#022943] dark:text-white truncate" title={session?.user?.email ?? undefined}>
                  {displayName}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode((d) => !d)}
              className="w-9 h-9 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-9 h-9 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-red-500/10 hover:text-[#ed1c24] dark:hover:text-[#ed1c24]"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
