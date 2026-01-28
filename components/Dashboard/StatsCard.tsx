import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  className?: string;
  gradient?: string;
}

export function StatsCard({ title, value, icon, trend, className, gradient }: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-4 border border-border/50',
        'bg-card/50 backdrop-blur-md shadow-sm',
        'hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
        className
      )}
    >
      {gradient && (
        <div
          className={cn('absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none', gradient)}
        />
      )}
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg shadow-sm bg-primary/10",
          // If gradient is provided, try to use a matching subtle background if possible, 
          // or just fallback to primary/10 to keep it clean and consistent.
          // For now, let's keep it simple with primary/10 or just a cleaner look.
          "text-primary"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}