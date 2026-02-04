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
    <header className="h-20 flex items-center justify-between px-6 md:px-12 z-20 sticky top-0 bg-white/80 dark:bg-transparent backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 transition-all duration-300">
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
          <div className="p-2.5 bg-white/60 dark:bg-transparent rounded-xl flex-shrink-0 border border-slate-200 dark:border-white/5 shadow-sm">
            <Layout className="w-5 h-5 text-[#022943] dark:text-[#4ebec7]" />
          </div>
        )}
        <div className="min-w-0">
          {brandTitle ? (
            <h1 className="flex items-center gap-2 font-display" title={title}>
              <span className="h-4 w-1 bg-[#ed1c24] rounded-full flex-shrink-0" />
              <span className="text-lg font-black tracking-tighter flex items-center gap-1.5">
                <span className="text-[#022943] dark:text-white">SEDDON</span>
                <span className="text-[#022943] dark:text-white">IT</span>
                <span className="text-[#ed1c24] drop-shadow-[0_0_8px_rgba(237,28,36,0.2)]">PLANNER</span>
              </span>
            </h1>
          ) : (
            <h1 className="text-lg font-extrabold text-[#022943] dark:text-white truncate tracking-tight">
              {title}
            </h1>
          )}
          {subtitle != null && subtitle !== '' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {children}
        {children != null && (
          <div className="w-px h-8 bg-slate-200/50 dark:bg-white/10 mx-1" />
        )}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode((d) => !d)}
            className="h-10 w-10 p-0 rounded-xl bg-white/60 dark:bg-transparent border border-slate-200 dark:border-white/5 hover:text-[#e8bf1e] hover:bg-white dark:hover:bg-white/5 hover:border-[#e8bf1e]/20 text-slate-500 dark:text-slate-400 transition-all shadow-sm hover:shadow-md glass-card"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {status === 'authenticated' && (
            <div className="hidden sm:flex items-center gap-3 pl-4 ml-2 border-l border-slate-200 dark:border-white/5">
              <div className="text-right min-w-0 max-w-[160px]">
                <p className="text-sm font-extrabold text-[#022943] dark:text-white leading-tight truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold truncate">Plan owner</p>
              </div>
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  width={96}
                  height={96}
                  className="h-10 w-10 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 shadow-lg hover:scale-110 transition-transform duration-300 ring-2 ring-transparent hover:ring-[#ed1c24]/30 flex-shrink-0"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-full bg-[#022943] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0 border-2 border-slate-200 dark:border-white/10 shadow-lg hover:scale-110 transition-transform duration-300 ring-2 ring-transparent hover:ring-[#ed1c24]/30"
                  aria-hidden
                >
                  {initials}
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="h-10 w-10 p-0 rounded-xl bg-white/60 dark:bg-transparent border border-slate-200 dark:border-white/5 hover:text-[#ed1c24] hover:bg-white dark:hover:bg-white/5 hover:border-[#ed1c24]/20 text-slate-500 dark:text-slate-400 transition-all shadow-sm hover:shadow-md glass-card"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
