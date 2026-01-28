'use client';

import { usePlanStore } from '@/lib/store';
import { formatDate, getTaskDuration } from '@/lib/utils';
import { StatsCard } from './StatsCard';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import { useMemo } from 'react';
import { parseISO, differenceInDays, isPast, isFuture } from 'date-fns';

export function PlanOverview() {
  const { plan } = usePlanStore();

  const stats = useMemo(() => {
    if (!plan) return null;

    const totalTasks = plan.tasks.length;
    const completed = plan.tasks.filter(t => t.status === 'completed').length;
    const inProgress = plan.tasks.filter(t => t.status === 'in-progress').length;
    const blocked = plan.tasks.filter(t => t.status === 'blocked').length;
    const notStarted = plan.tasks.filter(t => t.status === 'not-started').length;
    const critical = plan.tasks.filter(t => t.priority === 'critical').length;

    const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    // Calculate timeline progress
    const startDate = parseISO(plan.startDate);
    const endDate = parseISO(plan.endDate);
    const today = new Date();
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(today, startDate);
    const timelineProgress = Math.min(Math.max(Math.round((daysElapsed / totalDays) * 100), 0), 100);

    // Upcoming tasks (next 7 days)
    const upcomingTasks = plan.tasks.filter(task => {
      const taskStart = parseISO(task.startDate);
      const daysUntil = differenceInDays(taskStart, today);
      return daysUntil >= 0 && daysUntil <= 7 && task.status === 'not-started';
    }).length;

    // Overdue tasks
    const overdueTasks = plan.tasks.filter(task => {
      const taskEnd = parseISO(task.endDate);
      return isPast(taskEnd) && task.status !== 'completed';
    }).length;

    return {
      totalTasks,
      completed,
      inProgress,
      blocked,
      notStarted,
      critical,
      completionRate,
      timelineProgress,
      upcomingTasks,
      overdueTasks,
    };
  }, [plan]);

  if (!plan || !stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatsCard
        title="Total Tasks"
        value={stats.totalTasks}
        icon={<Target className="w-5 h-5" />}
        trend={`${stats.completed} completed`}
        gradient="bg-blue-500"
      />
      <StatsCard
        title="Completion"
        value={`${stats.completionRate}%`}
        icon={<CheckCircle2 className="w-5 h-5" />}
        trend={`${stats.completed} of ${stats.totalTasks} tasks`}
        gradient="bg-green-500"
      />
      <StatsCard
        title="In Progress"
        value={stats.inProgress}
        icon={<Clock className="w-5 h-5" />}
        trend={`${stats.notStarted} not started`}
        gradient="bg-purple-500"
      />
      <StatsCard
        title="Critical"
        value={stats.critical}
        icon={<AlertTriangle className="w-5 h-5" />}
        trend={stats.blocked > 0 ? `${stats.blocked} blocked` : 'All clear'}
        gradient="bg-red-500"
      />
    </div>
  );
}