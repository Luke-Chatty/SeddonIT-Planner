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

export function AppHeader({ backHref, title, subtitle, showLogo = true, children }: AppHeaderProps) {
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
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {backHref != null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backHref)}
              className="p-2 flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {showLogo && (
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Layout className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400 truncate">
              {title}
            </h1>
            {subtitle != null && subtitle !== '' && (
              <p className="text-xs text-muted-foreground truncate max-w-md">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {children}
          {children != null && (
            <div className="w-px h-6 bg-border mx-1" />
          )}
          <div className="flex items-center gap-2">
            {status === 'authenticated' && (
              <div className="hidden sm:flex items-center gap-2 min-w-0 max-w-[180px]">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-border flex-shrink-0"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    aria-hidden
                  >
                    {initials}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground truncate" title={session?.user?.email ?? undefined}>
                  {displayName}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode((d) => !d)}
              className="w-9 h-9 p-0 rounded-full"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-9 h-9 p-0"
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
