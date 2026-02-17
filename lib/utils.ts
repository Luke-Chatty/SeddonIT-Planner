import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { Task, TaskStatus, TaskPriority } from './types';
import { getTaskNumberById } from './taskHierarchy';

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'MMM dd');
}

export function getTaskDuration(task: Task): number {
  const start = parseISO(task.startDate);
  const end = parseISO(task.endDate);
  if (!isValid(start) || !isValid(end)) return 0;
  return differenceInDays(end, start) + 1;
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'not-started':
      return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 border border-gray-300/50 dark:border-gray-600/50';
    case 'in-progress':
      return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border border-blue-300/50 dark:border-blue-700/50';
    case 'completed':
      return 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 dark:from-green-900/40 dark:to-emerald-800/40 dark:text-green-300 border border-green-300/50 dark:border-green-700/50';
    case 'blocked':
      return 'bg-gradient-to-r from-red-100 to-rose-200 text-red-700 dark:from-red-900/40 dark:to-rose-800/40 dark:text-red-300 border border-red-300/50 dark:border-red-700/50';
    default:
      return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
  }
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-gradient-to-r from-gray-50 to-slate-100 text-gray-600 dark:from-gray-800/60 dark:to-slate-800/60 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50';
    case 'medium':
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-700/50';
    case 'high':
      return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/40 dark:to-red-900/40 dark:text-orange-300 border border-orange-300/50 dark:border-orange-700/50';
    case 'critical':
      return 'bg-gradient-to-r from-red-100 to-rose-200 text-red-700 dark:from-red-900/50 dark:to-rose-900/50 dark:text-red-300 border border-red-300/60 dark:border-red-700/60 shadow-sm shadow-red-200/50 dark:shadow-red-900/30';
    default:
      return 'bg-gradient-to-r from-gray-50 to-slate-100 text-gray-600';
  }
}

/**
 * Generate hierarchical task number (e.g., 1, 1.1, 1.2, 2)
 */
export function getTaskNumber(task: Task, allTasks: Task[]): string {
  return getTaskNumberById(task.id, allTasks);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
