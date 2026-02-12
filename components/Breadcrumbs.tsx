'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = { label: string; href?: string };

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-slate-600 dark:text-slate-400 hover:text-[#022943] dark:hover:text-white font-medium truncate max-w-[140px] sm:max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium truncate max-w-[140px] sm:max-w-[200px]',
                  isLast ? 'text-[#022943] dark:text-white' : 'text-slate-600 dark:text-slate-400'
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
